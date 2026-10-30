const subjectService = require("../services/subjectService");

const getSubjects = async (req, res, next) => {
    try {
        const subjects = await subjectService.getSubjects();
        res.json(subjects);
    } catch (err) {
        next(err);
    }
};

const getSubject = async (req, res, next) => {
    try {
        const subject = await subjectService.getSubject(req.params.id);
        res.json(subject);
    } catch (err) {
        next(err);
    }
};

const createSubject = async (req, res, next) => {
    try {
        const subject = await subjectService.createSubject(req.body);
        res.status(201).json(subject);
    } catch (err) {
        next(err);
    }
};

const updateSubject = async (req, res, next) => {
    try {
        const subject = await subjectService.updateSubject(req.params.id, req.body);
        res.json(subject);
    } catch (err) {
        next(err);
    }
};

const deleteSubject = async (req, res, next) => {
    try {
        await subjectService.deleteSubject(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

const getTopics = async (req, res, next) => {
    try {
        const topics = await subjectService.getTopics(req.query.subject_id);
        res.json(topics);
    } catch (err) {
        next(err);
    }
};

const createTopic = async (req, res, next) => {
    try {
        const topic = await subjectService.createTopic(req.body);
        res.status(201).json(topic);
    } catch (err) {
        next(err);
    }
};

const deleteTopic = async (req, res, next) => {
    try {
        await subjectService.deleteTopic(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getSubjects,
    getSubject,
    createSubject,
    updateSubject,
    deleteSubject,
    getTopics,
    createTopic,
    deleteTopic
};
