import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    getLearnerProfile,
    logInLearner,
    signUpLearner,
    updateLearnerProfile
} from "../services/authService";
import { clearLearnerToken, getLearnerToken } from "../services/learnerSession";

function LearnerAccount() {
    const navigate = useNavigate();
    const [mode, setMode] = useState(getLearnerToken() ? "profile" : "login");
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ display_name: "", email: "", password: "" });
    const [loading, setLoading] = useState(Boolean(getLearnerToken()));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    useEffect(() => {
        if (!getLearnerToken()) return undefined;
        let isCurrent = true;

        getLearnerProfile()
            .then((profile) => {
                if (isCurrent) {
                    setUser(profile);
                    setForm({ display_name: profile.display_name, email: profile.email, password: "" });
                }
            })
            .catch((requestError) => {
                if (isCurrent) {
                    clearLearnerToken();
                    setMode("login");
                    setError(requestError.message);
                }
            })
            .finally(() => {
                if (isCurrent) setLoading(false);
            });

        return () => {
            isCurrent = false;
        };
    }, []);

    const updateField = (event) => {
        setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    };

    const submitCredentials = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        setSaving(true);

        try {
            const result = mode === "signup"
                ? await signUpLearner(form)
                : await logInLearner({ email: form.email, password: form.password });
            setUser(result.user);
            navigate("/learner", { replace: true });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const saveProfile = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");
        setSaving(true);

        try {
            const profile = await updateLearnerProfile({
                display_name: form.display_name,
                email: form.email
            });
            setUser(profile);
            setNotice("Profile updated.");
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setSaving(false);
        }
    };

    const logOut = () => {
        clearLearnerToken();
        setUser(null);
        setForm({ display_name: "", email: "", password: "" });
        setMode("login");
        navigate("/learner/account", { replace: true });
    };

    if (loading) return <p>Loading account...</p>;

    return (
        <section className="card learner-account">
            <h2>{user ? "Learner Profile" : mode === "signup" ? "Create learner account" : "Learner sign in"}</h2>
            <p className="learner-account__intro">
                {user ? "Update the name and email associated with your quiz practice." : "Sign in or create an account to browse quizzes and save your results."}
            </p>

            {error && <div className="error" role="alert">{error}</div>}
            {notice && <p className="learner-account__notice" role="status">{notice}</p>}

            {!user && (
                <div className="nav-tabs learner-account__modes" aria-label="Account mode">
                    <button type="button" className={`nav-tab ${mode === "login" ? "active" : ""}`} onClick={() => { setMode("login"); setError(""); }}>
                        Log in
                    </button>
                    <button type="button" className={`nav-tab ${mode === "signup" ? "active" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>
                        Sign up
                    </button>
                </div>
            )}

            <form onSubmit={user ? saveProfile : submitCredentials}>
                {(user || mode === "signup") && (
                    <label>
                        Name
                        <input
                            name="display_name"
                            value={form.display_name}
                            onChange={updateField}
                            maxLength={120}
                            autoComplete="name"
                            required
                        />
                    </label>
                )}
                <label>
                    Email
                    <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={updateField}
                        maxLength={254}
                        autoComplete="email"
                        required
                    />
                </label>
                {!user && (
                    <label>
                        Password
                        <input
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={updateField}
                            minLength={8}
                            maxLength={128}
                            autoComplete={mode === "signup" ? "new-password" : "current-password"}
                            required
                        />
                    </label>
                )}
                <div className="actions">
                    <button type="submit" disabled={saving}>
                        {saving ? "Please wait..." : user ? "Save profile" : mode === "signup" ? "Create account" : "Log in"}
                    </button>
                    {user && <button type="button" className="secondary" onClick={logOut}>Log out</button>}
                </div>
            </form>
        </section>
    );
}

export default LearnerAccount;