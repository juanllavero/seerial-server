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
│   │   ├── main.tsx              # Application root and top-level providers
│   │   └── routes/
│   │       ├── routes.tsx        # React Router route definitions
│   │       └── root.tsx          # Auth guard + root layout wrapper
│   │
│   ├── pages/                    # Thin route-level components and route wrappers
│   │   ├── home/
│   │   │   └── home-page.tsx
│   │   ├── library/
│   │   │   └── library-page.tsx
│   │   ├── details/
│   │   │   ├── movie/
│   │   │   │   └── movie-details-page.tsx
│   │   │   ├── series/
│   │   │   │   └── series-details-page.tsx
│   │   │   ├── album/
│   │   │   │   └── album-details-page.tsx
│   │   │   ├── episode/
│   │   │   │   └── episode-details-page.tsx
│   │   │   └── collection/
│   │   │       └── collection-details-page.tsx
│   │   ├── video-player/
│   │   │   └── video-player-page.tsx
│   │   ├── settings/
│   │   │   └── settings-page.tsx
│   │   ├── login/
│   │   │   └── login-page.tsx
│   │   ├── link/
│   │   │   └── link-page.tsx
│   │   └── sidebar-layout/
│   │       └── sidebar-layout.tsx
│   │
│   ├── features/
│   │   ├── auth/                 # Login, server selection, user selection
│   │   ├── home/                 # Home sections and empty states
│   │   ├── library/              # Browse libraries, grids, cards
│   │   ├── media-details/        # Shared detail UI for movie/series/album/episode/collection
│   │   ├── management/           # CMS dialogs and editing workflows
│   │   ├── player/               # Video player + persistent music player
│   │   ├── settings/             # Settings panels and settings store
│   │   └── shell/                # Sidebar, navigation, shell widgets
│   │
│   ├── shared/
│   │   ├── ui/                   # Shadcn/ui and generic UI wrappers
│   │   ├── forms/                # Reusable form building blocks
│   │   ├── cards/                # Shared card primitives
│   │   ├── lists/                # Shared list and sortable primitives
│   │   ├── hooks/                # App-wide hooks
│   │   ├── layout/               # Base layout and visual shell infrastructure
│   │   ├── localization/         # i18n setup, languages and helpers
│   │   ├── lib/                  # Shared utilities and helpers
│   │   ├── data/                 # Shared enums and static data
│   │   ├── types/                # App-local shared types
│   │   └── context/              # Cross-app React context providers
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

React Router lives in `src/app/routes/`. `routes.tsx` owns the lazy route tree and `root.tsx` applies the auth guard and base layout.

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
/collection/:collectionId/:type                  → CollectionDetailsPage
/video-player/:videoId                           → VideoPlayerPage
```

The root route wrapper is responsible for:

- Redirecting unauthenticated users to `/login`
- Allowing `/login` and `/link` as public routes
- Redirecting to `/home` when the selected server is offline and the route is not allowed
- Mounting `shared/layout/base-layout.tsx` around authenticated content

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
// pages/library/library-page.tsx
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

Current feature set in the web app:

- `auth` for login and link flows
- `home` for home content sections and empty states
- `library` for browse grids and media cards
- `media-details` for reusable detail components across all media types
- `management` for dialog-driven CMS workflows
- `player` for both video playback and the persistent music player
- `settings` for settings panels and settings state
- `shell` for sidebar navigation and shell-only controls

### Import rules

```
pages/      → may import from features/, shared/, @seerial/*
features/   → may import from shared/, @seerial/*
features/   → must NOT import from pages/
shared/     → must NOT import from features/ or pages/
```

Cross-feature imports should be exceptional. When they are unavoidable for coordination concerns, they must go through the target feature's `index.ts` public API and never through internal files.

If two features need to share reusable UI or logic, it belongs in `shared/` or in the relevant `@seerial/*` library.

---

## 5. State Management

| State type | Tool | Location |
|---|---|---|
| Server data (libraries, series, episodes) | TanStack Query (`@seerial/api`) | `libs/api/` |
| Dialog orchestration for CMS actions | Zustand | `features/management/stores/dialog-store.ts` |
| Settings UI and persisted client/server settings | Zustand | `features/settings/stores/settings-store.ts` |
| Active library filters & pagination | URL (`searchParams`) | React Router |
| Form state (metadata editing) | React Hook Form + Zod | Inside the component |
| Global shell state (sidebar, playback, selected background) | Zustand in shared libs | `@seerial/stores` |
| Layout-only composition and providers | React components | `app/main.tsx`, `app/routes/root.tsx`, `shared/layout/base-layout.tsx` |

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

The feature currently centralizes dialog-driven workflows in `features/management/components/dialogs/` and exposes the dialog store through its barrel so pages and other features can trigger management actions without importing internal files directly.

Management actions are currently exposed through dialogs and contextual actions across content pages, rather than a dedicated `/management/*` route group.

---

## 8. Shared Libraries Consumed

| Library | Usage |
|---|---|
| `@seerial/api` | All TanStack Query hooks |
| `@seerial/domain` | Domain types and business functions |
| `@seerial/stores` | Global context in Zustand |
| `@seerial/hooks` | Global React hooks |