const quizModel = require("../models/quizModel");
const attemptModel = require("../models/attemptModel");

const shuffle = (items) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const parseOptionIds = (value) => {
    if (Array.isArray(value)) {
        return value.map(Number).filter((id) => Number.isInteger(id) && id > 0);
    }
    if (value === undefined || value === null || value === "") {
        return [];
    }
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? [id] : [];
};

const sameIdSet = (left, right) => {
    if (left.length !== right.length) return false;
    const a = [...left].sort((x, y) => x - y);
    const b = [...right].sort((x, y) => x - y);
    return a.every((value, index) => value === b[index]);
};

const stripQuestionKeys = (question, optionOrder) => {
    const orderedOptions = Array.isArray(optionOrder) && optionOrder.length
        ? optionOrder
            .map((optionId) => question.options.find((opt) => Number(opt.id) === Number(optionId)))
            .filter(Boolean)
        : question.options;

    return {
        id: question.id,
        content: question.content,
        difficulty: question.difficulty,
        question_type: question.question_type,
        topic: question.topic,
        order_index: question.order_index,
        score_weight: question.score_weight,
        options: (orderedOptions || []).map((opt) => ({
            id: opt.id,
            option_text: opt.option_text
        }))
    };
};

const getPublishedQuizOrThrow = async (id) => {
    const quiz = await quizModel.findById(id);
    if (!quiz || quiz.status !== "Published") {
        const error = new Error("Published quiz not found.");
        error.status = 404;
        throw error;
    }
    return quiz;
};

const getOwnedAttemptOrThrow = async (attemptId, learnerKey) => {
    const attempt = await attemptModel.findById(attemptId);
    if (!attempt || attempt.learner_key !== learnerKey) {
        const error = new Error("Attempt not found.");
        error.status = 404;
        throw error;
    }
    return attempt;
};

const listPublishedQuizzes = async ({ search = "", subject_id = "", topic = "" }) => {
    const quizzes = await quizModel.findAll({
        search,
        subject_id,
        status: "Published"
    });

    if (!topic) return quizzes;

    const needle = topic.trim().toLowerCase();
    return quizzes.filter((quiz) => String(quiz.topic || "").toLowerCase().includes(needle));
};

const getPublishedQuizDetails = async (id) => {
    const quiz = await getPublishedQuizOrThrow(id);
    return {
        id: quiz.id,
        title: quiz.title,
        subject_id: quiz.subject_id,
        subject_name: quiz.subject_name,
        topic: quiz.topic,
        duration_minutes: quiz.duration_minutes,
        pass_score: quiz.pass_score,
        shuffle_questions: Boolean(quiz.shuffle_questions),
        shuffle_options: Boolean(quiz.shuffle_options),
        status: quiz.status,
        question_count: quiz.questions.length,
        questions: quiz.questions.map((question) => ({
            id: question.id,
            content: question.content,
            difficulty: question.difficulty,
            question_type: question.question_type,
            topic: question.topic,
            score_weight: question.score_weight
        }))
    };
};

const buildOrderedQuestions = (quiz, attempt) => {
    const questionMap = new Map(quiz.questions.map((question) => [Number(question.id), question]));
    const orderedIds = attempt.question_order.length
        ? attempt.question_order
        : quiz.questions.map((question) => question.id);

    return orderedIds
        .map((questionId) => questionMap.get(Number(questionId)))
        .filter(Boolean)
        .map((question) => stripQuestionKeys(
            question,
            attempt.option_order ? attempt.option_order[String(question.id)] : null
        ));
};

