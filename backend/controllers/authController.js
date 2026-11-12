const authService = require("../services/authService");

const signUp = async (req, res, next) => {
    try {
        res.status(201).json(await authService.signUp(req.body));
    } catch (error) {
        next(error);
    }
};

const logIn = async (req, res, next) => {
    try {
        res.json(await authService.logIn(req.body));
    } catch (error) {
        next(error);
    }
};

const getProfile = async (req, res, next) => {
    try {
        res.json(await authService.getProfile(req.learnerId));
    } catch (error) {
        next(error);
    }
};

const updateProfile = async (req, res, next) => {
    try {
        res.json(await authService.updateProfile(req.learnerId, req.body));
    } catch (error) {
        next(error);
    }
};

module.exports = { signUp, logIn, getProfile, updateProfile };