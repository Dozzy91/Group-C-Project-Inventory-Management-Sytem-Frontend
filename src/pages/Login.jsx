import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(userName, password);
      navigate("/stores");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="centered-auth">
      <form className="card form-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Sign in</span>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 22 }}>Welcome back</h1>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label htmlFor="userName">Shop owner name</label>
          <input
            id="userName"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div className="form-foot">
          <button className="btn btn-amber" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>
        <p className="switch-line">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
