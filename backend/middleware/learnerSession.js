const jwt = require("jsonwebtoken");

const requireLearner = (req, res, next) => {
    const authorization = String(req.header("Authorization") || "");
    const token = authorization.startsWith("Bearer ")
        ? authorization.slice(7).trim()
        : "";

    if (!token || !process.env.JWT_SECRET) {
        return res.status(401).json({
            message: "Sign in to continue."
        });
    }

    try {
        const claims = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: "quiz-practice-system",
            audience: "quiz-practice-learners"
        });
        const learnerId = Number(claims.sub);

        if (!Number.isInteger(learnerId) || learnerId < 1) {
            return res.status(401).json({ message: "Sign in to continue." });
        }

        req.learnerId = learnerId;
        req.learnerKey = `account:${learnerId}`;
        next();
    } catch (error) {
        res.status(401).json({ message: "Your session is invalid or expired. Sign in again." });
    }
};

module.exports = { requireLearner };
