require("dotenv").config();

const express = require("express");
const cors = require("cors");

const questionRoutes = require("./routes/questionRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const quizRoutes = require("./routes/quizRoutes");
const learnerRoutes = require("./routes/learnerRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Quiz Practice System API is running" });
});

app.use("/api/questions", questionRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/learner", learnerRoutes);
app.use("/api/ai", aiRoutes);

app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        message: status === 500 ? "Internal server error" : err.message
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Backend running at http://localhost:${PORT}`);
});
