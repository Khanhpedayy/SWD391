const quizModel = require("../models/quizModel");
const subjectModel = require("../models/subjectModel");
const questionModel = require("../models/questionModel");

const VALID_STATUSES = ["Draft", "Published", "Archived"];

const validateQuiz = (data) => {
    if (!data.title || !data.title.trim()) {
        return "Quiz title is required.";
    }
    if (data.duration_minutes !== undefined && Number(data.duration_minutes) <= 0) {
        return "Duration must be greater than 0 minutes.";
    }
    if (data.pass_score !== undefined && (Number(data.pass_score) < 0 || Number(data.pass_score) > 10)) {
        return "Pass score must be between 0 and 10.";
    }
    if (data.status !== undefined && data.status !== "" && !VALID_STATUSES.includes(data.status)) {
        return "Invalid status. Choose Draft, Published, or Archived.";
    }
    if (data.question_ids !== undefined && !Array.isArray(data.question_ids)) {
        return "question_ids must be an array.";
    }
    return null;
};

const assertSubjectExists = async (subjectId) => {
    if (!subjectId) return null;

    const subject = await subjectModel.findSubjectById(subjectId);
    if (!subject) {
        const error = new Error("Subject not found.");
        error.status = 400;
        throw error;
    }

    return Number(subjectId);
};

const normalizeQuestionIds = async (questionIds) => {
    if (!Array.isArray(questionIds)) return [];

    const normalized = [];

    for (const questionId of questionIds) {
        const id = Number(questionId);
        if (!Number.isInteger(id) || id <= 0) {
            const error = new Error(`Invalid question id: ${questionId}.`);
            error.status = 400;
            throw error;
        }

        const question = await questionModel.findById(id);
        if (!question) {
            const error = new Error(`Question not found: ${id}.`);
            error.status = 400;
            throw error;
        }

        if (!normalized.includes(id)) {
            normalized.push(id);
        }
    }

    return normalized;
};

const getQuizzes = (filters) => quizModel.findAll(filters);

const getQuiz = async (id) => {
    const quiz = await quizModel.findById(id);
    if (!quiz) {
        const error = new Error("Quiz not found.");
        error.status = 404;
        throw error;
    }
    return quiz;
};

const createQuiz = async (data) => {
    const errorMessage = validateQuiz(data);
    if (errorMessage) {
        const error = new Error(errorMessage);
        error.status = 400;
        throw error;
    }

    const subjectId = await assertSubjectExists(
        data.subject_id ? Number(data.subject_id) : null
    );
    const questionIds = await normalizeQuestionIds(
        Array.isArray(data.question_ids) ? data.question_ids : []
    );

    return quizModel.create({
        title: data.title.trim(),
        subject_id: subjectId,
        topic: data.topic ? data.topic.trim() : "General",
        duration_minutes: data.duration_minutes !== undefined ? Number(data.duration_minutes) : 60,
        pass_score: data.pass_score !== undefined ? Number(data.pass_score) : 5.0,
        shuffle_questions: data.shuffle_questions !== undefined ? Boolean(data.shuffle_questions) : true,
        shuffle_options: data.shuffle_options !== undefined ? Boolean(data.shuffle_options) : true,
        status: data.status || "Draft",
        question_ids: questionIds
    });
};

const updateQuiz = async (id, data) => {
    const errorMessage = validateQuiz(data);
    if (errorMessage) {
        const error = new Error(errorMessage);
        error.status = 400;
        throw error;
    }

    await getQuiz(id);

    const subjectId = await assertSubjectExists(
        data.subject_id ? Number(data.subject_id) : null
    );
    const questionIds = data.question_ids !== undefined
        ? await normalizeQuestionIds(data.question_ids)
        : undefined;

    return quizModel.update(id, {
        title: data.title.trim(),
        subject_id: subjectId,
        topic: data.topic ? data.topic.trim() : "General",
        duration_minutes: data.duration_minutes !== undefined ? Number(data.duration_minutes) : 60,
        pass_score: data.pass_score !== undefined ? Number(data.pass_score) : 5.0,
        shuffle_questions: data.shuffle_questions !== undefined ? Boolean(data.shuffle_questions) : true,
        shuffle_options: data.shuffle_options !== undefined ? Boolean(data.shuffle_options) : true,
        status: data.status || "Draft",
        question_ids: questionIds
    });
};

const deleteQuiz = async (id) => {
    const deleted = await quizModel.remove(id);
    if (!deleted) {
        const error = new Error("Quiz not found.");
        error.status = 404;
        throw error;
    }
};

const previewQuiz = async (id) => {
    const quiz = await getQuiz(id);
    let questions = [...quiz.questions];

    if (quiz.shuffle_questions) {
        questions.sort(() => Math.random() - 0.5);
    }

    if (quiz.shuffle_options) {
        questions = questions.map((q) => ({
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
        }));
    }

    return {
        ...quiz,
        questions
    };
};

module.exports = {
    getQuizzes,
    getQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    previewQuiz
};
