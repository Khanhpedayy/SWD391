import { learnerHeaders } from "./learnerSession";

const API_URL = "http://localhost:5000/api/learner";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }
    return data;
};

export const getPublishedQuizzes = async (search = "", subject_id = "", topic = "") => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (subject_id) params.set("subject_id", subject_id);
    if (topic) params.set("topic", topic);
    const query = params.toString();
    const response = await fetch(`${API_URL}/quizzes${query ? `?${query}` : ""}`, {
        headers: learnerHeaders()
    });
    return handleResponse(response);
};

export const getPublishedQuizDetails = async (id) => {
    const response = await fetch(`${API_URL}/quizzes/${id}`, {
        headers: learnerHeaders()
    });
    return handleResponse(response);
};

export const startOrResumeQuiz = async (quizId) => {
    const response = await fetch(`${API_URL}/quizzes/${quizId}/attempts`, {
        method: "POST",
        headers: learnerHeaders(),
        body: JSON.stringify({})
    });
    return handleResponse(response);
};

export const getPracticeAttempt = async (attemptId) => {
    const response = await fetch(`${API_URL}/attempts/${attemptId}`, {
        headers: learnerHeaders()
    });
    return handleResponse(response);
};

export const saveAttemptProgress = async (attemptId, answers) => {
    const response = await fetch(`${API_URL}/attempts/${attemptId}/progress`, {
        method: "PUT",
        headers: learnerHeaders(),
        body: JSON.stringify({ answers })
    });
    return handleResponse(response);
};

export const submitAttempt = async (attemptId, answers) => {
    const response = await fetch(`${API_URL}/attempts/${attemptId}/submit`, {
        method: "POST",
        headers: learnerHeaders(),
        body: JSON.stringify({ answers })
    });
    return handleResponse(response);
};

export const getAttemptResults = async (attemptId) => {
    const response = await fetch(`${API_URL}/attempts/${attemptId}/results`, {
        headers: learnerHeaders()
    });
    return handleResponse(response);
};

export const getLearnerAttempts = async (status = "") => {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await fetch(`${API_URL}/attempts${query}`, {
        headers: learnerHeaders()
    });
    return handleResponse(response);
};
