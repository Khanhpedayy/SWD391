const API_URL = "http://localhost:5000/api/quizzes";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }
    return data;
};

export const getQuizzes = async (search = "", subject_id = "", status = "") => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (subject_id) params.set("subject_id", subject_id);
    if (status) params.set("status", status);

    const query = params.toString();
    const response = await fetch(`${API_URL}${query ? `?${query}` : ""}`);
    return handleResponse(response);
};

export const getQuiz = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    return handleResponse(response);
};

export const getQuizPreview = async (id) => {
    const response = await fetch(`${API_URL}/${id}/preview`);
    return handleResponse(response);
};

export const createQuiz = async (quiz) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz)
    });
    return handleResponse(response);
};

export const updateQuiz = async (id, quiz) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz)
    });
    return handleResponse(response);
};

export const deleteQuiz = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });
    return handleResponse(response);
};
