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
│   │   └── App.tsx               # Application root
│   │
│   ├── shared/
│   │   ├── ui/                   # Local UI overrides / compositions built on @seerial/ui-web
│   │   ├── layout/               # AppShell, Sidebar, Topbar
│   │   └── hooks/                # App-wide hooks (useMediaQuery, useKeyboard, etc.)
│   │
│   ├── features/
│   │   ├── library/              # Browse libraries, grids, filters
│   │   │   ├── components/
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
│   └── styles/
│       └── tokens.css            # CSS custom properties (colors, spacing, typography)
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── biome.json
```

---

## 3. Routing

React Router v6 with file-based route organization inside `app/router.tsx`. Routes are lazy-loaded by default.

```
/                       → redirect to /home
/home                   → Library overview
/library/:id            → Library content grid
/library/:id/series/:id → Series detail
/library/:id/movies/:id → Movie detail
/player/:type/:id       → Fullscreen player
/management             → CMS dashboard (add library, scan, etc.)
/settings               → Settings
```

Each route corresponds to a page component inside its feature folder:

```
features/library/components/LibraryPage.tsx
features/series/components/SeriesDetailPage.tsx
features/player/components/PlayerPage.tsx
```

Pages are thin orchestrators: they call hooks from `@seerial/api`, pass data to presentational components, and do not contain business logic.

---

## 4. Feature Structure Detail

Each feature follows the same internal structure:

```
features/[name]/
├── components/         # UI: pages, sections, and presentational components
├── hooks/              # Feature-local hooks (useLibraryFilters, usePlayerControls)
├── stores/             # Zustand stores for complex local UI state (wizard steps, player queue)
└── index.ts            # Public barrel — the ONLY file other modules may import from
```

**Import rule:** `features/library` may never import from `features/player` directly. If shared logic is needed, it belongs in `shared/` or `libs/`.

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

Management pages are separated into their own route group (`/management/*`) and lazy-loaded to keep the initial bundle small for users who only want to browse and play.

---

## 8. Shared Libraries Consumed

| Library | Usage |
|---|---|
| `@seerial/api` | All TanStack Query hooks |
| `@seerial/domain` | Domain types and business functions |
| `@seerial/stores` | Global context in Zustand |
| `@seerial/hooks` | Global React hooks |
