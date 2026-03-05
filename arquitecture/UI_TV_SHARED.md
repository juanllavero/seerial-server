# TV + Desktop — Shared UI Design Contract

**Date:** 2026 | **Status:** ✅ Defined

## 1. Why a Design Contract Instead of Shared Components?

The Desktop client uses **React DOM** (`@seerial/ui-web`). The TV client uses **React Native** (`@seerial/ui-tv`). They cannot share component code directly. However, they share:

1. **Business logic** — via `@seerial/api` and `@seerial/domain` (100% shared).
2. **Feature logic** — the same hooks, stores, and state patterns (duplicated but structurally identical).
3. **Visual design contract** — the same layout rules, spacing scale, and component shapes defined here.

The result: a user switching between TV and Desktop sees the same interface. A developer working on one client can immediately understand the other.

---

## 2. What Is Shared at the Code Level

| Layer                                    | Shared?           | How                                  |
| ---------------------------------------- | ----------------- | ------------------------------------ |
| Domain types (`Episode`, `Series`, etc.) | ✅ 100%           | `@seerial/domain`                    |
| API hooks (`useEpisodeDetail`, etc.)     | ✅ 100%           | `@seerial/api`                       |
| Zustand store _shape_                    | ✅ Same structure | `@seerial/stores`                    |
| Feature _logic_ hooks                    | ✅ Same logic     | `@seerial/hooks`                     |
| UI components                            | ❌ Cannot share   | Different renderers                  |
| Navigation                               | ❌ Cannot share   | Norigin vs react-tv-space-navigation |

> **Strategy for feature hooks:** When a feature hook contains no platform-specific code (no DOM APIs, no RN APIs), it should be inside `@seerial/hooks`. If logic diverges, the hook should be inside the feature folder.

---

## 3. Design Tokens

Both clients use the same token values, expressed in their respective formats.

### Token definitions

| Token                    | Value       | Usage                     |
| ------------------------ | ----------- | ------------------------- |
| `--color-bg`             | `#0f0f0f`   | Screen background         |
| `--color-surface`        | `#1a1a1a`   | Card and panel background |
| `--color-accent`         | `#e5a00d`   | Focus ring, active state  |
| `--color-text-primary`   | `#ffffff`   | Titles, primary text      |
| `--color-text-secondary` | `#9ca3af`   | Subtitles, metadata       |
| `--spacing-xs`           | `4px / 4`   | Inner padding             |
| `--spacing-sm`           | `8px / 8`   | Gap between elements      |
| `--spacing-md`           | `16px / 16` | Standard gap              |
| `--spacing-lg`           | `32px / 32` | Section gap               |
| `--spacing-xl`           | `64px / 64` | Screen edge padding       |
| `--radius-card`          | `8px / 8`   | Card border radius        |
| `--radius-badge`         | `4px / 4`   | Badge border radius       |
| `font-size-title`        | `24px / 24` | Screen and section titles |
| `font-size-body`         | `16px / 16` | Descriptions, metadata    |
| `font-size-label`        | `12px / 12` | Badges, timestamps        |

Desktop (`styles/tokens.css`): CSS custom properties.  
TV (`styles/tokens.ts`): plain TypeScript object for use with React Native `StyleSheet`.

---

## 4. Component Shape Contract

Components are not shared, but their shape (props and visual structure) must match. When implementing a component for one client, implement its counterpart for the other with the same props.

### MediaCard

Displays a poster image with optional title, progress bar, and badge.

```typescript
// Props contract — same in both clients
interface MediaCardProps {
  title: string;
  posterUrl: string;
  progress?: number; // 0–1, shows progress bar when provided
  badge?: string; // "NEW", "4K", episode number, etc.
  isFocused: boolean; // controlled by spatial navigation
  onSelect: () => void;
}
```

Visual structure:

```
┌──────────────┐
│              │  ← poster image (2:3 ratio for movies/series)
│              │    (16:9 ratio for episodes)
│   [badge]    │  ← top-right corner
│══════════════│  ← progress bar (only if progress > 0)
│ Title        │  ← below poster, truncated at 2 lines
└──────────────┘
   ↑ focus ring when isFocused
```

### OSD (On-Screen Display)

Overlay rendered on top of the player. Appears on any remote/keyboard input, auto-hides after 4 seconds of inactivity.

```typescript
interface OsdProps {
  title: string;
  episodeLabel?: string; // "S01E03 · Episode Title"
  progress: number; // 0–1
  duration: number; // seconds
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeekForward: () => void; // +10s
  onSeekBackward: () => void; // -10s
}
```

Visual structure:

```
┌─────────────────────────────────────────────────┐
│  Title                          episodeLabel     │  ← top bar
│                                                  │
│                                                  │
│  ◀◀   ▶   ▶▶                                   │  ← controls
│  ████████████░░░░░░░  01:23 / 48:00             │  ← progress + time
└─────────────────────────────────────────────────┘
```

### FocusableRow / FocusableGrid

Layout containers that manage spatial navigation. Both clients implement these with the same semantic behavior but different underlying libraries.

| Behavior                   | Desktop (Norigin)                   | TV (react-tv-space-navigation) |
| -------------------------- | ----------------------------------- | ------------------------------ |
| Focus moves left/right     | `SpatialNavigation.focusLeft/Right` | D-pad left/right event         |
| Focus moves up/down (grid) | `SpatialNavigation.focusUp/Down`    | D-pad up/down event            |
| Focus ring on focused item | `isFocused` prop → CSS ring         | `isFocused` prop → RN style    |
| On select                  | `onEnterPress` callback             | `onSelect` callback            |

---

## 5. Screen Layout Contract

Both clients implement the same four screen layouts:

### Home Screen

```
[Sidebar/Menu]  [Featured Hero (full-width banner)]
                [Continue Watching — horizontal row]
                [Recently Added — horizontal row]
                [By Library — horizontal rows]
```

### Library Screen

```
[Sidebar/Menu]  [Library Title + Filter bar]
                [Media Grid (n columns depending on screen width/TV resolution)]
```

### Detail Screen

```
[Background: blurred backdrop]
[Poster]  [Title]
          [Metadata: year, duration, genre]
          [Description]
          [▶ Play]  [Resume from HH:MM]
          [Episodes list (if series)]
```

### Player Screen

```
[Native video / MPV — fills entire screen]
[OSD overlay — conditionally visible]
```

---

## 6. Implementing a New Feature: Checklist

When adding a new feature that must appear on both clients:

- [ ] Add domain types and business functions to `@seerial/domain`
- [ ] Add TanStack Query hooks to `@seerial/api`
- [ ] Implement the feature in Desktop (`apps/desktop/src/features/[name]/`)
- [ ] Implement the feature in TV (`apps/tv/src/features/[name]/`)
- [ ] Implement `MediaCard`-compatible components in both clients
- [ ] Verify the token values match between `tokens.css` and `tokens.ts`
- [ ] Verify focus/navigation behavior is equivalent on both platforms
