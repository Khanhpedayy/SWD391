import { useEffect, useState } from "react";
import { getQuizReport, getQuizzes } from "../services/quizService";

function AssessmentReports() {
    const [quizzes, setQuizzes] = useState([]);
    const [report, setReport] = useState(null);
    const [selectedQuizId, setSelectedQuizId] = useState("");
    const [loading, setLoading] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const qzs = await getQuizzes();
                setQuizzes(qzs || []);
                if (qzs && qzs.length > 0) {
                    setSelectedQuizId(qzs[0].id);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!selectedQuizId) {
            setReport(null);
            return;
        }

        let isCurrentRequest = true;
        const loadReport = async () => {
            try {
                setReportLoading(true);
                setError("");
                setReport(null);
                const nextReport = await getQuizReport(selectedQuizId);
                if (isCurrentRequest) setReport(nextReport);
            } catch (err) {
                if (isCurrentRequest) {
                    setError(err.message);
                    setReport(null);
                }
            } finally {
                if (isCurrentRequest) setReportLoading(false);
            }
        };

        loadReport();
        return () => {
            isCurrentRequest = false;
        };
    }, [selectedQuizId]);

    const selectedQuiz = quizzes.find((q) => q.id === Number(selectedQuizId)) || quizzes[0];
    const summary = report?.summary || {};
    const questions = report?.questions || [];
    const totalSubmissions = Number(summary.total_submissions) || 0;
    const passedCount = Number(summary.passed_count) || 0;
    const failedCount = Number(summary.failed_count) || 0;
    const passRate = totalSubmissions > 0
        ? ((passedCount / totalSubmissions) * 100).toFixed(1)
        : "0.0";
    const avgScore = summary.average_score === null || summary.average_score === undefined
        ? "-"
        : Number(summary.average_score).toFixed(2);
    const maxScore = summary.highest_score ?? "-";
    const minScore = summary.lowest_score ?? "-";

    const exportReportCsv = () => {
        if (!selectedQuiz) return;
        const reportContent = `Assessment Report - Quiz: ${selectedQuiz.title}
Subject: ${selectedQuiz.subject_name || "General"}
Date Exported: ${new Date().toLocaleString()}
Total Submissions: ${totalSubmissions}
Pass Rate: ${passRate}%
Average Score: ${avgScore}/10
Highest Score: ${maxScore}
Lowest Score: ${minScore}

Question Performance Breakdown:
ID,Question Content,Difficulty,Responses,Correct Rate,Wrong Rate
${questions.map((q) => {
    const correctPercent = Number(q.correct_rate) || 0;
    const wrongPercent = Number(q.wrong_rate) || 0;
    return `"${q.id}","${q.content.replace(/"/g, '""')}","${q.difficulty}","${q.answer_count}","${correctPercent}%","${wrongPercent}%"`;
}).join("\n")}
`;
        const blob = new Blob([reportContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Quiz_Report_${selectedQuiz.id}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            {error && <div className="error">{error}</div>}

            <section className="card">
                <div className="flex-between">
                    <div>
                        <h2>Assessment & Performance Reports</h2>
                        <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
                            Detailed statistics on student quiz performance, score distribution, and question accuracy rates.
                        </p>
                    </div>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <select
                            value={selectedQuizId}
                            onChange={(e) => setSelectedQuizId(e.target.value)}
                            style={{ width: "240px", margin: 0 }}
                        >
                            {quizzes.map((q) => (
                                <option key={q.id} value={q.id}>
                                    {q.title}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={exportReportCsv}
                            style={{ background: "#059669" }}
                        >
                            📊 Export CSV Report
                        </button>
                    </div>
                </div>
            </section>

            {loading || reportLoading ? (
                <p>Loading assessment data...</p>
            ) : selectedQuiz ? (
                <>
                    {/* Overview Score Distribution KPIs */}
                    <div className="grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "24px" }}>
                        <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
                            <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: "bold" }}>TOTAL SUBMISSIONS</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#2563eb", marginTop: "6px" }}>
                                {totalSubmissions}
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
                            <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: "bold" }}>PASS RATE</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#16a34a", marginTop: "6px" }}>
                                {passRate}%
                            </div>
                            <div style={{ fontSize: "12px", color: "#6b7280" }}>{passedCount} passed / {failedCount} failed</div>
                        </div>

                        <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
                            <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: "bold" }}>AVERAGE SCORE</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#d97706", marginTop: "6px" }}>
                                {avgScore} / 10
                            </div>
                        </div>

                        <div className="card" style={{ marginBottom: 0, textAlign: "center" }}>
                            <div style={{ color: "#6b7280", fontSize: "13px", fontWeight: "bold" }}>HIGHEST / LOWEST</div>
                            <div style={{ fontSize: "28px", fontWeight: "bold", color: "#7c3aed", marginTop: "6px" }}>
                                {maxScore} / {minScore}
                            </div>
                        </div>
                    </div>

                    {/* Question Accuracy Breakdown Table */}
                    <section className="card">
                        <h2>Question Accuracy & Difficulty Analysis</h2>
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Question ID</th>
                                        <th>Question Content</th>
                                        <th>Difficulty</th>
                                        <th>Topic</th>
                                        <th>Correct Rate (%)</th>
                                        <th>Wrong Rate (%)</th>
                                        <th>Assessment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {questions.map((q) => {
                                        const correctPercent = Number(q.correct_rate) || 0;
                                        const wrongPercent = Number(q.wrong_rate) || 0;
                                        return (
                                            <tr key={q.id}>
                                                <td>#{q.id}</td>
                                                <td>{q.content}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        q.difficulty === 'Easy' ? 'badge-easy' :
                                                        q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
                                                    }`}>
                                                        {q.difficulty}
                                                    </span>
                                                </td>
                                                <td>{q.topic}</td>
                                                <td>
                                                    <strong style={{ color: "#16a34a" }}>{correctPercent}%</strong>
                                                </td>
                                                <td>
                                                    <strong style={{ color: "#dc2626" }}>{wrongPercent}%</strong>
                                                </td>
                                                <td>
                                                    {correctPercent >= 80 ? (
                                                        <span className="badge badge-success">High Mastery</span>
                                                    ) : correctPercent >= 50 ? (
                                                        <span className="badge badge-warning">Moderate</span>
                                                    ) : (
                                                        <span className="badge badge-danger">Needs Review</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </>
            ) : (
                <p>No quizzes available for report.</p>
            )}
        </div>
    );
}

export default AssessmentReports;
