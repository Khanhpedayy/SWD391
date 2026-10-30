const STORAGE_KEY = "learner_key";

export const getLearnerKey = () => {
    let key = localStorage.getItem(STORAGE_KEY);
    if (!key) {
        key = crypto.randomUUID();
        localStorage.setItem(STORAGE_KEY, key);
    }
    return key;
};

export const learnerHeaders = (extra = {}) => ({
    "Content-Type": "application/json",
    "X-Learner-Key": getLearnerKey(),
    ...extra
});
