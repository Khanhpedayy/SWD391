import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getPracticeAttempt,
    saveAttemptProgress,
    submitAttempt
} from "../services/learnerService";

const toAnswerPayload = (answers) =>
    Object.entries(answers).map(([questionId, selected]) => ({
        question_id: Number(questionId),
        selected_option_ids: selected || []
    }));

function LearnerTakeQuiz() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [payload, setPayload] = useState(null);
    const [answers, setAnswers] = useState({});
    const [remainingSeconds, setRemainingSeconds] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError("");
                const data = await getPracticeAttempt(attemptId);
                if (data.attempt.status === "Submitted") {
                    navigate(`/learner/results/${attemptId}`, { replace: true });
                    return;
                }
                setPayload(data);
                setAnswers(data.answers || {});
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [attemptId, navigate]);

    useEffect(() => {
        if (!payload?.attempt?.started_at || !payload?.quiz?.duration_minutes) return undefined;

        const startedAt = new Date(payload.attempt.started_at).getTime();
        const totalMs = Number(payload.quiz.duration_minutes) * 60 * 1000;

        const tick = () => {
            const left = Math.max(0, Math.floor((startedAt + totalMs - Date.now()) / 1000));
            setRemainingSeconds(left);
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [payload]);

    const timeLabel = useMemo(() => {
        if (remainingSeconds === null) return "--:--";
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = remainingSeconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }, [remainingSeconds]);

    const handleSelect = (question, optionId) => {
        setAnswers((prev) => {
            const current = prev[question.id] || [];
            if (question.question_type === "Multiple Choice") {
                    const exists = current.map(Number).includes(Number(optionId));
                    return {
                        ...prev,
                        [question.id]: exists
                            ? current.filter((id) => Number(id) !== Number(optionId))
                            : [...current, optionId]
                    };
            }
            return { ...prev, [question.id]: [optionId] };
        });
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");
            await saveAttemptProgress(attemptId, toAnswerPayload(answers));
            setSuccess("Progress saved.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (auto = false) => {
        if (!auto && !window.confirm("Submit your answers? You cannot change them after this.")) {
            return;
        }
        try {
            setError("");
            setSuccess("");
            const result = await submitAttempt(attemptId, toAnswerPayload(answers));
            navigate(`/learner/results/${result.data.attempt.id}`);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        if (remainingSeconds === 0 && payload?.attempt?.status === "InProgress") {
            handleSubmit(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remainingSeconds]);

    if (loading) {
        return <section className="card"><p>Loading practice quiz...</p></section>;
    }

    if (!payload) {
        return (
            <section className="card">
                {error && <div className="error">{error}</div>}
                <button type="button" className="secondary" onClick={() => navigate("/learner")}>
                    Back to quizzes
                </button>
            </section>
        );
    }

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <section className="card">
                <div className="flex-between">
                    <div>
                        <h2 style={{ margin: 0 }}>{payload.quiz.title}</h2>
                        <p style={{ margin: "4px 0 0 0", color: "#6b7280" }}>
                            {payload.quiz.subject_name || "General"} · {payload.quiz.topic}
                        </p>
                    </div>
                    <span className={`badge ${remainingSeconds !== null && remainingSeconds < 60 ? "badge-danger" : "badge-primary"}`}>
                        Time left: {timeLabel}
                    </span>
                </div>

                <div className="actions" style={{ marginTop: "16px" }}>
                    <button type="button" className="secondary" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save Progress"}
                    </button>
                    <button type="button" onClick={() => handleSubmit(false)}>
                        Submit Answers
                    </button>
                </div>
            </section>

            {payload.questions.map((question, index) => {
                const selected = (answers[question.id] || []).map(Number);
                return (
                    <section className="card" key={question.id}>
                        <div className="flex-between">
                            <strong>Question {index + 1} of {payload.questions.length}</strong>
                            <span className="badge badge-primary">{question.question_type}</span>
                        </div>
                        <p style={{ fontWeight: "bold" }}>{question.content}</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {question.options.map((option) => {
                                const checked = selected.includes(option.id);
                                return (
                                    <label
                                        key={option.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "8px 12px",
                                            borderRadius: "6px",
                                            background: checked ? "#dbeafe" : "white",
                                            border: checked ? "1px solid #3b82f6" : "1px solid #cbd5e1",
                                            margin: 0,
                                            cursor: "pointer",
                                            fontWeight: "normal"
                                        }}
                                    >
                                        <input
                                            type={question.question_type === "Multiple Choice" ? "checkbox" : "radio"}
                                            name={`question_${question.id}`}
                                            checked={checked}
                                            onChange={() => handleSelect(question, option.id)}
                                            style={{ width: "auto", margin: 0 }}
                                        />
                                        <span>{option.option_text}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>
    );
}

export default LearnerTakeQuiz;
