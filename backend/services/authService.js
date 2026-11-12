const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const learnerAccountModel = require("../models/learnerAccountModel");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateCredentials = ({ display_name, email, password }, includeName) => {
    const normalizedEmail = normalizeEmail(email);

    if (includeName && (!String(display_name || "").trim() || String(display_name).trim().length > 120)) {
        return { error: "Enter a name of 1 to 120 characters." };
    }
    if (normalizedEmail.length > 254 || !emailPattern.test(normalizedEmail)) {
        return { error: "Enter a valid email address." };
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return { error: "Password must be between 8 and 128 characters." };
    }

    return { email: normalizedEmail };
};

const createToken = (learnerId) => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error("JWT_SECRET must be configured with at least 32 characters.");
    }

    return jwt.sign({}, process.env.JWT_SECRET, {
        subject: String(learnerId),
        issuer: "quiz-practice-system",
        audience: "quiz-practice-learners",
        expiresIn: "8h"
    });
};

const makeError = (message, status) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const signUp = async (input = {}) => {
    const credentials = validateCredentials(input, true);
    if (credentials.error) throw makeError(credentials.error, 400);

    if (await learnerAccountModel.findByEmail(credentials.email)) {
        throw makeError("An account with this email already exists.", 409);
    }

    const learner = await learnerAccountModel.create({
        display_name: String(input.display_name).trim(),
        email: credentials.email,
        password_hash: await bcrypt.hash(input.password, 12)
    });

    return { token: createToken(learner.id), user: learner };
};

const logIn = async (input = {}) => {
    const email = normalizeEmail(input.email);
    const learner = await learnerAccountModel.findByEmail(email);
    const passwordMatches = learner && typeof input.password === "string"
        ? await bcrypt.compare(input.password, learner.password_hash)
        : false;

    if (!passwordMatches) {
        throw makeError("Email or password is incorrect.", 401);
    }

    return {
        token: createToken(learner.id),
        user: {
            id: learner.id,
            display_name: learner.display_name,
            email: learner.email
        }
    };
};

const getProfile = async (learnerId) => {
    const learner = await learnerAccountModel.findById(learnerId);
    if (!learner) throw makeError("Learner account not found.", 404);
    return learner;
};

const updateProfile = async (learnerId, input = {}) => {
    const displayName = String(input.display_name || "").trim();
    const email = normalizeEmail(input.email);

    if (!displayName || displayName.length > 120) {
        throw makeError("Enter a name of 1 to 120 characters.", 400);
    }
    if (email.length > 254 || !emailPattern.test(email)) {
        throw makeError("Enter a valid email address.", 400);
    }

    const existing = await learnerAccountModel.findByEmail(email);
    if (existing && Number(existing.id) !== Number(learnerId)) {
        throw makeError("An account with this email already exists.", 409);
    }

    const learner = await learnerAccountModel.updateProfile(learnerId, {
        display_name: displayName,
        email
    });
    if (!learner) throw makeError("Learner account not found.", 404);
    return learner;
};

module.exports = { signUp, logIn, getProfile, updateProfile };