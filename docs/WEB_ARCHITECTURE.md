# @seerial/web — Web Client Architecture

**Date:** 2026 | **Status:** ✅ Defined  
**Role:** CMS — content management and playback via browser  
**Stack:** React + Vite + React Router + Zustand

---

## 1. Responsibilities

The web client is the **only client that can manage content** (add libraries, edit metadata). It also allows playback using the browser's native `<video>` and `<audio>` elements. It is always served alongside the server and is not designed to run independently.

---

## 2. Directory Structure

```
apps/web/
│
├── src/
│   ├── app/
│   │   ├── router.tsx            # React Router route definitions
│   │   ├── providers.tsx         # Root providers (QueryClient, Router, etc.)
│   │   └── main.tsx               # Application root
│   │
│   ├── pages/                    # Thin route-level components — no business logic
│   │   ├── home/
│   │   │   └── home-page.tsx
│   │   ├── library/
│   │   │   └── library-page.tsx
│   │   ├── details/
│   │   │   ├── movie-details-page.tsx
│   │   │   ├── series-details-page.tsx
│   │   │   ├── album-details-page.tsx
│   │   │   └── episode-details-page.tsx
│   │   ├── collection/
│   │   │   └── collection-page.tsx
│   │   ├── player/
│   │   │   └── video-player-page.tsx
│   │   ├── settings/
│   │   │   └── settings-page.tsx
│   │   └── auth/
│   │       ├── login/
│   │       │   └── login-page.tsx
│   │       └── qr-link/
│   │           └── link-page.tsx
│   │
│   ├── features/
│   │   ├── library/              # Browse libraries, grids, filters
│   │   │   ├── components/       # Sections and presentational components
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── index.ts
│   │   ├── series/               # Series detail, seasons, episodes
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── player/               # Native HTML player wrapper + controls
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/           # usePlayerStore (current track, progress, queue)
│   │   │   └── index.ts
│   │   ├── management/           # CMS features: add library, scan, edit metadata
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── settings/             # User and server settings
│   │       ├── components/
│   │       ├── hooks/
│   │       └── index.ts
│   │
│   ├── shared/
│   │   ├── ui/                   # Shadcn/ui and custom components
│   │   ├── layout/               # SidebarLayout
│   │   └── hooks/                # App-wide hooks (useCardWidth)
│   │
│   └── styles/
│       ├── animations.css        # CSS animations
│       ├── utils.css             # CSS utils
│       └── global.css            # CSS global styles and tailwind import
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── biome.json
```

---

## 3. Routing

React Router is defined in `src/app/router.tsx`. Routes are lazy-loaded by default and each one maps directly to a page component in `src/pages/`.

```
/                       → redirect to /home
/login                  → LoginPage
/link                   → LinkPage
/home                   → HomePage
/settings               → SettingsPage
/library/:libraryId                              → LibraryPage
/library/:libraryId/movie/:movieId               → MovieDetailsPage
/library/:libraryId/series/:seriesId             → SeriesDetailsPage
/library/:libraryId/album/:albumId               → AlbumDetailsPage
/library/:libraryId/episode/:episodeId           → EpisodeDetailsPage
/collection/:collectionId/:type                  → CollectionPage
/video-player/:videoId                           → VideoPlayerPage
```

---

## 4. Pages vs Features

### Pages (`src/pages/`)

Pages are **thin orchestrators**. Their only responsibilities are:

- Reading route params and search params
- Calling hooks from features or `@seerial/api` to fetch data
- Composing feature components into a layout
- Passing data down as props

Pages contain **no business logic, no stores, and no local state** beyond what React Router provides.

```tsx
// pages/library/LibraryPage.tsx
export default function LibraryPage() {
  const { libraryId } = useParams()
  const { data } = useLibrary(libraryId)

  return <LibraryView library={data} />  // component from features/library
}
```

### Features (`src/features/`)

Features own the **business logic, state, and UI sections** for a given domain. Each feature exposes its public API exclusively through its `index.ts` barrel — no other file may be imported from outside the feature.

```
features/[name]/
├── components/   # Sections and presentational components (no page-level wrappers)
├── hooks/        # Feature-local hooks (useLibraryFilters, usePlayerControls)
├── stores/       # Zustand stores for complex local UI state (wizard steps, player queue)
└── index.ts      # Public barrel — the ONLY file other modules may import from
```

### Import rules

```
pages/      → may import from features/, shared/, @seerial/*
features/   → may import from shared/, @seerial/*
features/   → must NOT import from pages/ or other features/
shared/     → must NOT import from features/ or pages/
```

If two features need to share logic, it belongs in `shared/` or in the relevant `@seerial/*` library.

---

## 5. State Management

| State type | Tool | Location |
|---|---|---|
| Server data (libraries, series, episodes) | TanStack Query (`@seerial/api`) | `libs/api/` |
| Player state (queue, progress, current item) | Zustand | `features/player/stores/usePlayerStore.ts` |
| Active library filters & pagination | URL (`searchParams`) | React Router |
| Form state (metadata editing) | React Hook Form + Zod | Inside the component |
| Global UI (sidebar open, background image/gradient) | React Context | `app/providers.tsx` |

---

## 6. Player

The web player wraps the native `<video>` and `<audio>` HTML elements. External libraries for custom controls are avoided to keep the bundle lean and maintain full browser compatibility.

The `usePlayerStore` (Zustand) holds:
- Current media item and queue
- Playback progress (synced to server on pause/end)
- Volume and playback rate

Progress is reported to the server via a mutation hook from `@seerial/api` (`useReportProgress`).

---

## 7. CMS Features (`features/management`)

This feature is exclusive to the web client. It includes:
- Library creation and configuration
- Media folder scanning
- Metadata editing
- User management

Management actions are currently exposed through dialogs and contextual actions across content pages, rather than a dedicated `/management/*` route group.

---

## 8. Shared Libraries Consumed

| Library | Usage |
|---|---|
| `@seerial/api` | All TanStack Query hooks |
| `@seerial/domain` | Domain types and business functions |
| `@seerial/stores` | Global context in Zustand |
| `@seerial/hooks` | Global React hooks |