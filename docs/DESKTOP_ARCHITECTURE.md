# @seerial/desktop — Desktop Client Architecture

**Date:** 2026 | **Status:** ✅ Defined  
**Role:** Desktop HTPC Client (no content management)  
**Stack:** Tauri + React (Vite, webview) + Zustand  
**UI paradigm:** 10-foot interface inspired by Plex HTPC, keyboard/gamepad navigable

---

## 1. Responsibilities

The desktop client is a **data visualization and media playback** application. It does not manage the content — that is done through the web client. The UI is designed for a 10-foot viewing experience and is inspired in TV apps. Navigation is handled by keyboard and gamepad via **Norigin Spatial Navigation**.

The video player is **MPV**, embedded in the Tauri window via a native plugin. The React webview only renders the UI shell; it does not render the video itself.

---

## 2. Architecture Split: Tauri vs React

```
@seerial/desktop
├── src-tauri/            # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── mpv.rs        # MPV integration: spawn, control, events
│   │   └── commands.rs   # Tauri commands exposed to the webview
│   └── tauri.conf.json
│
└── src/                  # React UI (webview)
    └── (see section 3)
```

### Communication pattern (Tauri IPC)

The React UI never controls MPV directly. It communicates via Tauri commands:

```
React UI  →  invoke('mpv_play', { url, position })  →  Rust (mpv.rs)
React UI  ←  listen('mpv_progress', handler)         ←  Rust (mpv.rs)
```

A dedicated hook abstracts this:

```typescript
// features/player/hooks/useMpvPlayer.ts
import { invoke, listen } from '@tauri-apps/api'

export function useMpvPlayer() {
  const play = (url: string, position?: number) =>
    invoke('mpv_play', { url, position })

  const seek = (seconds: number) => invoke('mpv_seek', { seconds })

  // ... returns play, pause, seek, stop
}
```

Business rules (can this item be played? what is the resume position?) remain in `@seerial/domain`. The hook only bridges React to Tauri IPC.

---

## 3. React Source Structure

```
src/
├── app/
│   ├── router.tsx            # React Router route definitions
│   ├── providers.tsx         # QueryClient, SpatialNavigation init, etc.
│   └── App.tsx
│
├── shared/
│   ├── ui/                   # Local compositions on top of @seerial/ui-web
│   ├── layout/               # AppShell, FocusableRow, FocusableGrid
│   └── navigation/           # Norigin Spatial Navigation setup and helpers
│
├── features/
│   ├── home/                 # Featured content, continue watching, recently added
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   ├── library/              # Browse libraries and media grids
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/           # Filter and focus state
│   │   └── index.ts
│   ├── detail/               # Movie / series / episode detail screen
│   │   ├── components/
│   │   ├── hooks/
│   │   └── index.ts
│   └── player/               # MPV player controls overlay
│       ├── components/       # OSD: progress bar, volume, title
│       ├── hooks/            # useMpvPlayer, usePlayerOsd
│       ├── stores/           # usePlayerStore (queue, resume position)
│       └── index.ts
│
└── styles/
    └── tokens.css
```

---

## 4. Navigation — Norigin Spatial Navigation

The entire UI is navigable with keyboard arrow keys and gamepad D-pad. Norigin Spatial Navigation manages focus between focusable nodes.

Setup lives in `shared/navigation/`:
- `SpatialNavProvider.tsx` — wraps the app and initializes the library.
- `useFocusable.ts` — re-exported hook for focusable components.
- `FocusableRow.tsx` and `FocusableGrid.tsx` — layout wrappers used by feature components.

**Rule:** Every interactive element (cards, buttons, menu items) must be wrapped in a focusable container. Mouse interaction is supported but not the primary paradigm.

---

## 5. Routing

Routes are simple and linear — no deep CMS structure:

```
/                   → /home
/home               → Home screen (continue watching, recent)
/library/:id        → Library grid
/detail/:type/:id   → Detail screen (movie, series, episode)
/player             → Fullscreen player (MPV overlay)
/settings           → Settings
```

On `/player`, React renders only the OSD (on-screen display) overlay. MPV renders the video in the native window layer beneath the webview.

---

## 6. State Management

| State type | Tool | Location |
|---|---|---|
| Server data | TanStack Query (`@seerial/api`) | `libs/api/` |
| Player state (queue, OSD visibility, progress) | Zustand | `features/player/stores/usePlayerStore.ts` |
| Navigation focus state | Norigin Spatial Navigation (internal) | `shared/navigation/` |
| Active filters | URL (`searchParams`) | React Router |

---

## 8. Shared Libraries Consumed

| Library  |  Usage |
|---|---|
| `@seerial/api`    | All TanStack Query hooks            |
| `@seerial/domain` | Domain types and business functions |
| `@seerial/stores` | Global context in Zustand           |
| `@seerial/hooks`  | Global React hooks                  |
