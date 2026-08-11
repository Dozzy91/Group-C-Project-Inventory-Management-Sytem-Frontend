import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await register(userName, password, storeName);
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
        <span className="eyebrow">Get started</span>
        <h1 style={{ fontSize: "1.5rem", marginBottom: 22 }}>Open your ledger</h1>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label htmlFor="userName">Your name</label>
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
            autoComplete="new-password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="storeName">First store name</label>
          <input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="e.g. Chuncky Kitten"
            required
          />
          <p className="hint">You can add more stores later.</p>
        </div>
        <div className="form-foot">
          <button className="btn btn-amber" type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create account"}
          </button>
        </div>
        <p className="switch-line">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
