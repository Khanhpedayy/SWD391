import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPublishedQuizzes } from "../services/learnerService";
import { getSubjects } from "../services/subjectService";

function LearnerQuizBrowse() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [search, setSearch] = useState("");
    const [subjectFilter, setSubjectFilter] = useState("");
    const [topicFilter, setTopicFilter] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const loadQuizzes = async () => {
        try {
            setLoading(true);
            setError("");
            const [quizList, subjectList] = await Promise.all([
                getPublishedQuizzes(search, subjectFilter, topicFilter),
                getSubjects().catch(() => [])
            ]);
            setQuizzes(quizList || []);
            setSubjects(subjectList || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadQuizzes();
    }, []);

    const handleSearch = async (e) => {
        e.preventDefault();
        await loadQuizzes();
    };

    return (
        <div>
            {error && <div className="error">{error}</div>}

            <section className="card">
                <h2>Available Practice Quizzes</h2>
                <form onSubmit={handleSearch} className="search">
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search quizzes by title..."
                    />
                    <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                    >
                        <option value="">All Subjects</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.code} - {subject.name}
                            </option>
                        ))}
                    </select>
                    <input
                        value={topicFilter}
                        onChange={(e) => setTopicFilter(e.target.value)}
                        placeholder="Filter by topic..."
                    />
                    <button type="submit">Search</button>
                </form>
            </section>

            <section className="card">
                {loading ? (
                    <p>Loading quizzes...</p>
                ) : quizzes.length === 0 ? (
                    <p>No published quizzes found.</p>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Subject</th>
                                    <th>Topic</th>
                                    <th>Duration</th>
                                    <th>Pass Score</th>
                                    <th>Questions</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzes.map((quiz) => (
                                    <tr key={quiz.id}>
                                        <td><strong>{quiz.title}</strong></td>
                                        <td>{quiz.subject_name || "General"}</td>
                                        <td>{quiz.topic || "General"}</td>
                                        <td>{quiz.duration_minutes} mins</td>
                                        <td>{quiz.pass_score} / 10</td>
                                        <td>
                                            <span className="badge badge-primary">
                                                {quiz.question_count || 0} questions
                                            </span>
                                        </td>
                                        <td>
                                            <div className="row-actions">
                                                <button
                                                    className="secondary"
                                                    onClick={() => navigate(`/learner/quizzes/${quiz.id}`)}
                                                >
                                                    View Details
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/learner/quizzes/${quiz.id}`)}
                                                >
                                                    Select Quiz
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
        </div>
    );
}

export default LearnerQuizBrowse;
