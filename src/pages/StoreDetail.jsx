import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import Modal from "../components/Modal";
import StatusPill from "../components/StatusPill";

const emptyItem = { itemName: "", category: "", price: "", quantity: "", supplier: "" };
const emptyRetrieveLine = () => ({ key: crypto.randomUUID(), itemId: "", quantity: "" });

export default function StoreDetail() {
  const { storeName } = useParams();
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [query, setQuery] = useState("");

  const [itemModal, setItemModal] = useState(null); // null | "create" | item object
  const [form, setForm] = useState(emptyItem);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);

  const [showRetrieve, setShowRetrieve] = useState(false);
  const [retrieveLines, setRetrieveLines] = useState([emptyRetrieveLine()]);
  const [retrieveError, setRetrieveError] = useState("");
  const [retrieveBusy, setRetrieveBusy] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState(null);
  const [historyError, setHistoryError] = useState("");
  const [historyLoading, setHistoryLoading] = useState(false);

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

  const totals = useMemo(() => {
    const totalQuantity = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);
    const totalValue = items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 0), 0);
    return { totalQuantity, totalValue, distinctItems: items.length };
  }, [items]);

  // ---- item create/edit/delete ----

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
        await api.createItem({
          storeName,
          ...form,
          price: Number(form.price),
          quantity: Number(form.quantity),
        });
      } else {
        await api.editItem(storeName, itemModal.id, {
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
      await api.deleteItem(storeName, item.id);
      await load();
    } catch (err) {
      alert(err.message);
    }
  };

  // ---- retrieve (batch withdraw/restock) ----

  const openRetrieve = () => {
    setRetrieveLines([emptyRetrieveLine()]);
    setRetrieveError("");
    setShowRetrieve(true);
  };

  const closeRetrieve = () => setShowRetrieve(false);

  const addRetrieveLine = () => {
    setRetrieveLines((lines) => [...lines, emptyRetrieveLine()]);
  };

  const removeRetrieveLine = (key) => {
    setRetrieveLines((lines) => (lines.length > 1 ? lines.filter((l) => l.key !== key) : lines));
  };

  const updateRetrieveLine = (key, patch) => {
    setRetrieveLines((lines) => lines.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  // An item already chosen on one line shouldn't be selectable again on
  // another - each line's dropdown hides items picked elsewhere.
  const itemOptionsFor = (currentKey) => {
    const pickedElsewhere = new Set(
      retrieveLines.filter((l) => l.key !== currentKey && l.itemId).map((l) => l.itemId),
    );
    return items.filter((it) => !pickedElsewhere.has(it.id));
  };

  const handleRetrieveSubmit = async (e) => {
    e.preventDefault();
    setRetrieveError("");

    const lines = retrieveLines.filter((l) => l.itemId);
    if (lines.length === 0) {
      setRetrieveError("Select at least one item");
      return;
    }

    for (const line of lines) {
      const item = items.find((it) => it.id === line.itemId);
      const qty = Number(line.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        setRetrieveError(`Enter a quantity greater than zero for "${item?.itemName}"`);
        return;
      }
      if (item && qty > item.quantity) {
        setRetrieveError(`Only ${item.quantity} of "${item.itemName}" in stock`);
        return;
      }
    }

    setRetrieveBusy(true);
    try {
      await api.retrieveItems(
        storeName,
        lines.map((l) => ({ itemId: l.itemId, quantity: Number(l.quantity) })),
      );
      closeRetrieve();
      await load();
    } catch (err) {
      setRetrieveError(err.message);
    } finally {
      setRetrieveBusy(false);
    }
  };

  // ---- retrieval history ----

  const openHistory = async () => {
    setShowHistory(true);
    setHistoryError("");
    setHistoryLoading(true);
    try {
      const res = await api.getOrderHistory(storeName);
      setHistory(res.data);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const closeHistory = () => setShowHistory(false);

  // ---- store rename/delete ----

  const handleRename = async (e) => {
    e.preventDefault();
    setRenameError("");
    try {
      await api.editStore(storeName, renameValue);
      await refreshProfile();
      navigate(`/stores/${encodeURIComponent(renameValue)}`, { replace: true });
    } catch (err) {
      setRenameError(err.message);
    }
  };

  const handleDeleteStore = async () => {
    if (!window.confirm(`Delete "${storeName}" and all its items? This can't be undone.`)) return;
    try {
      await api.deleteStore(storeName);
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
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {!renaming && (
            <button className="btn btn-ghost" onClick={() => setRenaming(true)}>
              Rename
            </button>
          )}
          <button className="btn btn-ghost" onClick={openHistory}>
            Restock History
          </button>
          <button className="btn btn-danger" onClick={handleDeleteStore}>
            Delete store
          </button>
          <button className="btn btn-ghost" onClick={openRetrieve} disabled={items.length === 0}>
            Restock Shelf
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
        <>
        <div className="store-totals">
            <div>
              <span className="store-totals-label">Total stock value</span>
              <span className="store-totals-value">₦ {totals.totalValue.toLocaleString()}</span>
            </div>
            <div>
              <span className="store-totals-label">Total items in stock</span>
              <span className="store-totals-value">
                {totals.totalQuantity.toLocaleString()} units · {totals.distinctItems} product
                {totals.distinctItems === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="ledger-scroll">
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
                    <td data-label="Item">{item.itemName}</td>
                    <td data-label="Category">{item.category}</td>
                    <td data-label="Supplier">{item.supplier}</td>
                    <td className="num" data-label="Price">₦ {Number(item.price).toLocaleString()}</td>
                    <td className="num" data-label="Qty">{item.quantity}</td>
                    <td data-label="Status">
                      <StatusPill quantity={item.quantity} />
                    </td>
                    <td data-label="">
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
          </div>
        </>
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

      {showRetrieve && (
        <Modal onClose={closeRetrieve}>
          <form onSubmit={handleRetrieveSubmit} className="retrieve-form">
            <span className="eyebrow">Restock shelf</span>
            <h2 style={{ fontSize: "1.25rem", marginBottom: 6 }}>Retrieve items</h2>
            <p className="hint" style={{ marginBottom: 18 }}>
              Pick an item and how many to take out. Add more rows for a multi-item order.
            </p>
            {retrieveError && <div className="error-banner">{retrieveError}</div>}

            {retrieveLines.map((line, idx) => {
              const selected = items.find((it) => it.id === line.itemId);
              const options = itemOptionsFor(line.key);
              return (
                <div className="retrieve-line" key={line.key}>
                  <div className="field">
                    <label>{idx === 0 ? "Item" : `Item ${idx + 1}`}</label>
                    <select
                      value={line.itemId}
                      onChange={(e) => updateRetrieveLine(line.key, { itemId: e.target.value })}
                      required
                    >
                      <option value="" disabled>
                        Select an item…
                      </option>
                      {options.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.itemName} ({it.quantity} in stock)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field retrieve-qty">
                    <label>Qty</label>
                    <input
                      type="number"
                      min="1"
                      max={selected?.quantity ?? undefined}
                      value={line.quantity}
                      onChange={(e) => updateRetrieveLine(line.key, { quantity: e.target.value })}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost retrieve-remove"
                    onClick={() => removeRetrieveLine(line.key)}
                    disabled={retrieveLines.length === 1}
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={addRetrieveLine}
              disabled={retrieveLines.length >= items.length}
            >
              + Add item
            </button>

            <div className="form-foot">
              <button type="button" className="btn btn-ghost" onClick={closeRetrieve}>
                Cancel
              </button>
              <button className="btn btn-amber" type="submit" disabled={retrieveBusy}>
                {retrieveBusy ? "Retrieving…" : "Retrieve"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showHistory && (
        <Modal onClose={closeHistory}>
          <span className="eyebrow">History</span>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 18 }}>Retrieval history</h2>
          {historyLoading && <p>Loading…</p>}
          {historyError && <div className="error-banner">{historyError}</div>}
          {!historyLoading && !historyError && history?.length === 0 && (
            <p className="hint">No retrievals recorded for this store yet.</p>
          )}
          {!historyLoading && history?.length > 0 && (
            <div className="history-list">
              {history.map((order) => (
                <div className="history-entry" key={order.orderId}>
                  <div className="history-entry-head">
                    <span className="history-date">
                      {new Date(order.retrievedAt).toLocaleString()}
                    </span>
                  </div>
                  <ul>
                    {order.items.map((line) => (
                      <li key={line.itemId}>
                        {line.itemName || `Item ${line.itemId}`} × {line.quantity}
                        {line.lineTotal != null ? ` = ₦ ${line.lineTotal.toLocaleString()}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <div className="form-foot">
            <button type="button" className="btn btn-ghost" onClick={closeHistory}>
              Close
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
