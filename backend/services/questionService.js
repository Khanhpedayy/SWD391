const questionModel = require("../models/questionModel");

const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];
const VALID_TYPES = ["Single Choice", "Multiple Choice", "True/False"];

const validateQuestion = (data) => {
    if (!data.content || !data.content.trim()) {
        return "Question content is required.";
    }

    if (!VALID_DIFFICULTIES.includes(data.difficulty)) {
        return "Invalid difficulty. Choose Easy, Medium, or Hard.";
    }

    if (!VALID_TYPES.includes(data.question_type)) {
        return "Invalid question type. Choose Single Choice, Multiple Choice, or True/False.";
    }

    if (!data.topic || !data.topic.trim()) {
        return "Topic is required.";
    }

    return null;
};

const getQuestions = (filters) => questionModel.findAll(filters);

const getQuestion = async (id) => {
    const question = await questionModel.findById(id);

    if (!question) {
        const error = new Error("Question not found.");
        error.status = 404;
        throw error;
    }

    return question;
};

const createQuestion = async (data) => {
    const errorMessage = validateQuestion(data);

    if (errorMessage) {
        const error = new Error(errorMessage);
        error.status = 400;
        throw error;
    }

    return questionModel.create({
        content: data.content.trim(),
        difficulty: data.difficulty,
        question_type: data.question_type,
        topic: data.topic.trim(),
        options: Array.isArray(data.options) ? data.options : []
    });
};

const updateQuestion = async (id, data) => {
    const errorMessage = validateQuestion(data);

    if (errorMessage) {
        const error = new Error(errorMessage);
        error.status = 400;
        throw error;
    }

    const question = await questionModel.update(id, {
        content: data.content.trim(),
        difficulty: data.difficulty,
        question_type: data.question_type,
        topic: data.topic.trim(),
        options: Array.isArray(data.options) ? data.options : undefined
    });

    if (!question) {
        const error = new Error("Question not found.");
        error.status = 404;
        throw error;
    }

    return question;
};

const deleteQuestion = async (id) => {
    const deleted = await questionModel.remove(id);

    if (!deleted) {
        const error = new Error("Question not found.");
        error.status = 404;
        throw error;
    }
};

const importQuestions = async (questionsList) => {
    if (!Array.isArray(questionsList) || questionsList.length === 0) {
        const error = new Error("A non-empty list of questions is required.");
        error.status = 400;
        throw error;
    }

    const validQuestions = [];
    for (let i = 0; i < questionsList.length; i++) {
        const item = questionsList[i];
        const error = validateQuestion(item);
        if (error) {
            const err = new Error(`Item ${i + 1}: ${error}`);
            err.status = 400;
            throw err;
        }
        validQuestions.push({
            content: item.content.trim(),
            difficulty: item.difficulty,
            question_type: item.question_type,
            topic: item.topic.trim(),
            options: Array.isArray(item.options) ? item.options : []
        });
    }

    return questionModel.bulkCreate(validQuestions);
};

module.exports = {
    getQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    importQuestions
};
