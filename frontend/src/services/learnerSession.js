const STORAGE_KEY = "learner_access_token";

export const getLearnerToken = () => sessionStorage.getItem(STORAGE_KEY);

export const setLearnerToken = (token) => sessionStorage.setItem(STORAGE_KEY, token);

export const clearLearnerToken = () => sessionStorage.removeItem(STORAGE_KEY);

export const isLearnerAuthenticated = () => Boolean(getLearnerToken());

export const learnerHeaders = (extra = {}) => ({
    "Content-Type": "application/json",
    ...(getLearnerToken() ? { Authorization: `Bearer ${getLearnerToken()}` } : {}),
    ...extra
});
