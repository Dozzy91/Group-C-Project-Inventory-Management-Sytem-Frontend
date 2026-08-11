import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import Modal from "../components/Modal";

export default function Stores() {
  const { session, profile, loadingProfile, refreshProfile } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const stores = (profile?.store || []).filter(Boolean);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api.createStore(session.id, session.password, newStoreName);
      setNewStoreName("");
      setShowCreate(false);
      await refreshProfile();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Your ledger</span>
          <h1>Stores</h1>
        </div>
        <button className="btn btn-amber" onClick={() => setShowCreate(true)}>
          + New store
        </button>
      </div>

      {loadingProfile && <p>Loading your stores…</p>}

      {!loadingProfile && stores.length === 0 && (
        <div className="card empty-state">
          <h3>No stores yet</h3>
          <p>Add your first store to start tracking stock.</p>
        </div>
      )}

      <div className="store-grid">
        {stores.map((store) => (
          <Link
            key={store.storeId}
            to={`/stores/${encodeURIComponent(store.storeName)}`}
            className="card store-tag"
          >
            <h3>{store.storeName}</h3>
            <span className="count">
              {store.items.length} item{store.items.length === 1 ? "" : "s"} on the shelf
            </span>
            <span className="go">Open store →</span>
          </Link>
        ))}
      </div>

      {showCreate && (
        <Modal onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreate}>
            <span className="eyebrow">New store</span>
            <h2 style={{ fontSize: "1.25rem", marginBottom: 18 }}>Name your store</h2>
            {error && <div className="error-banner">{error}</div>}
            <div className="field">
              <label htmlFor="storeName">Store name</label>
              <input
                id="storeName"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="form-foot">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
              <button className="btn btn-amber" type="submit" disabled={busy}>
                {busy ? "Creating…" : "Create store"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
