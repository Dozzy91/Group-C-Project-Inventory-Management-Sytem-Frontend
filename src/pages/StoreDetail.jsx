import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";

const emptyItem = { itemName: "", category: "", price: "", quantity: "", supplier: "" };

export default function StoreDetail() {
  const { storeName } = useParams();
  const { session, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  const [itemModal, setItemModal] = useState(null); // null | "create" | item object
  const [form, setForm] = useState(emptyItem);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(storeName);
  const [renameError, setRenameError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.getStore(storeName);
      setStore(res.data);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeName]);

  useEffect(() => {
    load();
  }, [load]);

  const items = store?.items || [];
  const visibleItems = query
    ? items.filter((it) => it.itemName.toLowerCase().includes(query.toLowerCase()))
    : items;

  const openCreate = () => {
    setForm(emptyItem);
    setFormError("");
    setItemModal("create");
  };

  const openEdit = (item) => {
    setForm({
      itemName: item.itemName,
      category: item.category,
      price: item.price,
      quantity: item.quantity,
      supplier: item.supplier,
    });
    setFormError("");
    setItemModal(item);
  };

  const closeItemModal = () => setItemModal(null);

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setBusy(true);
    try {
      if (itemModal === "create") {
        await api.createItem(session.id, session.password, {
          storeName,
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
      } else {
        await api.editItem(session.id, session.password, storeName, itemModal.id, {
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
      }
      closeItemModal();
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Remove "${item.itemName}" from ${storeName}?`)) return;
    try {
      await api.deleteItem(session.id, session.password, storeName, item.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    setRenameError("");
    try {
      await api.editStore(session.id, session.password, storeName, renameValue);
      await refreshProfile();
      navigate(`/stores/${encodeURIComponent(renameValue)}`, { replace: true });
    } catch (err) {
      setRenameError(err.message);
    }
  };

  const handleDeleteStore = async () => {
    if (!window.confirm(`Delete "${storeName}" and all its items? This can't be undone.`)) return;
    try {
      await api.deleteStore(session.id, session.password, storeName);
      await refreshProfile();
      navigate("/stores");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p>Loading store…</p>;

  if (loadError) {
    return (
      <>
        <Link to="/stores" className="back-link">
          ← Back to stores
        </Link>
        <div className="error-banner">{loadError}</div>
      </>
    );
  }

  return (
    <>
      <Link to="/stores" className="back-link">
        ← Back to stores
      </Link>

      <div className="page-head">
        <div>
          <span className="eyebrow">Store</span>
          {renaming ? (
            <form onSubmit={handleRename} style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
              />
              <button className="btn btn-sm btn-amber" type="submit">
                Save
              </button>
              <button
                className="btn btn-sm btn-ghost"
                type="button"
                onClick={() => {
                  setRenaming(false);
                  setRenameValue(storeName);
                  setRenameError("");
                }}
              >
                Cancel
              </button>
            </form>
          ) : (
            <h1>{store.storeName}</h1>
          )}
          {renameError && <div className="error-banner">{renameError}</div>}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!renaming && (
            <button className="btn btn-ghost" onClick={() => setRenaming(true)}>
              Rename
            </button>
          )}
          <button className="btn btn-danger" onClick={handleDeleteStore}>
            Delete store
          </button>
          <button className="btn btn-amber" onClick={openCreate}>
            + Add item
          </button>
        </div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          placeholder="Search items in this store…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {visibleItems.length === 0 ? (
        <div className="card empty-state">
          <h3>{query ? "No items match your search" : "Nothing on the shelf yet"}</h3>
          <p>{query ? "Try a different search term." : "Add your first item to this store."}</p>
        </div>
      ) : (
        <table className="ledger">
          <thead>
            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td>{item.itemName}</td>
                <td>{item.category}</td>
                <td>{item.supplier}</td>
                <td className="num">₦{Number(item.price).toLocaleString()}</td>
                <td className="num">{item.quantity}</td>
                <td>
                  <StatusPill quantity={item.quantity} />
                </td>
                <td>
                  <div className="row-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => openEdit(item)}>
                      Edit
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteItem(item)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {itemModal && (
        <Modal onClose={closeItemModal}>
          <form onSubmit={handleItemSubmit}>
            <span className="eyebrow">{itemModal === "create" ? "New item" : "Edit item"}</span>
            <h2 style={{ fontSize: "1.25rem", marginBottom: 18 }}>
              {itemModal === "create" ? "Add to shelf" : form.itemName}
            </h2>
            {formError && <div className="error-banner">{formError}</div>}
            <div className="field">
              <label htmlFor="itemName">Item name</label>
              <input
                id="itemName"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                required
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="supplier">Supplier</label>
                <input
                  id="supplier"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="price">Price (₦)</label>
                <input
                  id="price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="quantity">Quantity</label>
                <input
                  id="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-foot">
              <button type="button" className="btn btn-ghost" onClick={closeItemModal}>
                Cancel
              </button>
              <button className="btn btn-amber" type="submit" disabled={busy}>
                {busy ? "Saving…" : itemModal === "create" ? "Add item" : "Save changes"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
