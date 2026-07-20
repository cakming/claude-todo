# Vibe Coding Todo Manager — Frontend

> **Update (2026-07):** This section was added because the README below was still
> the untouched default Vite starter and said nothing about this app.

This is the single-page app (SPA) for the **Vibe Coding Todo Manager**. It is
built with **React 19 + Vite + Tailwind CSS** and talks to the Express/MongoDB
backend.

**Key features**

- **Kanban board** with drag-and-drop powered by `@dnd-kit`
- **Live updates** over WebSocket
- **Dark mode**
- **Docs** — rich-text pages via a TipTap block editor (with image upload)
- **Trash** — soft-delete with restore/purge
- **Sharing** — read-only public links for a project or page

**Development**

```bash
npm run dev      # Vite dev server on http://localhost:5173
```

**Testing**

- Unit/component tests: **Vitest**
- End-to-end tests: **Playwright** (specs live in `e2e/`)

---

The original Vite starter notes below are kept as generic-tooling reference.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
