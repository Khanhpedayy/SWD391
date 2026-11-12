import { NavLink, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useState } from "react";
import QuestionManagement from "./pages/QuestionManagement";
import SubjectManagement from "./pages/SubjectManagement";
import QuizManagement from "./pages/QuizManagement";
import AssessmentReports from "./pages/AssessmentReports";
import LearnerQuizBrowse from "./pages/LearnerQuizBrowse";
import LearnerQuizDetails from "./pages/LearnerQuizDetails";
import LearnerTakeQuiz from "./pages/LearnerTakeQuiz";
import LearnerQuizResults from "./pages/LearnerQuizResults";
import LearnerProgress from "./pages/LearnerProgress";
import LearnerAccount from "./pages/LearnerAccount";
import AIChatbot from "./components/AIChatbot";
import { isLearnerAuthenticated } from "./services/learnerSession";

function RequireLearner({ children }) {
    return isLearnerAuthenticated() ? children : <Navigate to="/learner/account" replace />;
}

function InstructorModule() {
    const [currentTab, setCurrentTab] = useState("questions");

    return (
        <>
            <header>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <h1>Quiz Practice System</h1>
                        <p style={{ color: "#4b5563", margin: "4px 0 0 0" }}>
                            Phân hệ Giảng viên / Người soạn đề (Instructor Module)
                        </p>
                    </div>
                    <span className="badge badge-primary" style={{ padding: "6px 14px", fontSize: "13px" }}>
                        Role: Instructor / Exam Creator
                    </span>
                </div>
            </header>

            <nav className="nav-tabs">
                <button
                    type="button"
                    className={`nav-tab ${currentTab === "questions" ? "active" : ""}`}
                    onClick={() => setCurrentTab("questions")}
                >
                    📚 Ngân hàng câu hỏi & Import
                </button>
                <button
                    type="button"
                    className={`nav-tab ${currentTab === "subjects" ? "active" : ""}`}
                    onClick={() => setCurrentTab("subjects")}
                >
                    🏷️ Quản lý Môn học & Chủ đề
                </button>
                <button
                    type="button"
                    className={`nav-tab ${currentTab === "quizzes" ? "active" : ""}`}
                    onClick={() => setCurrentTab("quizzes")}
                >
                    📝 Cấu hình & Tạo đề thi (Preview)
                </button>
                <button
                    type="button"
                    className={`nav-tab ${currentTab === "reports" ? "active" : ""}`}
                    onClick={() => setCurrentTab("reports")}
                >
                    📊 Báo cáo & Thống kê
                </button>
            </nav>

            {currentTab === "questions" && <QuestionManagement />}
            {currentTab === "subjects" && <SubjectManagement />}
            {currentTab === "quizzes" && <QuizManagement />}
            {currentTab === "reports" && <AssessmentReports />}
        </>
    );
}

function LearnerShell() {
    const location = useLocation();

    return (
        <>
            <header>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                        <h1>Quiz Practice System</h1>
                        <p style={{ color: "#4b5563", margin: "4px 0 0 0" }}>
                            Phân hệ Học viên (Learner Quiz Practice)
                        </p>
                    </div>
                    <span className="badge badge-success" style={{ padding: "6px 14px", fontSize: "13px" }}>
                        Role: Learner
                    </span>
                </div>
            </header>

            <nav className="nav-tabs">
                <NavLink
                    to="/learner"
                    end
                    className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    Browse Quizzes
                </NavLink>
                <NavLink
                    to="/learner/progress"
                    className={({ isActive }) => `nav-tab ${isActive || location.pathname.includes("/practice") || location.pathname.includes("/results") ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    Progress & Results
                </NavLink>
                <NavLink
                    to="/learner/account"
                    className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    Account
                </NavLink>
            </nav>
        </>
    );
}

function App() {
    const location = useLocation();
    const isLearner = location.pathname.startsWith("/learner");

    return (
        <main className="container">
            <div className="actions" style={{ marginBottom: "16px" }}>
                <NavLink
                    to="/instructor"
                    className={() => `nav-tab ${!isLearner ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    Instructor
                </NavLink>
                <NavLink
                    to="/learner"
                    className={() => `nav-tab ${isLearner ? "active" : ""}`}
                    style={{ textDecoration: "none" }}
                >
                    Learner
                </NavLink>
            </div>

            <Routes>
                <Route path="/" element={<Navigate to="/instructor" replace />} />
                <Route path="/instructor" element={<InstructorModule />} />
                <Route
                    path="/learner/account"
                    element={
                        <>
                            <LearnerShell />
                            <LearnerAccount />
                        </>
                    }
                />
                <Route
                    path="/learner"
                    element={
                        <RequireLearner>
                            <LearnerShell />
                            <LearnerQuizBrowse />
                        </RequireLearner>
                    }
                />
                <Route
                    path="/learner/quizzes/:id"
                    element={
                        <RequireLearner>
                            <LearnerShell />
                            <LearnerQuizDetails />
                        </RequireLearner>
                    }
                />
                <Route
                    path="/learner/practice/:attemptId"
                    element={
                        <RequireLearner>
                            <LearnerShell />
                            <LearnerTakeQuiz />
                        </RequireLearner>
                    }
                />
                <Route
                    path="/learner/results/:attemptId"
                    element={
                        <RequireLearner>
                            <LearnerShell />
                            <LearnerQuizResults />
                        </RequireLearner>
                    }
                />
                <Route
                    path="/learner/progress"
                    element={
                        <RequireLearner>
                            <LearnerShell />
                            <LearnerProgress />
                        </RequireLearner>
                    }
                />
            </Routes>
            {isLearner && isLearnerAuthenticated() && <AIChatbot />}
        </main>
    );
}

export default App;
