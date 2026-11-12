const express = require("express");
const authController = require("../controllers/authController");
const { requireLearner } = require("../middleware/learnerSession");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.logIn);
router.get("/profile", requireLearner, authController.getProfile);
router.put("/profile", requireLearner, authController.updateProfile);

module.exports = router;