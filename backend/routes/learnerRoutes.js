const express = require("express");
const learnerQuizController = require("../controllers/learnerQuizController");
const { requireLearner } = require("../middleware/learnerSession");

const router = express.Router();

router.use(requireLearner);

router.get("/quizzes", learnerQuizController.listQuizzes);
router.get("/quizzes/:id", learnerQuizController.getQuizDetails);
router.post("/quizzes/:id/attempts", learnerQuizController.startAttempt);

router.get("/attempts", learnerQuizController.listAttempts);
router.get("/attempts/:attemptId", learnerQuizController.getPractice);
router.put("/attempts/:attemptId/progress", learnerQuizController.saveProgress);
router.post("/attempts/:attemptId/submit", learnerQuizController.submitAttempt);
router.get("/attempts/:attemptId/results", learnerQuizController.getResults);

module.exports = router;
