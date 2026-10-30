const API_URL = "http://localhost:5000/api/subjects";

const handleResponse = async (response) => {
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }
    return data;
};

export const getSubjects = async () => {
    const response = await fetch(API_URL);
    return handleResponse(response);
};

export const createSubject = async (subject) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject)
    });
    return handleResponse(response);
};

export const updateSubject = async (id, subject) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subject)
    });
    return handleResponse(response);
};

export const deleteSubject = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });
    return handleResponse(response);
};

export const getTopics = async (subjectId = "") => {
    const response = await fetch(`${API_URL}/topics${subjectId ? `?subject_id=${subjectId}` : ""}`);
    return handleResponse(response);
};

export const createTopic = async (topic) => {
    const response = await fetch(`${API_URL}/topics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(topic)
    });
    return handleResponse(response);
};

export const deleteTopic = async (id) => {
    const response = await fetch(`${API_URL}/topics/${id}`, {
        method: "DELETE"
    });
    return handleResponse(response);
};
