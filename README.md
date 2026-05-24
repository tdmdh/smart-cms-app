# cms-web

Frontend for a content management platform built with **Next.js 16 App Router**. This repository is a reference/portfolio snapshot — the active version has since migrated data-fetching to TanStack Start.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI runtime | React 19 |
| Server state | TanStack Query (migrated from custom ApiClient) |
| Client state | Redux Toolkit + redux-persist |
| Styling | SCSS modules + Tailwind v4 |
| Components | Radix UI primitives |
| Animation | Framer Motion, GSAP |
| Charts | Recharts |
| Package manager | Bun |

## Route groups

```
app/
  (auth)/        public auth pages — login, register, password reset
  (dashboard)/   protected app shell — requires valid session
  (marketing)/   public marketing / landing pages
  portal/        client-facing portal
```

## Source layout

```
src/
  api/           fetch wrapper, typed endpoint config, cookie helpers (reference — see note below)
  store/         Redux slices: auth, workspace, role, layout, breadcrumb
  hooks/         custom React hooks
  providers/     React context providers (QueryProvider, AuthBootstrap, WebSocket)
  components/    shared UI components
  config/        navigation, sidebar views, page actions, proxy routes
  lib/           auth helpers and shared utilities
  types/         TypeScript types (auto-generated from OpenAPI + manual)
  styles/        SCSS — layout, components, palettes, utilities
```

## API layer note

`src/api/` contains the original fetch infrastructure (ApiClient, typed Endpoint descriptors, cookie helpers) kept as reference. The domain endpoint files and Next.js route handlers (`app/api/`) have been removed following the migration to TanStack Start — the comments in each file describe what they did.

## Auth flow

Access and refresh tokens are stored as HTTP-only cookies. The middleware (`proxy.ts`) redirects unauthenticated users away from protected routes and authenticated users away from auth pages based on cookie presence.

## Development

```bash
cd app
bun install
bun run dev      # dev server on :3000
bun run build    # production build
bun run lint     # eslint
```

Environment variables:

```
NEXT_PUBLIC_API_BASE_URL   backend origin (defaults to http://localhost:8081 in dev)
API_BASE_URL               server-only override
```
