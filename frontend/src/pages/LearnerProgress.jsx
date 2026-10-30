import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLearnerAttempts } from "../services/learnerService";

function LearnerProgress() {
    const navigate = useNavigate();
    const [attempts, setAttempts] = useState([]);
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadAttempts = async (status = statusFilter) => {
        try {
            setLoading(true);
            setError("");
            const data = await getLearnerAttempts(status);
            setAttempts(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttempts("");
    }, []);

    const handleFilter = async (e) => {
        e.preventDefault();
        await loadAttempts(statusFilter);
    };

    return (
        <div>
            {error && <div className="error">{error}</div>}
            <section className="card">
                <h2>Saved Progress & Results</h2>
                <form onSubmit={handleFilter} className="search">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All attempts</option>
                        <option value="InProgress">In progress</option>
                        <option value="Submitted">Submitted</option>
                    </select>
                    <button type="submit">Filter</button>
                </form>
            </section>

            <section className="card">
                {loading ? (
                    <p>Loading attempts...</p>
                ) : attempts.length === 0 ? (
                    <p>No saved attempts yet.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Quiz</th>
                                    <th>Status</th>
                                    <th>Score</th>
                                    <th>Started</th>
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attempts.map((attempt) => (
                                    <tr key={attempt.id}>
                                        <td><strong>{attempt.title}</strong></td>
                                        <td>
                                            <span className={`badge ${
                                                attempt.status === "Submitted" ? "badge-success" : "badge-warning"
                                            }`}>
                                                {attempt.status}
                                            </span>
                                        </td>
                                        <td>
                                            {attempt.status === "Submitted"
                                                ? `${attempt.score} / 10`
                                                : "Hidden until submit"}
                                        </td>
                                        <td>{attempt.started_at ? new Date(attempt.started_at).toLocaleString() : "-"}</td>
                                        <td>{attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleString() : "-"}</td>
                                        <td>
                                            {attempt.status === "InProgress" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/learner/practice/${attempt.id}`)}
                                                >
                                                    Resume
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/learner/results/${attempt.id}`)}
                                                >
                                                    View Results
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default LearnerProgress;
