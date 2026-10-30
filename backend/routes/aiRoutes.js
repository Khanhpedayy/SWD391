const express = require("express");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    })
    : null;

router.post("/chat", async (req, res) => {
    try {
        const { messages } = req.body;

        // Validate conversation history
        if (!Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({
                message: "Please provide a valid messages array."
            });
        }

        if (!ai) {
            return res.status(500).json({
                message: "GEMINI_API_KEY is not configured in backend/.env."
            });
        }

        // Keep only valid user and assistant messages
        const validMessages = messages
            .filter(
                (item) =>
                    ["user", "assistant"].includes(item.role) &&
                    typeof item.content === "string" &&
                    item.content.trim()
            )
            .slice(-12);

        if (validMessages.length === 0) {
            return res.status(400).json({
                message: "No valid messages found."
            });
        }

        // Convert frontend roles to Gemini roles
        const geminiMessages = validMessages.map((item) => ({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content }]
        }));

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            systemInstruction:
                "You are an AI tutor for a Quiz Practice System. " +
                "Answer in the same language as the student. " +
                "Explain concepts and quiz answers clearly. " +
                "When asked to create multiple-choice questions, " +
                "provide answer options and explain the correct answer.",
            contents: geminiMessages
        });

        return res.json({
            reply: response.text || "AI chưa tạo được câu trả lời. Vui lòng thử lại."
        });
    } catch (error) {
        console.error("Gemini API error:", error.message);

        return res.status(502).json({
            message: "Không thể kết nối Gemini AI. Vui lòng kiểm tra API key, model và hạn mức API."
        });
    }
});

module.exports = router;