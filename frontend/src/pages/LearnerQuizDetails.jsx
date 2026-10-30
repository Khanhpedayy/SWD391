import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPublishedQuizDetails, startOrResumeQuiz } from "../services/learnerService";

function LearnerQuizDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getPublishedQuizDetails(id);
                setQuiz(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleStart = async () => {
        try {
            setStarting(true);
            setError("");
            const payload = await startOrResumeQuiz(id);
            navigate(`/learner/practice/${payload.attempt.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setStarting(false);
        }
    };

    if (loading) {
        return <section className="card"><p>Loading quiz details...</p></section>;
    }

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {!quiz ? (
                <section className="card">
                    <p>Quiz details are not available.</p>
                    <button type="button" className="secondary" onClick={() => navigate("/learner")}>
                        Back to quizzes
                    </button>
                </section>
            ) : (
                <section className="card">
                    <div className="flex-between">
                        <h2 style={{ margin: 0 }}>{quiz.title}</h2>
                        <span className="badge badge-success">{quiz.status}</span>
                    </div>
                    <div className="grid" style={{ marginTop: "16px" }}>
                        <p><strong>Subject:</strong> {quiz.subject_name || "General"}</p>
                        <p><strong>Topic:</strong> {quiz.topic || "General"}</p>
                        <p><strong>Duration:</strong> {quiz.duration_minutes} minutes</p>
                        <p><strong>Pass score:</strong> {quiz.pass_score} / 10</p>
                        <p><strong>Questions:</strong> {quiz.question_count}</p>
                        <p><strong>Shuffle questions:</strong> {quiz.shuffle_questions ? "Yes" : "No"}</p>
                    </div>

                    <p style={{ color: "#4b5563" }}>
                        Answer keys are hidden until you submit. You can save progress and resume later.
                    </p>

                    {quiz.questions?.length ? (
                        <ol style={{ paddingLeft: "20px" }}>
                            {quiz.questions.map((question, index) => (
                                <li key={question.id} style={{ marginBottom: "8px" }}>
                                    {question.content || `Question ${index + 1}`}
                                    <span className={`badge ${
                                        question.difficulty === "Easy" ? "badge-easy" :
                                        question.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                                    }`} style={{ marginLeft: "8px" }}>
                                        {question.difficulty}
                                    </span>
                                    <span className="badge badge-primary" style={{ marginLeft: "8px" }}>
                                        {question.question_type}
                                    </span>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p>This quiz has no questions yet.</p>
                    )}

                    <div className="actions">
                        <button type="button" className="secondary" onClick={() => navigate("/learner")}>
                            Back
                        </button>
                        <button
                            type="button"
                            onClick={handleStart}
                            disabled={starting || !quiz.question_count}
                        >
                            {starting ? "Starting..." : "Take Practice Quiz"}
                        </button>
                    </div>
                </section>
            )}
        </div>
    );
}

export default LearnerQuizDetails;
