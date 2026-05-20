# Desktop Release & Auto-Update Implementation Plan

**Date:** 2026 | **Status:** ✅ Implemented — pending E2E validation (Step 9) and first release push

Goal: enable user testing for `@seerial/desktop` with a Windows installer, in-app auto-update detection/install, and automated CI/CD publishing on push to `main`.

---

## Legend

- ✅ Done
- 🔧 In Progress
- ⬜ Not Started

---

## Step 1 — Generate a signing key pair

Tauri updater requires a cryptographic signature. The private key signs the installer artifacts; the public key is stored in the app config to verify them.

Run this once locally and keep the private key safe:

```bash
cd apps/desktop
pnpm tauri signer generate -- -w ~/.tauri/seerial-desktop.key
```

This produces:
- `~/.tauri/seerial-desktop.key` — private key (never commit this)
- `~/.tauri/seerial-desktop.key.pub` — public key (safe to share)

**Secrets to add to GitHub repository:**

| Secret name | Value |
|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | full content of `.key` file |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | password if set during generation (empty string if not) |

### Status: ✅ Done
> Key generated at `~/.tauri/seerial-desktop.key` (no password).
> Public key: `dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEYwMDAwRUNBRjRGRUJBQjEKUldTeHV2NzB5ZzRBOEtvOC9XRXFWYWpLc2xjTGRNWmY4YWVzbFRJeU9LZWcrQ0RGTE5NbTR3U2UK`

---

## Step 2 — Activate updater plugin (Rust side)

### 2a — Add Rust dependency to `apps/desktop/src-tauri/Cargo.toml`

Add `tauri-plugin-updater` and `tauri-plugin-process` (needed for `relaunch` after install):

```toml
tauri-plugin-updater = "2"
tauri-plugin-process = "2"
```

### 2b — Register plugins in `apps/desktop/src-tauri/src/main.rs`

In `tauri::Builder::default()`, add:

```rust
.plugin(tauri_plugin_updater::Builder::new().build())
.plugin(tauri_plugin_process::init())
```

### Status: ✅ Done

---

## Step 3 — Configure updater in `apps/desktop/src-tauri/tauri.conf.json`

### 3a — Enable updater artifact creation in `bundle`

```json
"bundle": {
  "active": true,
  "createUpdaterArtifacts": true,
  "targets": "all",
  ...
}
```

### 3b — Add updater plugin configuration in `plugins`

```json
"plugins": {
  "updater": {
    "pubkey": "<CONTENT OF seerial-desktop.key.pub>",
    "endpoints": [
      "https://github.com/OWNER/REPO/releases/latest/download/latest.json"
    ],
    "windows": {
      "installMode": "passive"
    }
  },
  "store": {
    "dir": "app"
  }
}
```

> **IMPORTANT:** Replace `juanllavero/seerial` in the endpoint URL with the actual GitHub repository path before the first release push.

### Status: ✅ Done

---

## Step 4 — Add updater capabilities

In `apps/desktop/src-tauri/capabilities/default.json`, add updater and process permissions:

```json
{
  "permissions": [
    "core:default",
    "opener:default",
    "updater:default",
    "process:default"
  ]
}
```

### Status: ✅ Done

---

## Step 5 — Add updater JS/TS dependencies

In `apps/desktop/package.json`:

```json
"@tauri-apps/plugin-updater": "^2",
"@tauri-apps/plugin-process": "^2"
```

### Status: ✅ Done

---

## Step 6 — Implement update check UI (React side)

### 6a — Create `apps/desktop/src/features/updater/`

Following Feature-Sliced Design, create:

```
src/features/updater/
├── components/
│   └── update-dialog.tsx     # Radix AlertDialog: "New version found — Update now?"
├── hooks/
│   └── use-app-updater.ts    # Calls check(), exposes update state and install handler
└── index.ts                  # Public barrel
```

#### `use-app-updater.ts` logic:

```ts
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useState, useEffect } from 'react';

export function useAppUpdater() {
  const [update, setUpdate] = useState(null);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    check().then(setUpdate).catch(console.error);
  }, []);

  async function installUpdate() {
    if (!update) return;
    setInstalling(true);
    await update.downloadAndInstall();
    await relaunch();
  }

  return { update, installing, installUpdate };
}
```

