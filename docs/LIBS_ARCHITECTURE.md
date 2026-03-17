# @seerial/domain & @seerial/api — Shared Libraries Architecture

**Date:** 2026 | **Status:** ✅ Defined

---

## `@seerial/domain`

The foundation layer. Pure TypeScript — no React, no TanStack Query, no runtime dependencies.

### Structure

```
libs/domain/
├── index.ts                 # Package entrypoint (re-exports src/index.ts)
├── src/
│   ├── enums/
│   │   └── index.ts
│   ├── interfaces/
│   │   ├── domain-media.ts
│   │   ├── domain-server.ts
│   │   ├── domain-user.ts
│   │   ├── media-core.ts
│   │   ├── media-info.ts
│   │   ├── media-search.ts
│   │   ├── server-discovery.ts
│   │   └── utils.ts
│   ├── mappers/
│   │   └── user.ts
│   └── index.ts              # Public barrel
├── package.json
└── biome.json
```

### Module anatomy

Domain modules are organized by responsibility:

```typescript
// libs/domain/src/interfaces/domain-user.ts
export interface BasicUser {
  id: string
  username: string
  type: 'admin' | 'user'
}

// libs/domain/src/mappers/user.ts
export function mapUserApiToDomain(raw: unknown): BasicUser {
  // Mapping implementation kept in domain to isolate API shape
  // and expose stable domain contracts.
  return raw as BasicUser
}
```

### Dependency rule

`@seerial/domain` has **zero npm dependencies** beyond TypeScript itself. It may import `@seerial/server` types if a shared-types package is used, but never React or any frontend library.

---

## `@seerial/api`

All TanStack Query hooks. The single source of truth for server state across all three clients.

### Structure

```
libs/api/
├── src/
│   ├── client.ts             # Axios instance with base URL + interceptors
│   ├── endpoints.ts          # API endpoints registered to use in hooks
│   ├── query-client.ts       # Shared TanStack Query client singleton
│   ├── hooks/
│   │   ├── common.ts         # Shared hook primitives and option/result types
│   │   ├── index.ts          # Hook layer barrel
│   │   ├── use-crud.ts
│   │   ├── use-libraries.ts
│   │   ├── use-movies.ts
│   │   ├── use-music.ts
│   │   ├── use-series.ts
│   │   ├── use-system.ts
│   │   ├── use-users.ts
│   │   └── use-videos.ts
│   └── index.ts
├── package.json
└── biome.json
```

### Query key strategy

Query keys are composed in each hook module with a stable `['resource', 'action', ...params]` shape. For shared cache operations outside React components, `query-client.ts` exports a singleton used across packages.

```typescript
// libs/api/src/hooks/use-libraries.ts
useApiQuery(['libraries', 'getAll'], API.libraries.getAll, options)
```

### Hook anatomy

```typescript
// libs/api/src/hooks/use-movies.ts
import type { ApiQueryResult, QueryHookOptions } from './common'
import { API } from '../endpoints'
import { useApiQuery } from './common'

export const useGetMovie = <TResponse = unknown>(
  movieId: string,
  options?: QueryHookOptions<TResponse>,
): ApiQueryResult<TResponse> =>
  useApiQuery<TResponse>(['movies', 'get', movieId], API.movies.get(movieId), options)
}
```

### API client

```typescript
// libs/api/src/client.ts
import axios from 'axios'

export const apiClient = axios.create({
  // Base URL is set at runtime from app settings (server URL configured by user)
  baseURL: getServerUrl(),
  timeout: 10_000,
})

// Response interceptor: unwrap data, normalize errors
apiClient.interceptors.response.use(
  res => res,
  err => Promise.reject(normalizeError(err)),
)
```

The server URL comes from user settings (stored locally on each client) and is injected at app initialization, not hardcoded.

### Mutation hooks

Mutations follow the same pattern. Progress reporting example:

```typescript
// libs/api/src/hooks/use-videos.ts
import type { MutationHookOptions } from './common'
import { API } from '../endpoints'
import { asBody, useApiMutation } from './common'

export const useUpdateVideo = <TResponse = unknown, TBody = unknown>(
  videoId: string,
  options?: MutationHookOptions<TResponse, TBody>,
) =>
  useApiMutation<TResponse, TBody>(
    ['videos', 'update', videoId],
    API.videos.update(videoId),
    'PUT',
    asBody,
    options,
  )
```

---

## Dependency Graph

```
@seerial/server (types only, optional)
        ↓
@seerial/domain   ←────── consumed by all clients directly
        ↓
@seerial/api      ←────── consumed by all clients directly
        ↓
apps/web, apps/desktop
```