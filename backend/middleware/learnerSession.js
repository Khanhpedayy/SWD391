const requireLearner = (req, res, next) => {
    const learnerKey = String(req.header("X-Learner-Key") || "").trim();

    if (!learnerKey || learnerKey.length < 8 || learnerKey.length > 64) {
        return res.status(401).json({
            message: "A valid learner session is required."
        });
    }

    req.learnerKey = learnerKey;
    next();
};

module.exports = { requireLearner };
