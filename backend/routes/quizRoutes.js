const express = require("express");
const quizController = require("../controllers/quizController");

const router = express.Router();

router.get("/", quizController.getQuizzes);
router.get("/:id/preview", quizController.previewQuiz);
router.get("/:id", quizController.getQuiz);
router.post("/", quizController.createQuiz);
router.put("/:id", quizController.updateQuiz);
router.delete("/:id", quizController.deleteQuiz);

module.exports = router;
