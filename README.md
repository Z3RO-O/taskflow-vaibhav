# TaskFlow

## 1. Overview

TaskFlow is a small task-management UI: register or sign in, create projects, and manage tasks (status, priority, assignee, due date) with list and Kanban views, filters, and drag-and-drop between columns.

**Stack:** React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS **v4** (`@tailwindcss/vite`), shadcn/ui (Radix Nova), Sonner, `@hello-pangea/dnd`, date-fns.

---

## 2. Architecture decisions

- **In-browser mock DB** instead of `json-server` / MSW for this iteration: zero extra container, works offline, and seeds on first visit. Tradeoff: data is per-browser, not shared across clients, and there are **no SQL migrations** until a real backend exists.
- **Auth:** Mock login/register issue a **fake** base64 token payload with `exp`; JWT shape matches the spec mentally, but tokens are **not** signed server-side.
- **Docker:** `Dockerfile` targets a **Node + Vite dev** workflow (Alpine, `npm install`, `npm run dev` on **5173**). `docker-compose.yml` defines **`react-dev`** (port **5173**, optional [Compose Watch](https://docs.docker.com/compose/how-tos/develop/)) and **`react-prod`** (image tag `docker-reactjs-sample`, host port **8080**). Root **`nginx.conf`** is an **nginx template** for serving `dist/` on port **8080** with SPA fallback — wire it in by adding a **multi-stage** production image (build → copy `dist/` → `nginx`) when you want static hosting in Compose.

---

## 3. Running locally

### Option A — Docker Compose (dev)

From the repo root:

```bash
git clone <your-repo-url> taskflow
cd taskflow
docker compose up react-dev --build
```

Open **http://localhost:5173** (Vite is configured with `server.host: true` and `strictPort: true` in `vite.config.ts`).

To use **Compose Watch** (sync edits into the container while `react-dev` runs):

```bash
docker compose up react-dev --build --watch
```

### Option B — `react-prod` service

`react-prod` publishes **8080:8080** and uses image name **`docker-reactjs-sample`**. The **current** `Dockerfile` only runs the **Vite dev server** on **5173**, so that service is only useful after you add a **production** stage (e.g. `npm run build` + nginx using `nginx.conf`). Until then, prefer **`react-dev`** for Docker.

### Option C — Node on the host

```bash
git clone <your-repo-url> taskflow
cd taskflow
npm ci
npm run dev
```

Open the URL Vite prints (defaults to **http://localhost:5173**).

### Production preview (no Docker)

```bash
npm run build
npm run preview
```

---


## 5. Test credentials

After a **fresh** app load (empty `localStorage`), the mock seeds automatically. Use:

```
Email:    test@example.com
Password: password123
```

Additional seed user: `jane@example.com` / `password123`.

---

## 6. API reference

**Current implementation:** no HTTP server. The UI calls functions in `src/lib/mock-db.ts` that mirror Appendix A behavior (status codes and error shapes where relevant).

**Target contract (Appendix A)** — for a future server at `http://localhost:4000`:

| Method | Path | Notes |
|--------|------|--------|
| POST | `/auth/register` | Body: `name`, `email`, `password` |
| POST | `/auth/login` | Body: `email`, `password` |
| GET | `/projects` | Header: `Authorization: Bearer <token>` |
| POST | `/projects` | Create project |
| GET | `/projects/:id` | Project + nested `tasks` |
| PATCH | `/projects/:id` | Owner updates `name` / `description` |
| DELETE | `/projects/:id` | `204` |
| GET | `/projects/:id/tasks` | Query: `?status=`, `?assignee=` |
| POST | `/projects/:id/tasks` | Create task |
| PATCH | `/tasks/:id` | Partial update |
| DELETE | `/tasks/:id` | `204` |

**Validation error (400):**

```json
{ "error": "validation failed", "fields": { "email": "is required" } }
```

**Other errors:** `401` `{ "error": "unauthorized" }`, `403` `{ "error": "forbidden" }`, `404` `{ "error": "not found" }`.

---

## 7. Insights about frontend-app

| Requirement | Status |
|-------------|--------|
| Login / Register, client validation, token in `localStorage` | Done (`RegisterPage` field errors; `AuthContext`) |
| Projects list + create | Done |
| Project detail, filters (status, assignee), task modal | Done |
| Navbar: name, logout | Done |
| React Router + protected routes | Done |
| Auth persists across refresh | Done |
| Loading / error / empty states (no silent failures) | Mostly done; lists, modals, and `/` index route show spinners or messages |
| Optimistic task **status** change with revert | Done (`ProjectDetailPage` + Kanban) |
| Component library stated | **shadcn/ui** (Radix Nova) — see Overview |
| Responsive 375px / 1280px | Layout uses responsive utilities; worth a manual pass before submit |
| Production build without console errors | Run `npm run build` + `npm run preview` and smoke-test |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

---

Private / assignment use unless you add a license.
