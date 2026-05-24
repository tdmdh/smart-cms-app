# CMS Web

Next.js frontend for the Noname Smart CMS platform. Talks exclusively to the REST gateway exposed by `cms-server`.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | React 19 |
| Language | TypeScript 5.9 (strict) |
| Package Manager | Bun |
| Server State | TanStack Query v5 |
| Client State | Redux Toolkit + redux-persist |
| Styling | SCSS Modules + Tailwind v4 |
| UI Primitives | Radix UI |
| Animation | Framer Motion, GSAP |
| 3D / WebGL | React Three Fiber + Drei |
| Charts | Recharts |
| Drag & Drop | dnd-kit |

## Getting Started

```bash
cd cms-web/app

# Install dependencies
bun install

# Start dev server (http://localhost:3000)
bun run dev
```

The frontend expects `cms-server` to be running on `http://localhost:8081`. Start it first:

```bash
cd cms-server
docker compose -f docker-compose.dev.yml up -d
```

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server on `:3000` |
| `bun run build` | Production build |
| `bun run start` | Serve production build |
| `bun run lint` | Run ESLint |
| `bunx openapi-typescript <spec> -o src/types/api.d.ts` | Regenerate API types from OpenAPI spec |

## Project Structure

All source lives under `cms-web/app/`:

```
app/                  # Next.js App Router root
  (auth)/             # Public auth pages
    login/
    register/
    verify-email/
    onboarding/
    accept-invitation/
    client-register/
  (dashboard)/        # Protected app shell (requires session)
  (marketing)/        # Public marketing pages
    home/, about/, pricing/, contact/
  portal/
    [clientSlug]/     # Dynamic client-facing portal

src/
  api/
    client.ts         # ApiClient singleton — fetch, retry, token refresh
    config.ts         # Backend URL + Endpoint type
    cookies.ts        # Token read/write (HTTP-only cookies)
    auth/, client/, cosign/, deployments/, integration/, knowledge/, project/
                      # Typed endpoint modules per domain
  store/
    slices/           # Redux slices: auth, workspace, role, layout, breadcrumb
    provider.tsx      # <Providers> wrapper (redux-persist + react-query)
    storage.ts        # localStorage persist config
  hooks/
    auth/             # Auth-related hooks
    layout/           # UI state hooks
    queries/          # Data-fetching hooks (wrapping React Query)
  components/
    auth/, chat/, clients/, cosign/, dashboard/, deployments/,
    integrations/, knowledge/, marketing/, media/, navigation/,
    onboarding/, portal/, projects/, shared/, sidebar-views/,
    tasks/, workspace/
  types/              # TypeScript types (auto-generated + manual)
  lib/                # Auth helpers and shared utilities
  config/             # Proxy route config, app-wide constants
  styles/             # SCSS organized by concern
    abstracts/, base/, components/, layout/, pages/, utilities/

proxy.ts              # Middleware — auth redirects based on cookies
```

## Authentication

Tokens are stored in HTTP-only cookies (`access_token`, `refresh_token`). The `ApiClient` in `src/api/client.ts` handles token refresh automatically:

1. Detects a `401` response.
2. Calls `/api/auth/refresh` (Next.js route handler).
3. Queues all concurrent requests that arrived during the refresh.
4. Replays queued requests after the new token is set.

The `proxy.ts` middleware runs on every request and redirects unauthenticated users away from protected routes and authenticated users away from auth pages.

## State Management

| Concern | Tool |
|---|---|
| Server data (API responses) | TanStack Query — caching, background refetch, optimistic updates |
| Session / workspace | Redux Toolkit — persisted to `localStorage` under `persist:root` |
| Current workspace | `workspace.currentWorkspaceId` slice; injected as `X-Workspace-ID` on every API call |

## Route Groups

| Group | Path prefix | Access |
|---|---|---|
| `(auth)` | `/login`, `/register`, etc. | Public (redirects to dashboard if logged in) |
| `(dashboard)` | `/` | Protected (redirects to `/login` if not authenticated) |
| `(marketing)` | `/home`, `/pricing`, etc. | Public |
| `portal` | `/portal/[clientSlug]` | Client-facing, separate auth context |

## Styling Conventions

- Component styles use SCSS modules (`.module.scss` co-located with the component).
- Tailwind utility classes are used for layout and spacing.
- Global tokens and variables live in `src/styles/abstracts/`.
- Never mix inline styles with SCSS modules in the same component.

## Code Conventions

- Functional components only; no class components.
- `strict` TypeScript — no `any`.
- Redux for client/session state; React Query for all server state. Do not use `useEffect` to fetch data.
- Use Radix UI primitives for interactive elements (dialogs, dropdowns, selects) to ensure accessibility.
- Keep page components thin — move logic into hooks under `src/hooks/`.
