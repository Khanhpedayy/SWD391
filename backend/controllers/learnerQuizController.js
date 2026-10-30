const learnerQuizService = require("../services/learnerQuizService");

const listQuizzes = async (req, res, next) => {
    try {
        const quizzes = await learnerQuizService.listPublishedQuizzes({
            search: req.query.search || "",
            subject_id: req.query.subject_id || "",
            topic: req.query.topic || ""
        });
        res.json(quizzes);
    } catch (error) {
        next(error);
    }
};

const getQuizDetails = async (req, res, next) => {
    try {
        const quiz = await learnerQuizService.getPublishedQuizDetails(req.params.id);
        res.json(quiz);
    } catch (error) {
        next(error);
    }
};

const startAttempt = async (req, res, next) => {
    try {
        const payload = await learnerQuizService.startOrResumeAttempt(
            req.params.id,
            req.learnerKey
        );
        res.status(201).json(payload);
    } catch (error) {
        next(error);
    }
};

const getPractice = async (req, res, next) => {
    try {
        const payload = await learnerQuizService.getPracticePayload(
            req.params.attemptId,
            req.learnerKey
        );
        res.json(payload);
    } catch (error) {
        next(error);
    }
};

const saveProgress = async (req, res, next) => {
    try {
        const payload = await learnerQuizService.saveProgress(
            req.params.attemptId,
            req.learnerKey,
            req.body.answers || []
        );
        res.json({
            message: "Progress saved.",
            data: payload
        });
    } catch (error) {
        next(error);
    }
};

const submitAttempt = async (req, res, next) => {
    try {
        const result = await learnerQuizService.submitAttempt(
            req.params.attemptId,
            req.learnerKey,
            req.body.answers || []
        );
        res.json({
            message: "Quiz submitted successfully.",
            data: result
        });
    } catch (error) {
        next(error);
    }
};

const getResults = async (req, res, next) => {
    try {
        const result = await learnerQuizService.getResults(
            req.params.attemptId,
            req.learnerKey
        );
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const listAttempts = async (req, res, next) => {
    try {
        const attempts = await learnerQuizService.listAttempts(req.learnerKey, {
            status: req.query.status || ""
        });
        res.json(attempts);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    listQuizzes,
    getQuizDetails,
    startAttempt,
    getPractice,
    saveProgress,
    submitAttempt,
    getResults,
    listAttempts
};
