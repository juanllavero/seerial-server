# @seerial/domain & @seerial/api — Shared Libraries Architecture

**Date:** 2026 | **Status:** ✅ Defined

---

## `@seerial/domain`

The foundation layer. Pure TypeScript — no React, no TanStack Query, no runtime dependencies.

### Structure

```
libs/domain/
├── src/
│   ├── media-item.ts         # Base type for any playable item
│   ├── library.ts            # Library type, mapper, helpers
│   ├── series.ts             # Series, Season types
│   ├── episode.ts            # Episode type, mappers, domain functions
│   ├── movie.ts              # Movie type, mappers, domain functions
│   ├── playback-session.ts   # PlaybackSession, progress helpers
│   └── index.ts              # Public barrel
├── package.json
└── tsconfig.json
```

### File anatomy

Each domain file follows a consistent three-part structure:

```typescript
// libs/domain/src/episode.ts

// 1. Domain type — business language, not API shape
export interface Episode {
  id: string
  seriesId: string
  seasonNumber: number
  episodeNumber: number
  title: string
  durationSeconds: number
  progress: number            // 0–1, fraction watched
  videoUrl: string
}

// 2. Mapper — raw API response → domain type
export function toEpisode(raw: ApiEpisode): Episode {
  return {
    id: raw.id,
    seriesId: raw.series_id,
    seasonNumber: raw.season_number,
    episodeNumber: raw.episode_number,
    title: raw.title,
    durationSeconds: raw.duration,
    progress: raw.progress ?? 0,
    videoUrl: raw.stream_url,
  }
}

// 3. Domain functions — business rules as pure functions
export const isWatched = (ep: Episode): boolean => ep.progress >= 0.9
export const canResume = (ep: Episode): boolean =>
  ep.progress > 0 && !isWatched(ep)
export const resumePositionSeconds = (ep: Episode): number =>
  Math.floor(ep.progress * ep.durationSeconds)
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
│   ├── keys.ts               # Centralized query key factory
│   ├── hooks/
│   │   ├── use-libraries.ts
│   │   ├── use-series.ts
│   │   ├── use-episode-detail.ts
│   │   ├── use-movie-detail.ts
│   │   ├── use-playback-session.ts
│   │   └── use-report-progress.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### Query key factory

All query keys are defined centrally to enable precise cache invalidation:

```typescript
// libs/api/src/keys.ts
export const keys = {
  libraries: () => ['libraries'] as const,
  library: (id: string) => ['libraries', id] as const,
  series: (id: string) => ['series', id] as const,
  episode: (id: string) => ['episodes', id] as const,
  movie: (id: string) => ['movies', id] as const,
  session: (itemId: string) => ['session', itemId] as const,
}
```

### Hook anatomy

```typescript
// libs/api/src/hooks/use-episode-detail.ts
import { useQuery } from '@tanstack/react-query'
import { toEpisode, type Episode } from '@seerial/domain'
import { apiClient } from '../client'
import { keys } from '../keys'

export function useEpisodeDetail(id: string) {
  return useQuery<Episode>({
    queryKey: keys.episode(id),
    queryFn: () =>
      apiClient.get(`/episodes/${id}`).then(res => toEpisode(res.data)),
    enabled: !!id,
  })
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
// libs/api/src/hooks/use-report-progress.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { keys } from '../keys'

export function useReportProgress() {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: ({ itemId, progress }: { itemId: string; progress: number }) =>
      apiClient.post(`/progress/${itemId}`, { progress }),
    onSuccess: (_, { itemId }) => {
      qc.invalidateQueries({ queryKey: keys.session(itemId) })
    },
  })
}
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
apps/web, apps/desktop, apps/tv
```

`@seerial/ui-web` and `@seerial/ui-tv` depend only on `@seerial/domain` for types. They do not depend on `@seerial/api`.
