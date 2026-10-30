import { useEffect, useState } from "react";

import {
    getQuestions,
    getQuestion,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    importQuestions
} from "../services/questionService";

const emptyForm = {
    content: "",
    difficulty: "Easy",
    question_type: "Single Choice",
    topic: "General",
    options: [
        { option_text: "", is_correct: true, explanation: "" },
        { option_text: "", is_correct: false, explanation: "" },
        { option_text: "", is_correct: false, explanation: "" },
        { option_text: "", is_correct: false, explanation: "" }
    ]
};

function QuestionManagement() {
    const [questions, setQuestions] = useState([]);
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);
    const [search, setSearch] = useState("");
    const [difficulty, setDifficulty] = useState("");
    const [topicFilter, setTopicFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState("");
    const [importLoading, setImportLoading] = useState(false);

    const loadQuestions = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getQuestions(search, difficulty);
            setQuestions(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuestions();
    }, []);

    const handleChange = (event) => {
        setForm({
            ...form,
            [event.target.name]: event.target.value
        });
    };

    const handleOptionTextChange = (index, value) => {
        const nextOptions = [...form.options];
        nextOptions[index].option_text = value;
        setForm({ ...form, options: nextOptions });
    };

    const handleOptionExplanationChange = (index, value) => {
        const nextOptions = [...form.options];
        nextOptions[index].explanation = value;
        setForm({ ...form, options: nextOptions });
    };

    const handleOptionCorrectChange = (index) => {
        const nextOptions = [...form.options];
        if (form.question_type === "Single Choice" || form.question_type === "True/False") {
            nextOptions.forEach((opt, i) => {
                opt.is_correct = i === index;
            });
        } else {
            nextOptions[index].is_correct = !nextOptions[index].is_correct;
        }
        setForm({ ...form, options: nextOptions });
    };

    const addOptionRow = () => {
        setForm({
            ...form,
            options: [
                ...form.options,
                { option_text: "", is_correct: false, explanation: "" }
            ]
        });
    };

    const removeOptionRow = (index) => {
        if (form.options.length <= 2) {
            alert("A question must have at least 2 options.");
            return;
        }
        const nextOptions = form.options.filter((_, i) => i !== index);
        setForm({ ...form, options: nextOptions });
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setError("");
            setSuccess("");

            // Validate that at least one option is marked correct
            const hasCorrect = form.options.some((opt) => opt.is_correct && opt.option_text.trim());
            if (!hasCorrect) {
                setError("Please mark at least one non-empty option as correct.");
                return;
            }

            if (editingId) {
                await updateQuestion(editingId, form);
                setSuccess("Question updated successfully.");
            } else {
                await createQuestion(form);
                setSuccess("Question created successfully.");
            }

            resetForm();
            await loadQuestions();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = async (question) => {
        setEditingId(question.id);
        try {
            const detail = await getQuestion(question.id);
            setForm({
                content: detail.content,
                difficulty: detail.difficulty,
                question_type: detail.question_type,
                topic: detail.topic,
                options: detail.options && detail.options.length > 0
                    ? detail.options.map(o => ({
                        option_text: o.option_text,
                        is_correct: Boolean(o.is_correct),
                        explanation: o.explanation || ""
                    }))
                    : emptyForm.options
            });
        } catch {
            setForm({
                content: question.content,
                difficulty: question.difficulty,
                question_type: question.question_type,
                topic: question.topic,
                options: emptyForm.options
            });
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this question?"
        );

        if (!confirmed) return;

        try {
            setError("");
            setSuccess("");
            await deleteQuestion(id);
            setSuccess("Question deleted successfully.");
            await loadQuestions();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleSearch = async (event) => {
        event.preventDefault();
        await loadQuestions();
    };

    // CSV Sample and Import Handler
    const downloadCsvSample = () => {
        const sampleCsv = `content,difficulty,question_type,topic,option_1,option_2,option_3,option_4,correct_option,explanation
"What does CSS stand for?","Easy","Single Choice","Web Development","Cascading Style Sheets","Creative Style Sheets","Computer Style Sheets","Colorful Style Sheets","1","CSS is used to style web pages."
"Which hook is used for side effects in React?","Medium","Single Choice","ReactJS","useEffect","useState","useMemo","useRef","1","useEffect handles side effects."`;
        const blob = new Blob([sampleCsv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "questions_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            setImportText(event.target.result);
        };
        reader.readAsText(file);
    };

    const parseAndImportQuestions = async () => {
        if (!importText.trim()) {
            alert("Please paste CSV content or select a CSV file.");
            return;
        }

        try {
            setImportLoading(true);
            const lines = importText.trim().split("\n");
            if (lines.length < 2) {
                alert("CSV must contain at least a header line and one data line.");
                return;
            }

            const questionsToImport = [];
            // Parse CSV lines
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Simple CSV splitter handling quotes
                const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
                const matches = [];
                let match;
                while ((match = regex.exec(line)) !== null && matches.length < 10) {
                    let val = match[1] || "";
                    if (val.startsWith('"') && val.endsWith('"')) {
                        val = val.slice(1, -1).replace(/""/g, '"');
                    }
                    matches.push(val.trim());
                }

                if (matches.length >= 4) {
                    const content = matches[0];
                    const diff = matches[1] || "Easy";
                    const qType = matches[2] || "Single Choice";
                    const top = matches[3] || "General";
                    const opt1 = matches[4] || "True";
                    const opt2 = matches[5] || "False";
                    const opt3 = matches[6] || "";
                    const opt4 = matches[7] || "";
                    const correctIdx = parseInt(matches[8], 10) || 1;
                    const expl = matches[9] || "";

                    const options = [
                        { option_text: opt1, is_correct: correctIdx === 1, explanation: expl },
                        { option_text: opt2, is_correct: correctIdx === 2, explanation: expl }
                    ];
                    if (opt3) options.push({ option_text: opt3, is_correct: correctIdx === 3, explanation: expl });
                    if (opt4) options.push({ option_text: opt4, is_correct: correctIdx === 4, explanation: expl });

                    questionsToImport.push({
                        content,
                        difficulty: ["Easy", "Medium", "Hard"].includes(diff) ? diff : "Easy",
                        question_type: ["Single Choice", "Multiple Choice", "True/False"].includes(qType) ? qType : "Single Choice",
                        topic: top,
                        options
                    });
                }
            }

            if (questionsToImport.length === 0) {
                alert("No valid question records parsed from the input.");
                return;
            }

            await importQuestions(questionsToImport);
            setSuccess(`Imported ${questionsToImport.length} questions successfully!`);
            setShowImportModal(false);
            setImportText("");
            await loadQuestions();
        } catch (err) {
            alert("Import error: " + err.message);
        } finally {
            setImportLoading(false);
        }
    };

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <section className="card">
                <div className="flex-between" style={{ marginBottom: "16px" }}>
                    <h2>{editingId ? "Edit Question" : "Create Question"}</h2>
                    <button
                        type="button"
                        className="secondary"
                        onClick={() => setShowImportModal(true)}
                    >
                        📁 Import Questions (Excel / CSV)
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <label>
                        Question
                        <textarea
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            placeholder="Enter question content..."
                            required
                        />
                    </label>

                    <div className="grid">
                        <label>
                            Difficulty
                            <select
                                name="difficulty"
                                value={form.difficulty}
                                onChange={handleChange}
                            >
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </label>

                        <label>
                            Question Type
                            <select
                                name="question_type"
                                value={form.question_type}
                                onChange={handleChange}
                            >
                                <option>Single Choice</option>
                                <option>Multiple Choice</option>
                                <option>True/False</option>
                            </select>
                        </label>

                        <label>
                            Topic
                            <input
                                name="topic"
                                value={form.topic}
                                onChange={handleChange}
                                placeholder="e.g. ReactJS"
                                required
                            />
                        </label>
                    </div>

                    {/* Options Builder */}
                    <div className="options-builder">
                        <div className="flex-between" style={{ marginBottom: "12px" }}>
                            <strong>Question Options & Answers (Select the correct answer):</strong>
                            {form.question_type !== "True/False" && (
                                <button
                                    type="button"
                                    onClick={addOptionRow}
                                    style={{ padding: "6px 12px", fontSize: "13px" }}
                                >
                                    + Add Option
                                </button>
                            )}
                        </div>

                        {form.options.map((opt, idx) => (
                            <div key={idx} className="option-row">
                                <input
                                    type={form.question_type === "Multiple Choice" ? "checkbox" : "radio"}
                                    name="correct_answer_picker"
                                    checked={opt.is_correct}
                                    onChange={() => handleOptionCorrectChange(idx)}
                                    title="Mark as correct answer"
                                />
                                <span style={{ fontWeight: 600, width: "24px" }}>
                                    {String.fromCharCode(65 + idx)}.
                                </span>
                                <input
                                    type="text"
                                    value={opt.option_text}
                                    onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                                    required
                                />
                                <input
                                    type="text"
                                    value={opt.explanation}
                                    onChange={(e) => handleOptionExplanationChange(idx, e.target.value)}
                                    placeholder="Explanation (optional)"
                                    style={{ flex: "0.8" }}
                                />
                                {form.options.length > 2 && form.question_type !== "True/False" && (
                                    <button
                                        type="button"
                                        className="danger"
                                        onClick={() => removeOptionRow(idx)}
                                        style={{ padding: "8px 12px" }}
                                        title="Delete option"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="actions">
                        <button type="submit">
                            {editingId ? "Update Question" : "Create Question"}
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

            <section className="card">
                <div className="toolbar">
                    <form onSubmit={handleSearch} className="search">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search questions..."
                        />

                        <select
                            value={difficulty}
                            onChange={(e) => setDifficulty(e.target.value)}
                        >
                            <option value="">All difficulties</option>
                            <option value="Easy">Easy</option>
                            <option value="Medium">Medium</option>
                            <option value="Hard">Hard</option>
                        </select>

                        <button type="submit">Search</button>
                    </form>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : questions.length === 0 ? (
                    <p>No questions found.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Question</th>
                                    <th>Difficulty</th>
                                    <th>Type</th>
                                    <th>Topic</th>
                                    <th>Options</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {questions.map((question) => (
                                    <tr key={question.id}>
                                        <td>{question.id}</td>
                                        <td>{question.content}</td>
                                        <td>
                                            <span className={`badge ${
                                                question.difficulty === 'Easy' ? 'badge-easy' :
                                                question.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'
                                            }`}>
                                                {question.difficulty}
                                            </span>
                                        </td>
                                        <td>{question.question_type}</td>
                                        <td>{question.topic}</td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {question.options_count !== undefined ? `${question.options_count} options` : 'Yes'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button
                                                    onClick={() =>
                                                        handleEdit(question)
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="danger"
                                                    onClick={() =>
                                                        handleDelete(question.id)
                                                    }
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

            {/* Modal Import */}
            {showImportModal && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="flex-between" style={{ marginBottom: "16px" }}>
                            <h2>Import Questions from CSV / Excel</h2>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShowImportModal(false)}
                            >
                                ✕ Close
                            </button>
                        </div>

                        <p style={{ color: "#4b5563", fontSize: "14px" }}>
                            Upload a .csv file or paste CSV content below. You can download the sample template to inspect the expected column format.
                        </p>

                        <div style={{ marginBottom: "16px" }}>
                            <button
                                type="button"
                                onClick={downloadCsvSample}
                                style={{ marginRight: "12px", background: "#059669" }}
                            >
                                📥 Download Sample CSV Template
                            </button>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={handleFileUpload}
                                style={{ display: "inline-block", width: "auto" }}
                            />
                        </div>

                        <label>
                            CSV Raw Content
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                placeholder="Paste CSV text here..."
                                style={{ minHeight: "180px", fontFamily: "monospace", fontSize: "13px" }}
                            />
                        </label>

                        <div className="actions" style={{ marginTop: "16px" }}>
                            <button
                                type="button"
                                onClick={parseAndImportQuestions}
                                disabled={importLoading}
                            >
                                {importLoading ? "Importing..." : "Process and Import Questions"}
                            </button>
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => setShowImportModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default QuestionManagement;
