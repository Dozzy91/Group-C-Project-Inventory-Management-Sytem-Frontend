# Stockroom — Inventory Frontend

A standalone React (Vite) frontend for your Node/Express + JSON-file inventory API.

## 1. One required backend change: enable CORS

Your backend doesn't currently send CORS headers, so a browser app running on a
different port (this frontend, on `5173`) will be blocked from calling it. In
your backend project:

```bash
npm install cors
```

Then in `index.js`, add it before your routes:

```js
import cors from "cors";
// ...
app.use(cors());
app.use(express.json());
```

That's the only backend change needed — every route this frontend calls
already exists and is untouched otherwise.

## 2. Run the backend

```bash
cd your-backend-folder
npm install
npm start
```

It should be listening on `http://127.0.0.1:3000`.

## 3. Run this frontend

```bash
npm install
cp .env.example .env   # adjust VITE_API_URL if your backend runs elsewhere
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## How it maps to your API

- **Sign in** — there's no `/login` route in your API, so the frontend signs
  in by fetching `/user/get` and matching the name + password client-side,
  the same check your `authMiddleware` does.
- **Register** — calls `POST /user/create`, then immediately signs in and
  calls `POST /inventory/create_store/:id/:password` to create the first
  store (your `createUser` route accepts a `storeName` but doesn't attach it
  to the account on its own).
- **Stores page** — `GET /user/get_all/:id/:userName` for the signed-in
  user's stores, `POST /inventory/create_store/...`,
  `PATCH /inventory/edit_store/...`, `DELETE /inventory/delete_store/...`.
- **Store detail page** — `GET /inventory/get_store/:storeName` and the
  `create_item` / `edit_item` / `delete_item` routes, all scoped to
  `:id/:password` like your backend expects.
- **Account page** — `PATCH /user/edit/:id/:password` and
  `DELETE /user/delete/:id/:password`.

## Notes on the current backend design

- Credentials (`id` + `password`) travel in the URL path, and passwords are
  stored in plain text in `data/users.json`. That matches your existing
  `authMiddleware`, so the frontend works with it as-is — just worth knowing
  before this goes anywhere public. Moving to a header-based token (e.g. a
  JWT issued from a real `/login` route) would be the natural next step.
- "Low stock" (under 10 units) and "Out of stock" (0 units) badges are a
  frontend-only heuristic — your API doesn't define these thresholds, so
  adjust `LOW_THRESHOLD` in `src/components/StatusPill.jsx` if you want a
  different cutoff.
