# Building the Vibe Coding Todo Manager

A project write-up — what it is, how it's built, the decisions that shaped it,
and the bugs worth remembering.

## What it is

A full-stack, hierarchical work tracker: **Projects → Epics → Features → Tasks**,
with status that rolls up automatically (complete every task and its feature —
then its epic — auto-completes). It grew from a basic CRUD app into a
production-shaped tool with real-time collaboration, authentication, an in-app
docs surface, public sharing, and a persistent trash bin.

There are three pieces:

- **Frontend** — React 19 + Vite + Tailwind CSS. A single-page app with a
  Kanban board (drag-and-drop via `@dnd-kit`), live updates over WebSockets, and
  a light/dark theme.
- **Backend** — Node + Express 4 with the native MongoDB driver, Socket.IO for
  real-time, JWT auth, and GridFS for image storage.
- **MCP server** — a TypeScript Model Context Protocol server so an AI agent can
  drive the same data model programmatically.

## Architecture at a glance

### Data model: one collection per project

Every project is a Mongo collection (`project_<name>`) holding heterogeneous
documents discriminated by a `type` field (`epic` / `feature` / `task` /
`page`). Parent links are ObjectId references (`epic_id`, `feature_id`). This
keeps a project's data physically isolated and makes export/import a
straight collection dump.

The trade-off is that *every* query must carry its `type` (and now
`deleted_at`) filter — there's no schema enforcing it. The test suite leans
hard on this being right.

### Real-time

Mutations call a best-effort `logActivity()` that both records an activity entry
and emits a `project:updated` Socket.IO event. Clients hold a `refreshTick`
counter; when it bumps, views silently refetch (no spinner). This is how a
change in one tab appears in another — and how optimistic updates reconcile to
authoritative server state.

### Auth

Optional, toggled by `AUTH_ENABLED`. When on: JWT bearer tokens, bcrypt
password hashing, role-based access (`admin` can manage users), and rate-limited
login/register/forgot-password endpoints. When off, `authenticate` is a
pass-through, so the same code runs open in development.

## Feature tour

- **Kanban + list views** with drag-to-change-status and optimistic UI.
- **Auto-status roll-up** across the whole tree.
- **Bulk operations** — multi-select tasks to complete or delete at once.
- **Server-side search & filtering** on every list endpoint.
- **Docs** — per-project markdown pages with a live sanitized preview and image
  upload (stored in GridFS).
- **Public sharing** — unguessable read-only links to a whole project tree or a
  single doc page, rendered by a standalone view with no auth.
- **Persistent trash** — deletes are soft; a Trash view restores or purges.
- **Undo** — every delete surfaces an Undo toast (restores the delete batch).
- **Export / import** — round-trip a project as JSON.
- **Real-time**, **dark mode**, **keyboard shortcuts**, and an **activity feed**.

## Decisions & bugs worth remembering

**Project isolation hinged on one Express flag.** Project-scoped routers are
mounted under `/api/:project/...`, but a child router only sees `:project` if
it's created with `Router({ mergeParams: true })`. Missing that on the scoped
routers meant `req.params.project` was `undefined` — and every write silently
landed in a single `project_undefined` collection. The fix was one option per
router; the guard against regression is an integration test that creates data
in project A and asserts project B can't see it.

**Client-side search silently missed data.** The epic list paginated on the
server but filtered on the client — so searching only looked at the epics
already loaded, quietly ignoring matches on later pages. Search moved to the
server (regex-escaped, combined with pagination). An E2E seeds 12 epics and
asserts a search finds one on a page that was never loaded.

**Soft-delete rides on a MongoDB quirk.** `{ deleted_at: null }` matches
documents where the field is *null or entirely absent*. That's what let the
trash bin exclude trashed docs from ~18 read queries without backfilling a
`deleted_at: null` onto every existing document. The in-memory fake collection
used by unit tests had to learn the same semantics (plus `$ne`, `$unset`,
`updateMany`) so the tests exercise the real code paths.

**Optimistic UI + real-time reconcile cleanly.** Status changes apply to local
state instantly and roll back on error; because the server also emits a
`project:updated`, the authoritative state (including parent auto-status the
client didn't compute) silently catches up a moment later. No manual refetch,
no flash of stale data — the monotonic load-id guard drops any superseded
response.

**Images can't send an auth header.** An `<img>` tag can't attach a JWT, so the
GridFS image-read endpoint is public (the id is an unguessable, project-scoped
ObjectId) while uploads stay authenticated. This is also what makes images work
inside a public shared page.

## Testing

Four layers, each catching a different class of bug:

- **Backend unit** (Node's built-in test runner) against an in-memory fake
  collection — fast checks of controller logic and cascade/auto-status rules.
- **Backend integration** (`mongodb-memory-server` + supertest) — real Express
  routing, middleware, and driver queries against an ephemeral Mongo, including
  project isolation, pagination, trash, sharing, and a GridFS image round-trip.
- **Frontend unit** (Vitest + React Testing Library) — components, helpers, and
  the markdown renderer's XSS sanitization.
- **End-to-end** (Playwright, two configs — auth-off and auth-on) — real user
  flows in Chromium, including drag-drop, undo, trash restore, and loading a
  public share link.

Current tally: **64 + 19** backend, **54** frontend unit, **19 + 4** E2E — all
green locally. (CI is configured but currently blocked by a GitHub Actions
billing limit, not by the code.)

## Deployment

Built for a single VM behind nginx: the frontend is static files served
same-origin, `/api` proxies to the Node process, and `/socket.io` upgrades to
the WebSocket. MongoDB (and optional Redis/Postgres) are already provisioned.
Details live in `DEPLOYMENT_GCP.md`.

## What's next

A few ideas remain on the table: auth-gated image serving, a Notion-style block
editor to replace the markdown textarea, retention/auto-purge for the trash bin,
and richer collaboration (comments, mentions). But the core is feature-complete
and production-shaped — the next real milestone is shipping it.
