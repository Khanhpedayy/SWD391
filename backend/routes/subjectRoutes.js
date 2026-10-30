const express = require("express");
const subjectController = require("../controllers/subjectController");

const router = express.Router();

router.get("/", subjectController.getSubjects);
router.get("/topics", subjectController.getTopics);
router.post("/topics", subjectController.createTopic);
router.delete("/topics/:id", subjectController.deleteTopic);

router.get("/:id", subjectController.getSubject);
router.post("/", subjectController.createSubject);
router.put("/:id", subjectController.updateSubject);
router.delete("/:id", subjectController.deleteSubject);

module.exports = router;
