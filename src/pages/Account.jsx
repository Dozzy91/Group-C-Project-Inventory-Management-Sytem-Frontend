import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import PasswordField from "../components/PasswordField";

export default function Account() {
  const { session, profile, logout, refreshProfile, setSession } = useAuth();
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

      const res = await api.editUser(payload);

      // The access token cookie is unaffected by a name/password change -
      // it's still valid until it naturally expires in an hour. Just
      // update the lightweight session cache the UI reads from.
      setSession({ id: res.data.id, userName: res.data.userName });
      setPassword("");
      setSuccess("Account updated.");
      await refreshProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your account? Your stores will remain but you'll lose access.")) return;
    try {
      await api.deleteUser();
      await logout();
      navigate("/");
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
            <PasswordField
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
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