const startOrResumeAttempt = async (quizId, learnerKey) => {
    const quiz = await getPublishedQuizOrThrow(quizId);

    if (!quiz.questions.length) {
        const error = new Error("This quiz has no questions yet.");
        error.status = 400;
        throw error;
    }

    const existing = await attemptModel.findInProgressByQuiz(quizId, learnerKey);
    if (existing) {
        return getPracticePayload(existing.id, learnerKey);
    }

    let questions = [...quiz.questions];
    if (quiz.shuffle_questions) {
        questions = shuffle(questions);
    }

    const optionOrder = {};
    questions.forEach((question) => {
        const optionIds = (question.options || []).map((opt) => opt.id);
        optionOrder[String(question.id)] = quiz.shuffle_options ? shuffle(optionIds) : optionIds;
    });

    const attempt = await attemptModel.create({
        quiz_id: quiz.id,
        learner_key: learnerKey,
        question_order: questions.map((question) => question.id),
        option_order: optionOrder
    });

    return getPracticePayload(attempt.id, learnerKey);
};

const getPracticePayload = async (attemptId, learnerKey) => {
    const attempt = await getOwnedAttemptOrThrow(attemptId, learnerKey);
    const quiz = await getPublishedQuizOrThrow(attempt.quiz_id);
    const savedAnswers = await attemptModel.findAnswers(attemptId);

    const answers = {};
    savedAnswers.forEach((answer) => {
        answers[answer.question_id] = answer.selected_option_ids;
    });

    return {
        attempt: {
            id: attempt.id,
            quiz_id: attempt.quiz_id,
            status: attempt.status,
            started_at: attempt.started_at,
            submitted_at: attempt.submitted_at,
            score: attempt.status === "Submitted" ? attempt.score : null,
            passed: attempt.status === "Submitted" ? attempt.passed : null
        },
        quiz: {
            id: quiz.id,
            title: quiz.title,
            subject_name: quiz.subject_name,
            topic: quiz.topic,
            duration_minutes: quiz.duration_minutes,
            pass_score: quiz.pass_score
        },
        questions: buildOrderedQuestions(quiz, attempt),
        answers
    };
};

const normalizeIncomingAnswers = (questions, incoming) => {
    if (!Array.isArray(incoming)) {
        const error = new Error("answers must be an array.");
        error.status = 400;
        throw error;
    }

    const questionMap = new Map(questions.map((question) => [Number(question.id), question]));
    const normalized = [];

    for (const item of incoming) {
        const questionId = Number(item.question_id);
        const question = questionMap.get(questionId);
        if (!question) {
            const error = new Error(`Question ${item.question_id} is not part of this quiz.`);
            error.status = 400;
            throw error;
        }

        const selected = parseOptionIds(
            item.selected_option_ids !== undefined ? item.selected_option_ids : item.selected_option_id
        );
        const validOptionIds = new Set((question.options || []).map((opt) => Number(opt.id)));
        const invalid = selected.find((optionId) => !validOptionIds.has(optionId));
        if (invalid) {
            const error = new Error(`Invalid option for question ${questionId}.`);
            error.status = 400;
            throw error;
        }

        if (question.question_type !== "Multiple Choice" && selected.length > 1) {
            const error = new Error(`Question ${questionId} allows only one answer.`);
            error.status = 400;
            throw error;
        }

        normalized.push({
            question_id: questionId,
            selected_option_ids: selected
        });
    }

    return normalized;
};

const saveProgress = async (attemptId, learnerKey, answers) => {
    const attempt = await getOwnedAttemptOrThrow(attemptId, learnerKey);
    if (attempt.status === "Submitted") {
        const error = new Error("This attempt has already been submitted.");
        error.status = 400;
        throw error;
    }

    const quiz = await getPublishedQuizOrThrow(attempt.quiz_id);
    const normalized = normalizeIncomingAnswers(quiz.questions, answers);
    await attemptModel.saveAnswers(attemptId, normalized);
    return getPracticePayload(attemptId, learnerKey);
};

