# Órbita — frontend

Riwi Systems' single entry point: log in once, then reach every internal app from one dashboard. React 19 + TypeScript + Vite SPA, routed with `react-router`, authenticated against a backend-driven Microsoft OAuth flow (session cookie, no tokens handled client-side).

See `CLAUDE.md` for architecture, routing, design tokens, and component reference.

## Setup

```bash
pnpm install
cp .env.example .env   # set VITE_API_URL to your backend
pnpm dev
```

## Scripts

- `pnpm dev` — Vite dev server
- `pnpm build` — type-check (`tsc -b`) then production build
- `pnpm lint` — ESLint over the whole repo
- `pnpm preview` — preview the production build locally

No test runner is configured yet.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL (OAuth login/callback, `/auth/me`, `/auth/logout`) | none — required |
| `VITE_APP_NAME` | Document title | `Órbita` |
