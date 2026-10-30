const questionService = require("../services/questionService");

const getQuestions = async (req, res, next) => {
    try {
        const questions = await questionService.getQuestions({
            search: req.query.search || "",
            difficulty: req.query.difficulty || "",
            topic: req.query.topic || ""
        });

        res.json(questions);
    } catch (error) {
        next(error);
    }
};

const getQuestion = async (req, res, next) => {
    try {
        const question = await questionService.getQuestion(req.params.id);
        res.json(question);
    } catch (error) {
        next(error);
    }
};

const createQuestion = async (req, res, next) => {
    try {
        const question = await questionService.createQuestion(req.body);

        res.status(201).json({
            message: "Question created successfully.",
            data: question
        });
    } catch (error) {
        next(error);
    }
};

const updateQuestion = async (req, res, next) => {
    try {
        const question = await questionService.updateQuestion(
            req.params.id,
            req.body
        );

        res.json({
            message: "Question updated successfully.",
            data: question
        });
    } catch (error) {
        next(error);
    }
};

const deleteQuestion = async (req, res, next) => {
    try {
        await questionService.deleteQuestion(req.params.id);

        res.json({
            message: "Question deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

const importQuestions = async (req, res, next) => {
    try {
        const list = req.body.questions || req.body;
        const result = await questionService.importQuestions(list);
        res.status(201).json({
            message: `Successfully imported ${result.length} questions.`,
            count: result.length,
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    importQuestions
};