const gradeAttempt = (quiz, answersByQuestion) => {
    let earned = 0;
    let totalWeight = 0;
    const gradedAnswers = [];
    const review = [];

    quiz.questions.forEach((question) => {
        const weight = Number(question.score_weight) || 1;
        totalWeight += weight;
        const selected = answersByQuestion.get(Number(question.id)) || [];
        const correctIds = (question.options || [])
            .filter((opt) => Number(opt.is_correct) === 1)
            .map((opt) => Number(opt.id));
        const isCorrect = correctIds.length > 0 && sameIdSet(selected, correctIds);

        if (isCorrect) {
            earned += weight;
        }

        gradedAnswers.push({
            question_id: question.id,
            selected_option_ids: selected,
            is_correct: isCorrect
        });

        review.push({
            id: question.id,
            content: question.content,
            difficulty: question.difficulty,
            question_type: question.question_type,
            topic: question.topic,
            score_weight: weight,
            is_correct: isCorrect,
            selected_option_ids: selected,
            options: (question.options || []).map((opt) => ({
                id: opt.id,
                option_text: opt.option_text,
                is_correct: Boolean(Number(opt.is_correct)),
                explanation: opt.explanation || null
            }))
        });
    });

    const score = totalWeight === 0 ? 0 : Number(((earned / totalWeight) * 10).toFixed(2));
    const passed = score >= Number(quiz.pass_score);

    return { score, passed, gradedAnswers, review };
};

const submitAttempt = async (attemptId, learnerKey, answers) => {
    const attempt = await getOwnedAttemptOrThrow(attemptId, learnerKey);
    if (attempt.status === "Submitted") {
        return getResults(attemptId, learnerKey);
    }

    const quiz = await getPublishedQuizOrThrow(attempt.quiz_id);
    const normalized = normalizeIncomingAnswers(quiz.questions, answers);
    const answersByQuestion = new Map(
        normalized.map((answer) => [answer.question_id, answer.selected_option_ids])
    );

    const { score, passed, gradedAnswers, review } = gradeAttempt(quiz, answersByQuestion);
    const submitted = await attemptModel.markSubmitted(attemptId, {
        score,
        passed,
        gradedAnswers
    });

    return {
        attempt: {
            id: submitted.id,
            quiz_id: submitted.quiz_id,
            status: submitted.status,
            started_at: submitted.started_at,
            submitted_at: submitted.submitted_at,
            score: submitted.score,
            passed: submitted.passed
        },
        quiz: {
            id: quiz.id,
            title: quiz.title,
            subject_name: quiz.subject_name,
            topic: quiz.topic,
            duration_minutes: quiz.duration_minutes,
            pass_score: quiz.pass_score
        },
        questions: review
    };
};

const getResults = async (attemptId, learnerKey) => {
    const attempt = await getOwnedAttemptOrThrow(attemptId, learnerKey);
    if (attempt.status !== "Submitted") {
        const error = new Error("Results are available only after the quiz is submitted.");
        error.status = 403;
        throw error;
    }

    const quiz = await quizModel.findById(attempt.quiz_id);
    const savedAnswers = await attemptModel.findAnswers(attemptId);
    const answersByQuestion = new Map(
        savedAnswers.map((answer) => [Number(answer.question_id), answer.selected_option_ids])
    );
    const { review } = gradeAttempt(quiz, answersByQuestion);

    return {
        attempt: {
            id: attempt.id,
            quiz_id: attempt.quiz_id,
            status: attempt.status,
            started_at: attempt.started_at,
            submitted_at: attempt.submitted_at,
            score: attempt.score,
            passed: attempt.passed
        },
        quiz: {
            id: quiz.id,
            title: quiz.title,
            subject_name: quiz.subject_name,
            topic: quiz.topic,
            duration_minutes: quiz.duration_minutes,
            pass_score: quiz.pass_score
        },
        questions: review
    };
};

const listAttempts = (learnerKey, filters) => attemptModel.findByLearner(learnerKey, filters);

module.exports = {
    listPublishedQuizzes,
    getPublishedQuizDetails,
    startOrResumeAttempt,
    getPracticePayload,
    saveProgress,
    submitAttempt,
    getResults,
    listAttempts
};
