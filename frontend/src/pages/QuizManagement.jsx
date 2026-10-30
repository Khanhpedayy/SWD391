import { useEffect, useState } from "react";
import {
    getQuizzes,
    getQuiz,
    getQuizPreview,
    createQuiz,
    updateQuiz,
    deleteQuiz
} from "../services/quizService";
import { getSubjects } from "../services/subjectService";
import { getQuestions } from "../services/questionService";

const emptyQuizForm = {
    title: "",
    subject_id: "",
    topic: "General",
    duration_minutes: 45,
    pass_score: 5.0,
    shuffle_questions: true,
    shuffle_options: true,
    status: "Draft",
    question_ids: []
};

function QuizManagement() {
    const [quizzes, setQuizzes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [allQuestions, setAllQuestions] = useState([]);
    const [form, setForm] = useState(emptyQuizForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Preview / Details Modal state
    const [previewQuizData, setPreviewQuizData] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [detailQuiz, setDetailQuiz] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [markedQuestions, setMarkedQuestions] = useState({});

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [quizList, subjectList, questionList] = await Promise.all([
                getQuizzes(search, subjectFilter, statusFilter),
                getSubjects().catch(() => []),
                getQuestions().catch(() => [])
            ]);
            setQuizzes(quizList || []);
            setSubjects(subjectList || []);
            setAllQuestions(questionList || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value
        });
    };

    const handleQuestionToggle = (qId) => {
        const currentIds = form.question_ids || [];
        if (currentIds.includes(qId)) {
            setForm({
                ...form,
                question_ids: currentIds.filter((id) => id !== qId)
            });
        } else {
            setForm({
                ...form,
                question_ids: [...currentIds, qId]
            });
        }
    };

    const selectAllQuestions = () => {
        setForm({
            ...form,
            question_ids: allQuestions.map((q) => q.id)
        });
    };

    const clearSelectedQuestions = () => {
        setForm({
            ...form,
            question_ids: []
        });
    };

    const resetForm = () => {
        setForm(emptyQuizForm);
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setSuccess("");

            if (form.question_ids.length === 0) {
                setError("Please select at least 1 question for the quiz.");
                return;
            }

            if (editingId) {
                await updateQuiz(editingId, form);
                setSuccess("Quiz updated successfully.");
            } else {
                await createQuiz(form);
                setSuccess("Quiz created successfully.");
            }

            resetForm();
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = async (quiz) => {
        setEditingId(quiz.id);
        try {
            const detail = await getQuiz(quiz.id);
            setForm({
                title: detail.title,
                subject_id: detail.subject_id || "",
                topic: detail.topic || "General",
                duration_minutes: detail.duration_minutes || 60,
                pass_score: detail.pass_score || 5.0,
                shuffle_questions: Boolean(detail.shuffle_questions),
                shuffle_options: Boolean(detail.shuffle_options),
                status: detail.status || "Draft",
                question_ids: detail.questions ? detail.questions.map((q) => q.id) : []
            });
        } catch {
            setForm({
                ...emptyQuizForm,
                title: quiz.title,
                subject_id: quiz.subject_id || ""
            });
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this quiz?")) return;
        try {
            setError("");
            setSuccess("");
            await deleteQuiz(id);
            setSuccess("Quiz deleted successfully.");
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleViewDetails = async (quizId) => {
        try {
            setError("");
            const data = await getQuiz(quizId);
            setDetailQuiz(data);
            setShowDetailModal(true);
        } catch (err) {
            setError("Failed to load quiz details: " + err.message);
        }
    };

    const handlePreview = async (quizId) => {
        try {
            setError("");
            const data = await getQuizPreview(quizId);
            setPreviewQuizData(data);
            setSelectedAnswers({});
            setMarkedQuestions({});
            setShowPreviewModal(true);
        } catch (err) {
            setError("Failed to load preview: " + err.message);
        }
    };

    const handlePreviewAnswerSelect = (questionId, optionId) => {
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionId]: optionId
        }));
    };

    const handleToggleMarkReview = (questionId) => {
        setMarkedQuestions((prev) => ({
            ...prev,
            [questionId]: !prev[questionId]
        }));
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        await loadData();
    };

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            {/* Quiz Configuration Form */}
            <section className="card">
                <h2>{editingId ? "Edit Quiz Configuration" : "Create & Configure Quiz"}</h2>
                <form onSubmit={handleSubmit}>
                    <label>
                        Quiz Title
                        <input
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. Final Practice Exam: Software Architecture"
                            required
                        />
                    </label>

                    <div className="grid">
                        <label>
                            Subject
                            <select
                                name="subject_id"
                                value={form.subject_id}
                                onChange={handleChange}
                            >
                                <option value="">-- General / No Subject --</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.code} - {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Topic
                            <input
                                name="topic"
                                value={form.topic}
                                onChange={handleChange}
                                placeholder="e.g. Design Patterns"
                            />
                        </label>

                        <label>
                            Duration (Minutes)
                            <input
                                type="number"
                                name="duration_minutes"
                                value={form.duration_minutes}
                                onChange={handleChange}
                                min="1"
                                max="300"
                                required
                            />
                        </label>
                    </div>

                    <div className="grid">
                        <label>
                            Pass Score (Thang điểm 10)
                            <input
                                type="number"
                                step="0.5"
                                name="pass_score"
                                value={form.pass_score}
                                onChange={handleChange}
                                min="0"
                                max="10"
                                required
                            />
                        </label>

                        <label>
                            Publication Status
                            <select
                                name="status"
                                value={form.status}
                                onChange={handleChange}
                            >
                                <option value="Draft">Draft (Bản nháp)</option>
                                <option value="Published">Published (Công khai cho học viên)</option>
                                <option value="Archived">Archived (Lưu trữ)</option>
                            </select>
                        </label>

                        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "8px" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal", margin: 0 }}>
                                <input
                                    type="checkbox"
                                    name="shuffle_questions"
                                    checked={form.shuffle_questions}
                                    onChange={handleChange}
                                    style={{ width: "auto", margin: 0 }}
                                />
                                🔀 Shuffle Questions (Đảo thứ tự câu hỏi)
                            </label>

                            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "normal", margin: 0 }}>
                                <input
                                    type="checkbox"
                                    name="shuffle_options"
                                    checked={form.shuffle_options}
                                    onChange={handleChange}
                                    style={{ width: "auto", margin: 0 }}
                                />
                                🔀 Shuffle Options (Đảo phương án trả lời)
                            </label>
                        </div>
                    </div>

                    {/* Question Bank Selector */}
                    <div className="options-builder">
                        <div className="flex-between" style={{ marginBottom: "12px" }}>
                            <strong>
                                Select Questions from Bank ({form.question_ids.length} selected):
                            </strong>
                            <div style={{ display: "flex", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={selectAllQuestions}
                                    style={{ padding: "6px 12px", fontSize: "12px" }}
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={clearSelectedQuestions}
                                    style={{ padding: "6px 12px", fontSize: "12px" }}
                                >
                                    Clear Selection
                                </button>
                            </div>
                        </div>

                        <div style={{ maxHeight: "220px", overflowY: "auto", border: "1px solid #e2e8f0", padding: "10px", borderRadius: "6px", background: "white" }}>
                            {allQuestions.length === 0 ? (
                                <p style={{ color: "#6b7280" }}>No questions available in question bank.</p>
                            ) : (
                                allQuestions.map((q) => (
                                    <label
                                        key={q.id}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "10px",
                                            padding: "6px 0",
                                            borderBottom: "1px solid #f1f5f9",
                                            marginBottom: 0,
                                            fontWeight: "normal",
                                            cursor: "pointer"
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={form.question_ids.includes(q.id)}
                                            onChange={() => handleQuestionToggle(q.id)}
                                            style={{ width: "auto", margin: 0 }}
                                        />
                                        <span style={{ flex: 1 }}>
                                            <strong>#{q.id}</strong>: {q.content}
                                        </span>
                                        <span className={`badge ${
                                            q.difficulty === 'Easy' ? 'badge-easy' :
                                            q.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
                                        }`}>
                                            {q.difficulty}
                                        </span>
                                        <span className="badge badge-primary">{q.topic}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="actions">
                        <button type="submit">
                            {editingId ? "Update Quiz" : "Create Quiz"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </section>

            {/* Quizzes List */}
            <section className="card">
                <div className="toolbar">
                    <form onSubmit={handleSearch} className="search">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search quizzes..."
                        />

                        <select
                            value={subjectFilter}
                            onChange={(e) => setSubjectFilter(e.target.value)}
                        >
                            <option value="">All Subjects</option>
                            {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.code} - {s.name}
                                </option>
                            ))}
                        </select>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Statuses</option>
                            <option value="Draft">Draft</option>
                            <option value="Published">Published</option>
                            <option value="Archived">Archived</option>
                        </select>

                        <button type="submit">Search</button>
                    </form>
                </div>

                {loading ? (
                    <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                    <p>No quizzes found.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Duration</th>
                                    <th>Pass Score</th>
                                    <th>Questions</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzes.map((quiz) => (
                                    <tr key={quiz.id}>
                                        <td>{quiz.id}</td>
                                        <td><strong>{quiz.title}</strong></td>
                                        <td>{quiz.subject_name || quiz.topic || "General"}</td>
                                        <td>{quiz.duration_minutes} mins</td>
                                        <td>{quiz.pass_score} / 10</td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {quiz.question_count || 0} questions
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${
                                                quiz.status === 'Published' ? 'badge-success' :
                                                quiz.status === 'Draft' ? 'badge-warning' : 'badge-danger'
                                            }`}>
                                                {quiz.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button
                                                    className="secondary"
                                                    onClick={() => handleViewDetails(quiz.id)}
                                                    title="View Quiz Details"
                                                >
                                                    Details
                                                </button>
                                                <button
                                                    onClick={() => handlePreview(quiz.id)}
                                                    style={{ background: "#0891b2" }}
                                                    title="Preview Quiz as Student"
                                                >
                                                    Preview
                                                </button>
                                                <button onClick={() => handleEdit(quiz)}>
                                                    Edit
                                                </button>
                                                <button
                                                    className="danger"
                                                    onClick={() => handleDelete(quiz.id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Modal: Quiz Details (read-only) */}
            {showDetailModal && detailQuiz && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: "720px" }}>
                        <div className="flex-between" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                            <h2 style={{ margin: 0 }}>Quiz Details: {detailQuiz.title}</h2>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShowDetailModal(false)}
                            >
                                Close
                            </button>
                        </div>

                        <div className="grid" style={{ marginBottom: "16px" }}>
                            <p><strong>Subject:</strong> {detailQuiz.subject_name || "General"}</p>
                            <p><strong>Topic:</strong> {detailQuiz.topic}</p>
                            <p><strong>Duration:</strong> {detailQuiz.duration_minutes} mins</p>
                            <p><strong>Pass Score:</strong> {detailQuiz.pass_score} / 10</p>
                            <p><strong>Status:</strong> {detailQuiz.status}</p>
                            <p><strong>Shuffle Questions:</strong> {detailQuiz.shuffle_questions ? "Yes" : "No"}</p>
                            <p><strong>Shuffle Options:</strong> {detailQuiz.shuffle_options ? "Yes" : "No"}</p>
                            <p><strong>Questions:</strong> {detailQuiz.questions?.length || 0}</p>
                        </div>

                        {detailQuiz.questions?.length ? (
                            <ol style={{ paddingLeft: "20px" }}>
                                {detailQuiz.questions.map((q) => (
                                    <li key={q.id} style={{ marginBottom: "8px" }}>
                                        <strong>#{q.id}</strong> {q.content}
                                        <span className={`badge ${
                                            q.difficulty === "Easy" ? "badge-easy" :
                                            q.difficulty === "Medium" ? "badge-medium" : "badge-hard"
                                        }`} style={{ marginLeft: "8px" }}>
                                            {q.difficulty}
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <p>No questions assigned to this quiz.</p>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Preview Quiz (Student Experience simulation) */}
            {showPreviewModal && previewQuizData && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: "900px" }}>
                        <div className="flex-between" style={{ borderBottom: "1px solid #e2e8f0", paddingBottom: "12px", marginBottom: "16px" }}>
                            <div>
                                <h2 style={{ margin: 0 }}>Preview Quiz: {previewQuizData.title}</h2>
                                <p style={{ margin: "4px 0 0 0", color: "#6b7280", fontSize: "14px" }}>
                                    ⏱️ Duration: {previewQuizData.duration_minutes} mins | 🎯 Pass: {previewQuizData.pass_score}/10 | 🔀 Shuffled: {previewQuizData.shuffle_questions ? "Yes" : "No"}
                                </p>
                            </div>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShowPreviewModal(false)}
                            >
                                ✕ Exit Preview
                            </button>
                        </div>

                        {previewQuizData.questions.length === 0 ? (
                            <p>This quiz does not have any questions assigned yet.</p>
                        ) : (
                            <div>
                                {previewQuizData.questions.map((q, idx) => {
                                    const isMarked = markedQuestions[q.id];
                                    const selectedOptId = selectedAnswers[q.id];

                                    return (
                                        <div
                                            key={q.id}
                                            style={{
                                                padding: "16px",
                                                marginBottom: "16px",
                                                background: isMarked ? "#fffbeb" : "#f8fafc",
                                                border: isMarked ? "1px solid #fde68a" : "1px solid #e2e8f0",
                                                borderRadius: "8px"
                                            }}
                                        >
                                            <div className="flex-between" style={{ marginBottom: "10px" }}>
                                                <span style={{ fontWeight: 600 }}>
                                                    Question {idx + 1} of {previewQuizData.questions.length}:
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleMarkReview(q.id)}
                                                    style={{
                                                        background: isMarked ? "#f59e0b" : "#e2e8f0",
                                                        color: isMarked ? "white" : "#4b5563",
                                                        fontSize: "12px",
                                                        padding: "4px 10px"
                                                    }}
                                                >
                                                    {isMarked ? "🚩 Marked for Review" : "🏳️ Mark Question"}
                                                </button>
                                            </div>

                                            <p style={{ fontSize: "16px", fontWeight: "bold", margin: "8px 0" }}>
                                                {q.content}
                                            </p>

                                            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                                                {q.options && q.options.length > 0 ? (
                                                    q.options.map((opt) => (
                                                        <label
                                                            key={opt.id}
                                                            style={{
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "10px",
                                                                padding: "8px 12px",
                                                                borderRadius: "6px",
                                                                background: selectedOptId === opt.id ? "#dbeafe" : "white",
                                                                border: selectedOptId === opt.id ? "1px solid #3b82f6" : "1px solid #cbd5e1",
                                                                margin: 0,
                                                                cursor: "pointer",
                                                                fontWeight: "normal"
                                                            }}
                                                        >
                                                            <input
                                                                type="radio"
                                                                name={`preview_q_${q.id}`}
                                                                checked={selectedOptId === opt.id}
                                                                onChange={() => handlePreviewAnswerSelect(q.id, opt.id)}
                                                                style={{ width: "auto", margin: 0 }}
                                                            />
                                                            <span>{opt.option_text}</span>
                                                            {opt.is_correct ? (
                                                                <span className="badge badge-success" style={{ marginLeft: "auto", fontSize: "11px" }}>
                                                                    Correct Answer
                                                                </span>
                                                            ) : null}
                                                        </label>
                                                    ))
                                                ) : (
                                                    <p style={{ color: "#9ca3af", fontStyle: "italic" }}>
                                                        No answer options defined for this question.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="actions" style={{ marginTop: "16px", justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShowPreviewModal(false)}
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuizManagement;
