import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getAttemptResults } from "../services/learnerService";

function LearnerQuizResults() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getAttemptResults(attemptId);
                setResult(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [attemptId]);

    if (loading) {
        return <section className="card"><p>Loading results...</p></section>;
    }

    if (error) {
        return (
            <section className="card">
                <div className="error">{error}</div>
                <button type="button" className="secondary" onClick={() => navigate("/learner")}>
                    Back to quizzes
                </button>
            </section>
        );
    }

    if (!result) return null;

    const correctCount = result.questions.filter((question) => question.is_correct).length;

    return (
        <div>
            <section className="card">
                <h2>Quiz Results: {result.quiz.title}</h2>
                <div className="grid">
                    <p><strong>Score:</strong> {result.attempt.score} / 10</p>
                    <p>
                        <strong>Result:</strong>{" "}
                        <span className={`badge ${result.attempt.passed ? "badge-success" : "badge-danger"}`}>
                            {result.attempt.passed ? "Passed" : "Not passed"}
                        </span>
                    </p>
                    <p><strong>Pass score:</strong> {result.quiz.pass_score} / 10</p>
                    <p><strong>Correct answers:</strong> {correctCount} / {result.questions.length}</p>
                </div>
                <div className="actions">
                    <button type="button" className="secondary" onClick={() => navigate("/learner")}>
                        Browse quizzes
                    </button>
                    <button type="button" onClick={() => navigate("/learner/progress")}>
                        View saved progress
                    </button>
                </div>
            </section>

            {result.questions.map((question, index) => (
                <section className="card" key={question.id}>
                    <div className="flex-between">
                        <strong>Question {index + 1}</strong>
                        <span className={`badge ${question.is_correct ? "badge-success" : "badge-danger"}`}>
                            {question.is_correct ? "Correct" : "Incorrect"}
                        </span>
                    </div>
                    <p style={{ fontWeight: "bold" }}>{question.content}</p>
                    {question.options.map((option) => {
                        const selected = (question.selected_option_ids || []).map(Number).includes(Number(option.id));
                        return (
                            <div
                                key={option.id}
                                style={{
                                    padding: "8px 12px",
                                    marginBottom: "8px",
                                    borderRadius: "6px",
                                    border: option.is_correct ? "1px solid #16a34a" : "1px solid #e2e8f0",
                                    background: option.is_correct ? "#f0fdf4" : selected ? "#fef2f2" : "white"
                                }}
                            >
                                <div className="flex-between">
                                    <span>{option.option_text}</span>
                                    <span>
                                        {selected ? <span className="badge badge-primary">Your answer</span> : null}{" "}
                                        {option.is_correct ? <span className="badge badge-success">Correct</span> : null}
                                    </span>
                                </div>
                                {option.explanation ? (
                                    <p style={{ margin: "8px 0 0 0", color: "#4b5563" }}>
                                        {option.explanation}
                                    </p>
                                ) : null}
                            </div>
                        );
                    })}
                </section>
            ))}
        </div>
    );
}

export default LearnerQuizResults;
