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
2. [x] **Share-link expiry / TTL** — `expiresInDays` on create; public read returns 410 + removes expired. (UI selector ships with #5.)
3. [x] **Trash retention / auto-purge** — `TRASH_RETENTION_DAYS` (default 30); swept lazily on trash list.
4. [x] **Image URL hardening** — unguessable 128-bit token per upload (kept public-read so shares work); legacy ObjectId URLs still resolve.
5. [x] **Share management UI** — modal to create (with expiry), copy, and revoke links.
6. [x] **Notion-style block editor** — TipTap WYSIWYG (headings, lists, quote, code, image); old markdown pages auto-convert on open.
7. [x] **Comments / mentions** — comment threads on epics/features/tasks with @mention parsing + highlight.
8. [x] **Project-level soft-delete** — projects trash/restore/purge + a Manage-projects modal.

**All backlog items complete.** ✅

## Follow-ups (done)

- [x] **Mention notifications** — email (nodemailer) + optional Telegram bot,
  dispatched when a comment @mentions a user. Users link Telegram from a
  Notifications settings modal.

## Deferred

- [ ] **GCS image storage** — move uploads from GridFS to a Google Cloud Storage
  bucket with signed URLs (needs a bucket + service-account credentials). Keeps
  MongoDB lean at image scale.

## Not planned (notes only)

- Redis caching, PostgreSQL migration — mentioned in `DEPLOYMENT_GCP.md` as
  options, not committed work.

## External (not code)

- Deploy to `todo.dvlpr.sh` (config in `DEPLOYMENT_GCP.md`).
- Unblock CI (GitHub Actions billing).
