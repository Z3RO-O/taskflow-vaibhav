# TaskFlow

## 1. Overview

TaskFlow is a small task-management UI: register or sign in, work inside an **organization**, create **org-scoped** projects, and manage tasks (status, priority, assignee, due date) with **list** and **Kanban** views, filters, and drag-and-drop—including **manual order** within each column (persisted as `position` in the mock DB). Teammates can join via an **invite code** or `/register?invite=…`; the org owner can rename the workspace from the account menu.

**Stack:** React 19, TypeScript, Vite 8, React Router 7, Tailwind CSS, shadcn/ui (Radix Nova).

---

## 2. Architecture decisions

- **In-browser mock DB** instead of `json-server` / MSW for this iteration: zero extra container, works offline, and seeds on first visit. Tradeoff: data is per-browser, not shared across clients, and there are **no SQL migrations** until a real backend exists. Storage keys include **`taskflow_orgs`** for organizations (with `invite_code` and `owner_id`), plus users, projects, and tasks.
- **Organizations:** Each user has an `org_id`; projects belong to that org. Listing and project access are enforced in `mock-db` (wrong org → forbidden). Older `localStorage` without org data is **migrated** on load (see `ensureOrgMigration` / `patchOrganizationOwners` in `mock-db.ts`).
- **Auth:** Mock login/register issue a **fake** base64 token payload with `exp`; JWT shape matches the spec mentally, but tokens are **not** signed server-side.
- **Docker:** `Dockerfile` targets a **Node + Vite dev** workflow (Alpine, `npm install`, `npm run dev` on **5173**). `docker-compose.yml` exposes only **`react-dev`** (port **5173**, optional [Compose Watch](https://docs.docker.com/compose/how-tos/develop/)). Root **`nginx.conf`** is a template you can use later with a **multi-stage** image (build → copy `dist/` → nginx) if you add a production Compose service.

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

### Option B — Node on the host

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

## 4. Product features (current mock)

| Area | Behavior |
| ---- | -------- |
| **Register** | Optional **invite code** (or `?invite=` on `/register`). Empty code → new user gets a **new org** (they become `owner_id`). Valid code → user joins that org. |
| **Projects** | Shown for the signed-in user’s **org only**. Create/delete project: **delete** is still **project owner** only; **rename/description** can be updated by any org member. |
| **Tasks / Kanban** | Drag across columns updates **status** and order; drag within a column updates **order** (`reorderProjectTasks`). Assignees must be users in the **same org**. |
| **Navbar** | Avatar menu: **Invite teammates** (code + register link + rotate code), **Account & organization** (display name; **org rename** only if `user.id === org.owner_id`), **Log out**. |
| **Empty states** | Icon + copy + optional primary action (e.g. create first project/task). |

---

## 5. Test credentials

After a **fresh** app load (empty `localStorage`), the mock seeds automatically. Use:

```
Email:     test@example.com
Password:  password123
```

Additional seed user: `jane@example.com` / `password123`. Both users are in the seeded org **Acme Corp**; **Test User** is the org **owner** (`owner_id`). The seeded invite code is **`ACME-DEMO`** (use it when registering a third account to join the same org).

---

## 6. API reference

**Current implementation:** no HTTP server. The UI calls functions in `src/lib/mock-db.ts` (org-aware project/task APIs, `registerUser(..., inviteCode?)`, `reorderProjectTasks`, `updateUserProfile`, `updateOrganization`, etc.). Shapes roughly follow Appendix A where applicable; **org** and **invite** fields are mock-only extensions until a real backend exists.

**Target contract (Appendix A)** — for a future server at `http://localhost:4000`:

| Method | Path                  | Notes                                   |
| ------ | --------------------- | --------------------------------------- |
| POST   | `/auth/register`      | Body: `name`, `email`, `password` (+ optional `invite` / org join in a real API) |
| POST   | `/auth/login`         | Body: `email`, `password`               |
| GET    | `/projects`           | Header: `Authorization: Bearer <token>` |
| POST   | `/projects`           | Create project                          |
| GET    | `/projects/:id`       | Project + nested `tasks`                |
| PATCH  | `/projects/:id`       | Updates `name` / `description` (align org policy with product) |
| DELETE | `/projects/:id`       | `204`                                   |
| GET    | `/projects/:id/tasks` | Query: `?status=`, `?assignee=`         |
| POST   | `/projects/:id/tasks` | Create task                             |
| PATCH  | `/tasks/:id`          | Partial update                          |
| DELETE | `/tasks/:id`          | `204`                                   |

**Validation error (400):**

```json
{ "error": "validation failed", "fields": { "email": "is required" } }
```

**Other errors:** `401` `{ "error": "unauthorized" }`, `403` `{ "error": "forbidden" }`, `404` `{ "error": "not found" }`.

---

## 7. Insights about frontend-app

| Requirement                                                  | Status                                                                    |
| ------------------------------------------------------------ | ------------------------------------------------------------------------- |
| Login / Register, client validation, token in `localStorage` | Done (`RegisterPage` invite field + `?invite=`; `AuthContext`)            |
| Organizations, invites, org-scoped projects                 | Done (`mock-db`, `ProjectsPage`, `Navbar` dialogs)                         |
| Projects list + create                                       | Done                                                                      |
| Project detail, filters (status, assignee), task modal       | Done                                                                      |
| Navbar: avatar menu, invite + account, logout                | Done                                                                      |
| React Router + protected routes                              | Done                                                                      |
| Auth persists across refresh                                 | Done (`getSafeUserById` hydrates `org_id` if missing)                     |
| Loading / error / empty states (no silent failures)          | Mostly done; lists, modals, and `/` index route show spinners or messages |
| Kanban drag: **status + column order** with revert on error  | Done (`reorderProjectTasks`, `task-order.ts`)                              |
| Component library stated                                     | **shadcn/ui** (Radix Nova) — see Overview                                 |
| Responsive 375px / 1280px                                    | Layout uses responsive utilities; worth a manual pass before submit       |
| Production build without console errors                      | Run `npm run build` + `npm run preview` and smoke-test                    |

---

## 8. Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Vite dev server                  |
| `npm run build`   | Typecheck + production build     |
| `npm run preview` | Preview production build locally |
| `npm run lint`    | ESLint                           |
| `npm run format`  | Prettier                         |

---

Private / assignment use unless you add a license.