#### `update-dialog.tsx` logic:

Uses `@radix-ui/react-alert-dialog` (already installed).

- Title: "New version available"
- Body: shows `update.version` and `update.body` (changelog notes)
- Primary action: "Update now" — calls `installUpdate()`
- Secondary action: "Later" — dismisses dialog
- While installing: shows loading state, disables buttons

### 6b — Integrate into app entry point

In `apps/desktop/src/main.tsx`, render `<UpdateDialog />` alongside `<GlobalMusicPlayer />`:

```tsx
import { UpdateDialog } from '@/features/updater';

// Inside <App />:
<BrowserRouter>
  <AppRoutes />
  <GlobalMusicPlayer />
  <UpdateDialog />
</BrowserRouter>
```

### Status: ✅ Done

---

## Step 7 — Bump version strategy

The updater only triggers if the published version is higher than the installed one.

**Recommended approach:**
- Version is defined in `apps/desktop/src-tauri/tauri.conf.json` (`"version"` field).
- Bump it manually before each release push to `main` (patch for fixes, minor for features).
- Future: can be automated with `release-please` or a custom script.

### Status: ✅ Done (manual — bump `version` in tauri.conf.json before each release push)

---

## Step 8 — GitHub Actions workflow for Windows release

Replace the obsolete Electron-based workflows with a Tauri-native workflow.

Create `.github/workflows/desktop-release.yml`:

```yaml
name: Desktop Release (Windows)

on:
  push:
    branches:
      - main
    paths:
      - 'apps/desktop/**'
      - 'libs/**'
      - '.github/workflows/desktop-release.yml'

permissions:
  contents: write

jobs:
  release-windows:
    runs-on: windows-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Get pnpm store
        id: pnpm-cache
        run: echo "dir=$(pnpm store path)" >> $env:GITHUB_OUTPUT

      - name: Cache pnpm
        uses: actions/cache@v4
        with:
          path: ${{ steps.pnpm-cache.outputs.dir }}
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: ${{ runner.os }}-pnpm-

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Cache Rust
        uses: swatinem/rust-cache@v2
        with:
          workspaces: apps/desktop/src-tauri

      - name: Install workspace dependencies
        run: pnpm install

      - name: Build and publish with Tauri Action
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          projectPath: apps/desktop
          tagName: desktop-v__VERSION__
          releaseName: 'Seerial Desktop v__VERSION__'
          releaseBody: 'See release notes below.'
          releaseDraft: false
          prerelease: false
          includeUpdaterJson: true
```

> `tauri-action` automatically:
> - builds the Windows installer (NSIS `.exe` and MSI `.msi`)
> - signs artifacts with the private key
> - creates a GitHub Release tagged `desktop-v{version}`
> - generates and uploads `latest.json` for the updater endpoint

### Status: ✅ Done — see `.github/workflows/desktop-release.yml`

---

## Step 9 — End-to-end validation

After all steps above are complete:

1. [ ] Install version N on a clean Windows machine.
2. [ ] Push version N+1 to `main` and wait for CI to complete.
3. [ ] Open the app on version N.
4. [ ] Confirm the update dialog appears showing N+1.
5. [ ] Click "Update now".
6. [ ] App closes, installs silently (passive mode), and reopens.
7. [ ] Confirm app now shows version N+1 in settings/about.

### Status: ⬜ Not Started

---

## Notes and Caveats

- **Private key backup:** if the private key is lost, existing installations cannot receive updates. Store it in a password manager or a secrets vault outside GitHub.
- **Windows SmartScreen:** without a code-signing certificate, Windows may show a SmartScreen warning on first install. Not a blocker for user testing, but worth noting.
- **Plugin version alignment:** this repo pins `tauri-plugin-store = "=2.2.0"` — when adding `tauri-plugin-updater`, use the latest v2 minor that is compatible with the current `tauri = "2"` version in Cargo.toml.
- **App close on install (Windows):** Tauri Windows installers automatically close the running app before installing the update. This is expected behavior; `relaunch()` handles reopening.
- **Existing obsolete workflows:** `.github/workflows/build.yml` and `.github/workflows/main.yml` are legacy Electron-based workflows. They can be deleted once the new `desktop-release.yml` is validated.
