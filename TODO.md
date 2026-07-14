# Roadmap / TODO

Living backlog for the Vibe Coding Todo Manager. Shipped work is summarized in
`WRITEUP.md`; this file tracks what's next.

## Shipped (merged or on the current branch)

- ✅ Phases A–D (polish, scale/robustness, auth completeness, product features)
- ✅ Bulk task operations, forgot-password via email
- ✅ Server-side search & filtering
- ✅ Optimistic UI updates
- ✅ Structured logging (pino) + opt-in error monitoring (Sentry)
- ✅ Undo for deletes → **persistent trash bin** (soft-delete, restore/purge)
- ✅ Accessibility pass (focus trap, ARIA, keyboard drag)
- ✅ In-app **Docs** (markdown pages + image upload via GridFS)
- ✅ **Public sharing** (read-only links for a project or page)
- ✅ Project write-up

## Backlog (in execution order)

1. [x] **Backend dependency advisories** — `npm audit fix` + nodemailer 6→9; 0 prod vulns.
2. [ ] **Share-link expiry / TTL** — optional expiry; public read rejects expired links.
3. [ ] **Trash retention / auto-purge** — automatically purge items older than a window.
4. [ ] **Auth-gated image serving** — tighten image reads without breaking public shares.
5. [ ] **Share management UI** — list and revoke existing links from the app.
6. [ ] **Notion-style block editor** — replace the Docs markdown textarea (TipTap).
7. [ ] **Comments / mentions** — threads on epics/features/tasks.
8. [ ] **Project-level soft-delete** — trash and restore whole projects.

## Not planned (notes only)

- Redis caching, PostgreSQL migration — mentioned in `DEPLOYMENT_GCP.md` as
  options, not committed work.

## External (not code)

- Deploy to `todo.dvlpr.sh` (config in `DEPLOYMENT_GCP.md`).
- Unblock CI (GitHub Actions billing).
