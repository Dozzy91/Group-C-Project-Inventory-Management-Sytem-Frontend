import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";

export default function Account() {
  const { session, profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [userName, setUserName] = useState(session?.userName || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);
    try {
      const payload = {};
      if (userName && userName !== session.userName) payload.userName = userName;
      if (password) payload.password = password;

      if (Object.keys(payload).length === 0) {
        setError("Change your name or set a new password first.");
        return;
      }

      await api.editUser(session.id, session.password, payload);

      // session is keyed on the current password, so update local storage
      // to match whatever changed.
      const nextSession = {
        ...session,
        userName: payload.userName || session.userName,
        password: payload.password || session.password,
      };
      localStorage.setItem("stockroom.session", JSON.stringify(nextSession));
      setPassword("");
      setSuccess("Account updated.");
      await refreshProfile();
      window.location.reload(); // simplest way to refresh session in context
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account? Your stores will remain but you'll lose access.")) return;
    try {
      await api.deleteUser(session.id, session.password);
      logout();
      navigate("/login");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Account</span>
          <h1>Your details</h1>
        </div>
      </div>

      <form className="card form-card wide" onSubmit={handleSave}>
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}
        <div className="field-row">
          <div className="field">
            <label htmlFor="userName">Name</label>
            <input id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
            />
          </div>
        </div>
        <p className="hint">
          You manage {profile?.store?.length || 0} store{profile?.store?.length === 1 ? "" : "s"}.
        </p>
        <div className="form-foot">
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            Delete account
          </button>
          <button className="btn btn-amber" type="submit" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}
