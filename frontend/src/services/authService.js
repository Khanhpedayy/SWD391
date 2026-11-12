import { learnerHeaders, setLearnerToken } from "./learnerSession";

const API_URL = "http://localhost:5000/api/auth";

const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Request failed.");
    if (data.token) setLearnerToken(data.token);
    return data;
};

export const signUpLearner = async (account) => {
    const response = await fetch(`${API_URL}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account)
    });
    return handleResponse(response);
};

export const logInLearner = async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
    });
    return handleResponse(response);
};

export const getLearnerProfile = async () => {
    const response = await fetch(`${API_URL}/profile`, { headers: learnerHeaders() });
    return handleResponse(response);
};

export const updateLearnerProfile = async (profile) => {
    const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: learnerHeaders(),
        body: JSON.stringify(profile)
    });
    return handleResponse(response);
};