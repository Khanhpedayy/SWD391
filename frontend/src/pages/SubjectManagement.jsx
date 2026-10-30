import { useEffect, useState } from "react";
import {
    getSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    getTopics,
    createTopic,
    deleteTopic
} from "../services/subjectService";

const emptySubjectForm = {
    name: "",
    code: "",
    description: "",
    status: "Active"
};

const emptyTopicForm = {
    subject_id: "",
    name: "",
    description: ""
};

function SubjectManagement() {
    const [subjects, setSubjects] = useState([]);
    const [topics, setTopics] = useState([]);
    const [subjectForm, setSubjectForm] = useState(emptySubjectForm);
    const [topicForm, setTopicForm] = useState(emptyTopicForm);
    const [editingSubjectId, setEditingSubjectId] = useState(null);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");
            const [subs, tops] = await Promise.all([
                getSubjects(),
                getTopics()
            ]);
            setSubjects(subs || []);
            setTopics(tops || []);
            if (subs.length > 0 && !topicForm.subject_id) {
                setTopicForm((prev) => ({ ...prev, subject_id: subs[0].id }));
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSubjectChange = (e) => {
        setSubjectForm({
            ...subjectForm,
            [e.target.name]: e.target.value
        });
    };

    const handleTopicChange = (e) => {
        setTopicForm({
            ...topicForm,
            [e.target.name]: e.target.value
        });
    };

    const resetSubjectForm = () => {
        setSubjectForm(emptySubjectForm);
        setEditingSubjectId(null);
    };

    const handleSubjectSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setSuccess("");
            if (editingSubjectId) {
                await updateSubject(editingSubjectId, subjectForm);
                setSuccess("Subject updated successfully.");
            } else {
                await createSubject(subjectForm);
                setSuccess("Subject created successfully.");
            }
            resetSubjectForm();
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditSubject = (subj) => {
        setEditingSubjectId(subj.id);
        setSubjectForm({
            name: subj.name,
            code: subj.code,
            description: subj.description || "",
            status: subj.status || "Active"
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDeleteSubject = async (id) => {
        if (!window.confirm("Are you sure you want to delete this subject? All associated topics will be removed.")) return;
        try {
            setError("");
            setSuccess("");
            await deleteSubject(id);
            setSuccess("Subject deleted successfully.");
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleTopicSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setSuccess("");
            await createTopic(topicForm);
            setSuccess("Topic added successfully.");
            setTopicForm((prev) => ({ ...emptyTopicForm, subject_id: prev.subject_id }));
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteTopic = async (id) => {
        if (!window.confirm("Are you sure you want to delete this topic?")) return;
        try {
            setError("");
            setSuccess("");
            await deleteTopic(id);
            setSuccess("Topic deleted successfully.");
            await loadData();
        } catch (err) {
            setError(err.message);
        }
    };

    const filteredSubjects = subjects.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            {error && <div className="error">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                {/* Form Subject */}
                <section className="card">
                    <h2>{editingSubjectId ? "Edit Subject" : "Create Subject"}</h2>
                    <form onSubmit={handleSubjectSubmit}>
                        <label>
                            Subject Code
                            <input
                                name="code"
                                value={subjectForm.code}
                                onChange={handleSubjectChange}
                                placeholder="e.g. SWD392"
                                required
                            />
                        </label>

                        <label>
                            Subject Name
                            <input
                                name="name"
                                value={subjectForm.name}
                                onChange={handleSubjectChange}
                                placeholder="e.g. Software Architecture"
                                required
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                name="description"
                                value={subjectForm.description}
                                onChange={handleSubjectChange}
                                placeholder="Enter subject description..."
                            />
                        </label>

                        <label>
                            Status
                            <select
                                name="status"
                                value={subjectForm.status}
                                onChange={handleSubjectChange}
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </label>

                        <div className="actions">
                            <button type="submit">
                                {editingSubjectId ? "Update Subject" : "Create Subject"}
                            </button>
                            {editingSubjectId && (
                                <button
                                    type="button"
                                    className="secondary"
                                    onClick={resetSubjectForm}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Form Topic */}
                <section className="card">
                    <h2>Create Topic for Subject</h2>
                    <form onSubmit={handleTopicSubmit}>
                        <label>
                            Select Subject
                            <select
                                name="subject_id"
                                value={topicForm.subject_id}
                                onChange={handleTopicChange}
                                required
                            >
                                <option value="">-- Choose Subject --</option>
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.code} - {s.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            Topic Name
                            <input
                                name="name"
                                value={topicForm.name}
                                onChange={handleTopicChange}
                                placeholder="e.g. Architectural Patterns"
                                required
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                name="description"
                                value={topicForm.description}
                                onChange={handleTopicChange}
                                placeholder="Enter topic notes..."
                            />
                        </label>

                        <div className="actions">
                            <button type="submit">Add Topic</button>
                        </div>
                    </form>
                </section>
            </div>

            {/* Subjects Table */}
            <section className="card">
                <div className="toolbar flex-between">
                    <h2>Subjects List</h2>
                    <div className="search">
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by code or name..."
                        />
                    </div>
                </div>

                {loading ? (
                    <p>Loading...</p>
                ) : filteredSubjects.length === 0 ? (
                    <p>No subjects found.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Topics</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubjects.map((sub) => {
                                    const subTopics = topics.filter((t) => t.subject_id === sub.id);
                                    return (
                                        <tr key={sub.id}>
                                            <td>{sub.id}</td>
                                            <td><strong>{sub.code}</strong></td>
                                            <td>{sub.name}</td>
                                            <td>{sub.description || "-"}</td>
                                            <td>
                                                <span className={`badge ${sub.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                                    {sub.status}
                                                </span>
                                            </td>
                                            <td>
                                                {subTopics.length === 0 ? (
                                                    <span style={{ color: "#9ca3af" }}>None</span>
                                                ) : (
                                                    subTopics.map((t) => (
                                                        <span key={t.id} className="badge badge-primary" style={{ marginRight: "4px", marginBottom: "4px" }}>
                                                            {t.name}
                                                            <span
                                                                onClick={() => handleDeleteTopic(t.id)}
                                                                style={{ marginLeft: "6px", cursor: "pointer", fontWeight: "bold" }}
                                                                title="Delete topic"
                                                            >
                                                                ×
                                                            </span>
                                                        </span>
                                                    ))
                                                )}
                                            </td>
                                            <td>
                                                <div className="row-actions">
                                                    <button onClick={() => handleEditSubject(sub)}>
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="danger"
                                                        onClick={() => handleDeleteSubject(sub.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}

export default SubjectManagement;
