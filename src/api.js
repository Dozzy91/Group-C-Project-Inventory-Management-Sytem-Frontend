const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

async function request(path, options = {}, { skipAuthEvent = false } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      // Send/receive the httpOnly access-token cookie on every request.
      // Required for cross-origin cookies (frontend on :5173, backend on
      // its own port) - the backend's CORS config must mirror this with
      // credentials: true and an explicit origin (not "*").
      credentials: "include",
      ...options,
    });
  } catch (err) {
    throw new Error(
      "Could not reach the inventory server. Is it running, and is CORS enabled? See the README.",
    );
  }

  let body;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  // The backend always responds 200 and puts the real status in the body,
  // except for auth failures where it also sets a real HTTP status.
  const statusCode = body?.statusCode ?? res.status;

  // A 401 mid-session means the access token cookie has expired or was
  // rejected. Broadcast it so AuthContext (which owns the router) can log
  // the user out and send them to the homepage. Auth bootstrap calls
  // (login/logout/me) opt out - a 401 there just means "not logged in
  // yet", not "your session just expired".
  if (statusCode === 401 && !skipAuthEvent && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("auth:expired"));
  }

  if (statusCode >= 400) {
    const error = new Error(body?.message || "Something went wrong");
    error.statusCode = statusCode;
    throw error;
  }

  return body;
}

const enc = encodeURIComponent;

export const api = {
  // ---- auth ----
  login: (userName, password) =>
    request(
      "/user/login",
      { method: "POST", body: JSON.stringify({ userName, password }) },
      { skipAuthEvent: true },
    ),
  logout: () => request("/user/logout", { method: "POST" }, { skipAuthEvent: true }),
  me: () => request("/user/me", {}, { skipAuthEvent: true }),

  // ---- users ----
  createUser: (data) =>
    request("/user/create", { method: "POST", body: JSON.stringify(data) }),
  getAllUsers: () => request("/user/get"),
  searchUser: (id) => request(`/user/search/${enc(id)}`),
  getFullProfile: (id, userName) =>
    request(`/user/get_all/${enc(id)}/${enc(userName)}`),
  editUser: (data) =>
    request(`/user/edit`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteUser: () => request(`/user/delete`, { method: "DELETE" }),

  // ---- stores ----
  getAllStores: () => request("/inventory/get_all_stores"),
  getStore: (storeName) => request(`/inventory/get_store/${enc(storeName)}`),
  searchStores: (query) => request(`/inventory/search_store/${enc(query)}`),
  createStore: (storeName) =>
    request(`/inventory/create_store`, {
      method: "POST",
      body: JSON.stringify({ storeName }),
    }),
  editStore: (oldStoreName, storeName) =>
    request(`/inventory/edit_store/${enc(oldStoreName)}`, {
      method: "PATCH",
      body: JSON.stringify({ storeName }),
    }),
  deleteStore: (storeName) =>
    request(`/inventory/delete_store/${enc(storeName)}`, {
      method: "DELETE",
    }),

  // ---- items ----
  getAllStoreItems: (storeName) =>
    request(`/inventory/get_all_store_items/${enc(storeName)}`),
  searchItem: (storeName, itemName) =>
    request(`/inventory/search_item/${enc(storeName)}/${enc(itemName)}`),
  createItem: (data) =>
    request(`/inventory/create_item`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  editItem: (storeName, itemId, data) =>
    request(`/inventory/edit_item/${enc(storeName)}/${enc(itemId)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteItem: (storeName, itemId) =>
    request(`/inventory/delete_item/${enc(storeName)}/${enc(itemId)}`, {
      method: "DELETE",
    }),
  // Withdraw/sell one or more items in a single batch - decrements stock
  // rather than replacing it outright, and logs the batch as an order.
  retrieveItems: (storeName, items) =>
    request(`/inventory/retrieve_items/${enc(storeName)}`, {
      method: "POST",
      body: JSON.stringify({ items }),
    }),
  getOrderHistory: (storeName) =>
    request(`/inventory/order_history/${enc(storeName)}`),
};
