# Seerial Suite — Monorepo Architecture

**Date:** 2026 | **Status:** ✅ Defined

## Overview

Seerial is a media management suite structured as a monorepo managed with **pnpm workspaces**. This document defines the architectural decisions that govern all client applications, ensuring consistency, code reuse, and maintainability across the two clients: Web and Desktop.

---

## 1. Monorepo Structure

```
seerial/
│
├── apps/
│   ├── server/         # @seerial/server    — Node.js backend (hexagonal architecture)
│   ├── web/            # @seerial/web       — React + Vite CMS client
│   └── desktop/        # @seerial/desktop   — Tauri + React desktop player
│
├── libs/
│   ├── api/            # @seerial/api       — TanStack Query hooks + API client
│   ├── cli/            # @seerial/cli       — CLI tools
│   ├── domain/         # @seerial/domain    — Domain types, mappers, business rules
│   ├── hooks/          # @seerial/hooks     — Shared utility hooks
│   ├── stores/         # @seerial/stores    — Shared Zustand stores
│
├── assets/
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

---

## 2. Guiding Principles

### 2.1 Feature-Sliced Design (Vertical Slices)

All client applications follow the **Feature-Sliced Design** pattern: code is grouped by business domain, not by file type.

```
# ❌ Do NOT use — organized by type
src/components/   src/hooks/   src/services/

# ✅ Use — organized by feature
src/features/library/
src/features/player/
src/features/settings/
```

Every feature is a self-contained vertical slice. Deleting `features/library/` removes everything related to the library feature and nothing else.

### 2.2 The Dependency Rule

Dependencies flow in one direction only, both across libs and within a feature:

```
apps/*
  └── libs/api        (TanStack Query hooks)
        └── libs/domain    (types, mappers, domain functions)
              └── @seerial/server types (via shared-types)
```

**Cross-feature imports are forbidden.** If two features need to share something, that thing belongs in a `shared/` folder within the app or in a `libs/` package.

### 2.3 Domain Language

Code must speak the language of the product. Names in hooks, types, and functions must be understandable without knowing the implementation details.

```typescript
// ❌ Technical language
const { data } = useGetMediaItemHttpRequest({ id })

// ✅ Domain language
const { data: episode } = useEpisodeDetail(episodeId)
if (canResumePlayback(episode)) { ... }
```

---

## 3. Shared Libraries

### `@seerial/domain`

The core of the shared logic. Contains:

- **TypeScript domain types** — `Movie`, `Series`, `Episode`, `Library`, etc.
- **Mappers** — functions that translate raw API responses into domain types.
- **Domain functions** — pure functions that express business rules.

```typescript
// libs/domain/src/episode.ts
export interface Episode { ... }
export function toEpisode(raw: ApiEpisode): Episode { ... }
export const canResumePlayback = (ep: Episode): boolean => ep.progress > 0
export const isWatched = (ep: Episode): boolean => ep.progress >= 0.9
```

This library has **zero dependencies** on React, TanStack Query, or any framework. It is pure TypeScript consumed by both frontend clients and potentially the server.

### `@seerial/api`

Contains all TanStack Query hooks. It is the single source of truth for server state.

```typescript
// libs/api/src/hooks/use-episode-detail.ts
import { useQuery } from "@tanstack/react-query";
import { toEpisode } from "@seerial/domain";

export function useEpisodeDetail(id: string) {
  return useQuery({
    queryKey: ["episode", id],
    queryFn: () => apiClient.get(`/episodes/${id}`).then(toEpisode),
  });
}
```

Rules:

- Every hook returns a domain type from `@seerial/domain`, never a raw API shape.
- The `apiClient` (Axios instance with interceptors) lives in `libs/api/src/client.ts`.
- Query keys follow the pattern `['resource', id?, filters?]`.

---

## 4. State Management Strategy

No single tool manages all state. The decision tree:

| State type                         | Tool                  | Location               |
| ---------------------------------- | --------------------- | ---------------------- |
| Server data (API)                  | TanStack Query        | `libs/api/`            |
| Domain types & rules               | Pure TypeScript       | `libs/domain/`         |
| Global context                     | Zustand               | `libs/stores/`         |
| Form state                         | React Hook Form + Zod | Inside the component   |
| Complex flows (wizard, multi-step) | Zustand               | `features/[f]/stores/` |
| Filters & pagination               | URL (`searchParams`)  | Browser navigation bar |
| Simple shared UI state             | React Context         | Inside the feature     |

**Rule:** Never copy TanStack Query data into a Zustand store. Two copies of the same truth create inconsistencies.

---

## 5. Client Application Roles

| App                | Role           | Manages content? | Player                              |
| ------------------ | -------------- | ---------------- | ----------------------------------- |
| `@seerial/web`     | Web CMS        | ✅ Yes           | HTML native (`<video>`, `<audio>`)  |
| `@seerial/desktop` | Desktop player | ❌ No            | MPV via Tauri                       |

> Each client has its own dedicated architecture document:
>
> - [WEB_ARCHITECTURE.md](./WEB_ARCHITECTURE.md)
> - [DESKTOP_ARCHITECTURE.md](./DESKTOP_ARCHITECTURE.md)

---

## 6. Quality Shield

See [QUALITY.md](./QUALITY.md) for the full quality strategy. Summary:

- **Biome** — linting, formatting, and import organization (single binary, no conflicts).
- **Dependency Cruiser** — validates that architectural rules (no cross-feature imports, no circular dependencies) are respected on every commit.
- **Turbo** — orchestrates tasks across the monorepo with remote cache, running only what changed.

---

## 7. Key Architectural Rules (Quick Reference)

1. **All code in English** — types, variables, comments, and documentation.
2. **All files in `kebab-case`** — consistent across all packages.
3. **No `any`** — use `unknown` when the type is genuinely unknown, then narrow.
4. **No cross-feature imports** — enforced by Dependency Cruiser.
5. **No direct fetch in components** — always go through `@seerial/api` hooks.
6. **Filters and pagination in the URL** — shareable, bookmarkable, back-button compatible.
7. **Business rules in `@seerial/domain`** — not in components.
8. **Form validation with Zod** — combined with React Hook Form.
9. **Early returns** — validate error and loading states at the top of render functions.
10. **`!!value && <Component />`** — never `value && <Component />` with numeric values.
