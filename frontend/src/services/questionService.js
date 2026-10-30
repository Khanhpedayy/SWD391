const API_URL = "http://localhost:5000/api/questions";

const handleResponse = async (response) => {
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
};

export const getQuestions = async (search = "", difficulty = "") => {
    const params = new URLSearchParams();

    if (search) params.set("search", search);
    if (difficulty) params.set("difficulty", difficulty);

    const query = params.toString();

    const response = await fetch(
        `${API_URL}${query ? `?${query}` : ""}`
    );

    return handleResponse(response);
};

export const getQuestion = async (id) => {
    const response = await fetch(`${API_URL}/${id}`);
    return handleResponse(response);
};

export const createQuestion = async (question) => {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(question)
    });

    return handleResponse(response);
};

export const updateQuestion = async (id, question) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(question)
    });

    return handleResponse(response);
};

export const deleteQuestion = async (id) => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
    });

    return handleResponse(response);
};

export const importQuestions = async (questions) => {
    const response = await fetch(`${API_URL}/import`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ questions })
    });

    return handleResponse(response);
};
