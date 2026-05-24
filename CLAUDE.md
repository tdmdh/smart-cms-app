# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## cms-web — Next.js Frontend

**Environment:** Arch Linux. Package manager: **Bun**. All commands run from `app/`.

## Commands

```bash
cd app
bun run dev      # dev server on :3000
bun run build    # production build
bun run start    # serve production build
bun run lint     # eslint

# Type generation from OpenAPI spec
bunx openapi-typescript <spec-url> -o src/types/api.d.ts
```

## Architecture

**Next.js 16 App Router** with three route groups:

```
app/app/
  (auth)/          public auth pages (login, register)
  (dashboard)/     protected app shell (requires session)
  (marketing)/     public marketing/landing pages
  portal/          client-facing portal
  api/             Next.js Route Handlers (server-side)
```

**Data layer** (`src/`):

```
api/
  client.ts        singleton ApiClient — fetch wrapper with retry, timeout,
                   auto token refresh (queued, race-safe), X-Workspace-ID header
  config.ts        getBackendApiUrl(), Endpoint type
  cookies.ts       cookie token read/write utilities
  <domain>/        typed endpoint definitions per domain
store/
  slices/          Redux Toolkit slices: auth, workspace, role, layout, breadcrumb
  provider.tsx     <Providers> wrapping redux-persist + react-query
  storage.ts       localStorage persist config
hooks/             custom React hooks (data fetching, UI state)
providers/         React context providers
types/             TypeScript types (auto-generated + manual)
components/        shared UI components
lib/               auth helpers and shared utilities
config/            proxy route config and other app-wide config
```

**Middleware** (`proxy.ts` at app root): Next.js middleware that redirects unauthenticated users away from protected routes and logged-in users away from auth pages, based on `access_token`/`refresh_token` cookies.

**State model:**
- Server state → `@tanstack/react-query`
- Client/session state → Redux Toolkit + `redux-persist` (localStorage key `persist:root`)
- Current workspace id is read from `persist:root → workspace.currentWorkspaceId` and injected as `X-Workspace-ID` on every API call

**Auth flow:** access + refresh tokens stored as HTTP-only cookies. `ApiClient` detects 401, calls `/auth/refresh`, queues concurrent requests until refresh completes, then replays them.

## Style Rules

- Functional components only, strict TypeScript (no `any`)
- SCSS modules for component styles; Tailwind v4 for utilities
- Radix UI primitives for accessible components
- Animation: Framer Motion and/or GSAP

## Knowledge Graph (graphify)

A pre-built knowledge graph of this frontend lives at `graph/web/` (root of the monorepo).

- **960 nodes · 1,035 edges · 212 communities**
- Interactive viz: `graph/web/graph.html` — open in any browser
- Obsidian vault: `graph/web/obsidian/` — open as vault in Obsidian
- Scope: `cms-web/app/app` + `cms-web/app/src` (TypeScript/TSX, AST-extracted)
- God nodes (most connected): `ApiClient`, `authSlice`, `requireAuth`

**Query the graph before reading files cold:**
```bash
/graphify query "how does token refresh work"
/graphify path "ApiClient" "authSlice"
/graphify explain "requireAuth"
```

**Rebuild after changes:**
```bash
/graphify cms-web/app/app cms-web/app/src --update --obsidian
```

Output goes to `graphify-out/` — move to `graph/web/` afterward.

## Dependencies

| Dependency | Role |
|---|---|
| `next` 16 | Framework (App Router) |
| `react` 19 | UI runtime |
| `@tanstack/react-query` | Server state / data fetching |
| `@reduxjs/toolkit` + `react-redux` | Client state |
| `redux-persist` | LocalStorage persistence |
| `sass` | SCSS styling |
| `tailwindcss` v4 | Utility CSS |
| `@radix-ui/*` | Accessible UI primitives |
| `framer-motion` | Animation |
| `gsap` | Advanced animation |
| `recharts` | Charts/analytics |
| `@dnd-kit/*` | Drag-and-drop |
| `@react-three/fiber` + `three` | 3D/WebGL |
| `openapi-typescript` | Type generation from OpenAPI spec |
