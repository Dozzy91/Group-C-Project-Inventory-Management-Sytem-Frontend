const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
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

  // The backend always responds 200 and puts the real status in the body.
  const statusCode = body?.statusCode ?? res.status;

  if (statusCode >= 400) {
    throw new Error(body?.message || "Something went wrong");
  }

  return body;
}

const enc = encodeURIComponent;

export const api = {
  // ---- users ----
  createUser: (data) =>
    request("/user/create", { method: "POST", body: JSON.stringify(data) }),
  getAllUsers: () => request("/user/get"),
  searchUser: (id) => request(`/user/search/${enc(id)}`),
  getFullProfile: (id, userName) =>
    request(`/user/get_all/${enc(id)}/${enc(userName)}`),
  editUser: (id, password, data) =>
    request(`/user/edit/${enc(id)}/${enc(password)}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteUser: (id, password) =>
    request(`/user/delete/${enc(id)}/${enc(password)}`, { method: "DELETE" }),

  // ---- stores ----
  getAllStores: () => request("/inventory/get_all_stores"),
  getStore: (storeName) => request(`/inventory/get_store/${enc(storeName)}`),
  searchStores: (query) => request(`/inventory/search_store/${enc(query)}`),
  createStore: (id, password, storeName) =>
    request(`/inventory/create_store/${enc(id)}/${enc(password)}`, {
      method: "POST",
      body: JSON.stringify({ storeName }),
    }),
  editStore: (id, password, oldStoreName, storeName) =>
    request(
      `/inventory/edit_store/${enc(id)}/${enc(password)}/${enc(oldStoreName)}`,
      { method: "PATCH", body: JSON.stringify({ storeName }) },
    ),
  deleteStore: (id, password, storeName) =>
    request(
      `/inventory/delete_store/${enc(id)}/${enc(password)}/${enc(storeName)}`,
      { method: "DELETE" },
    ),

  // ---- items ----
  getAllStoreItems: (storeName) =>
    request(`/inventory/get_all_store_items/${enc(storeName)}`),
  searchItem: (storeName, itemName) =>
    request(`/inventory/search_item/${enc(storeName)}/${enc(itemName)}`),
  createItem: (id, password, data) =>
    request(`/inventory/create_item/${enc(id)}/${enc(password)}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  editItem: (id, password, storeName, itemId, data) =>
    request(
      `/inventory/edit_item/${enc(id)}/${enc(password)}/${enc(storeName)}/${enc(itemId)}`,
      { method: "PATCH", body: JSON.stringify(data) },
    ),
  deleteItem: (id, password, storeName, itemId) =>
    request(
      `/inventory/delete_item/${enc(id)}/${enc(password)}/${enc(storeName)}/${enc(itemId)}`,
      { method: "DELETE" },
    ),
};
