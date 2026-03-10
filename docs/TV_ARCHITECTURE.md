# @seerial/tv — TV Client Architecture

**Date:** 2026 | **Status:** ✅ Defined  
**Role:** TV media player (no content management)  
**Stack:** React Native (Expo) + TanStack Query + Zustand  
**Target platforms:** AndroidTV (primary), FireTV, AppleTV

---

## 1. Responsibilities

The TV client is a **playback-only** application optimized for a 10-foot interface on TV devices. Navigation is D-pad only, handled by **react-tv-space-navigation**. The video player is the native device player provided by React Native.

---

## 2. Directory Structure

```
apps/tv/
│
├── src/
│   ├── app/
│   │   ├── navigation/           # React Navigation stack definitions
│   │   ├── providers.tsx         # QueryClient, SpatialNav init
│   │   └── App.tsx
│   │
│   ├── shared/
│   │   ├── ui/                   # Local compositions on top of @seerial/ui-tv
│   │   ├── layout/               # FocusableRow, FocusableGrid, AppShell
│   │   └── navigation/           # react-tv-space-navigation setup and helpers
│   │
│   ├── features/
│   │   ├── home/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   ├── library/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── stores/
│   │   │   └── index.ts
│   │   ├── detail/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.ts
│   │   └── player/
│   │       ├── components/       # OSD overlay (progress, title, controls)
│   │       ├── hooks/            # useNativePlayer, usePlayerOsd
│   │       ├── stores/           # usePlayerStore
│   │       └── index.ts
│   │
│   └── styles/
│       └── tokens.ts             # Design tokens as JS (React Native has no CSS vars)
│
├── app.json
├── expo-plugins/
├── tsconfig.json
└── biome.json
```

---

## 3. Navigation — React Navigation + react-tv-space-navigation

React Navigation manages screen transitions (stack navigator). Inside each screen, **react-tv-space-navigation** manages D-pad focus between UI elements.

Setup lives in `shared/navigation/`:
- `SpatialNavProvider.tsx` — wraps the app, initializes the library.
- `useFocusable.ts` — wrapper hook for focusable components.
- `FocusableRow.tsx` / `FocusableGrid.tsx` — reusable focus-managed layout containers.

```
React Navigation (screens)
  └── react-tv-space-navigation (focus within each screen)
```

**Rule:** Every tappable/selectable element — cards, buttons, menu items — must be inside a focusable container. Remote control is the primary input; touch is not supported.

---

## 4. Screen Map

```
Home          → Featured + Continue Watching + Recently Added
Library       → Grid of media items (movies or series)
Detail        → Movie/Series/Episode detail with metadata
Player        → Fullscreen native player + OSD overlay
Settings      → Server URL, preferences
```

All screens follow the same pattern: call a hook from `@seerial/api`, pass data to presentational components, no business logic in the screen file.

---

## 5. Player

The native player is invoked via the platform's built-in video playback capabilities (ExoPlayer on Android, AVPlayer on Apple). The React Native layer renders only the **OSD overlay**.

```typescript
// features/player/hooks/useNativePlayer.ts
import Video from 'react-native-video'

// Wraps react-native-video and exposes domain-friendly controls:
// play(episode), pause(), seek(seconds), stop()
// Reports progress to server via @seerial/api useReportProgress hook
```

Progress is synced to the server on pause and on playback end.

---

## 6. State Management

| State type | Tool | Location |
|---|---|---|
| Server data | TanStack Query (`@seerial/api`) | `libs/api/` |
| Player state (queue, OSD, progress) | Zustand | `features/player/stores/usePlayerStore.ts` |
| Focus state | react-tv-space-navigation (internal) | `shared/navigation/` |
| Active screen filters | React Navigation params | Navigator state |

URL `searchParams` are not applicable in React Native. Filters and pagination state are passed as navigation params or held in Zustand stores for this client only.

---

## 7. Design Contract with Desktop Client

See [UI_TV_SHARED.md](./UI_TV_SHARED.md) for the shared design contract between the TV and Desktop interfaces.

---

## 8. Platform-Specific Notes

### AndroidTV (primary target)
- D-pad navigation is the default. Test all flows with keyboard only.
- Back button maps to `React Navigation goBack()`.
- Deeplinks from Android launcher are handled in `app/navigation/`.

### FireTV
- Behaviorally identical to AndroidTV. No special handling needed beyond testing.

### AppleTV
- Siri Remote gesture (swipe) maps to D-pad events via react-tv-space-navigation's Apple TV adapter.
- Menu button maps to `goBack()`.

---

## 9. Shared Libraries Consumed

| Library | Usage |
|---|---|
| `@seerial/api` | All TanStack Query hooks |
| `@seerial/domain` | Domain types and business functions |
| `@seerial/ui-tv` | Base UI atoms (cards, badges, overlays) |
| `@seerial/config` | TypeScript configuration |
