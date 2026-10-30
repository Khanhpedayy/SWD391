const quizService = require("../services/quizService");

const getQuizzes = async (req, res, next) => {
    try {
        const quizzes = await quizService.getQuizzes({
            search: req.query.search || "",
            subject_id: req.query.subject_id || "",
            status: req.query.status || ""
        });
        res.json(quizzes);
    } catch (error) {
        next(error);
    }
};

const getQuiz = async (req, res, next) => {
    try {
        const quiz = await quizService.getQuiz(req.params.id);
        res.json(quiz);
    } catch (error) {
        next(error);
    }
};

const createQuiz = async (req, res, next) => {
    try {
        const quiz = await quizService.createQuiz(req.body);
        res.status(201).json({
            message: "Quiz created successfully.",
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};

const updateQuiz = async (req, res, next) => {
    try {
        const quiz = await quizService.updateQuiz(req.params.id, req.body);
        res.json({
            message: "Quiz updated successfully.",
            data: quiz
        });
    } catch (error) {
        next(error);
    }
};

const deleteQuiz = async (req, res, next) => {
    try {
        await quizService.deleteQuiz(req.params.id);
        res.json({
            message: "Quiz deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

const previewQuiz = async (req, res, next) => {
    try {
        const previewData = await quizService.previewQuiz(req.params.id);
        res.json(previewData);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getQuizzes,
    getQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    previewQuiz
};
