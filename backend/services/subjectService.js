const subjectModel = require("../models/subjectModel");

const getSubjects = async () => {
    return subjectModel.findAllSubjects();
};

const getSubject = async (id) => {
    const subject = await subjectModel.findSubjectById(id);
    if (!subject) {
        const error = new Error("Subject not found.");
        error.status = 404;
        throw error;
    }
    return subject;
};

const createSubject = async (data) => {
    if (!data.name || !data.name.trim()) {
        const error = new Error("Subject name is required.");
        error.status = 400;
        throw error;
    }
    if (!data.code || !data.code.trim()) {
        const error = new Error("Subject code is required.");
        error.status = 400;
        throw error;
    }
    return subjectModel.createSubject({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description ? data.description.trim() : "",
        status: data.status || "Active"
    });
};

const updateSubject = async (id, data) => {
    await getSubject(id);
    return subjectModel.updateSubject(id, {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description ? data.description.trim() : "",
        status: data.status || "Active"
    });
};

const deleteSubject = async (id) => {
    const deleted = await subjectModel.deleteSubject(id);
    if (!deleted) {
        const error = new Error("Subject not found.");
        error.status = 404;
        throw error;
    }
};

const getTopics = async (subjectId) => {
    if (subjectId) {
        return subjectModel.findTopicsBySubjectId(subjectId);
    }
    return subjectModel.findAllTopics();
};

const createTopic = async (data) => {
    if (!data.subject_id) {
        const error = new Error("Subject ID is required for a topic.");
        error.status = 400;
        throw error;
    }
    if (!data.name || !data.name.trim()) {
        const error = new Error("Topic name is required.");
        error.status = 400;
        throw error;
    }
    return subjectModel.createTopic({
        subject_id: data.subject_id,
        name: data.name.trim(),
        description: data.description ? data.description.trim() : ""
    });
};

const deleteTopic = async (id) => {
    const deleted = await subjectModel.deleteTopic(id);
    if (!deleted) {
        const error = new Error("Topic not found.");
        error.status = 404;
        throw error;
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
