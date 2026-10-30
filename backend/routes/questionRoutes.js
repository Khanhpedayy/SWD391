const express = require("express");

const questionController = require("../controllers/questionController");

const router = express.Router();

router.get("/", questionController.getQuestions);
router.post("/import", questionController.importQuestions);
router.get("/:id", questionController.getQuestion);
router.post("/", questionController.createQuestion);
router.put("/:id", questionController.updateQuestion);
router.delete("/:id", questionController.deleteQuestion);

module.exports = router;
