# Dual Server Mode Plan

## Goal

Support two runtime modes from the same codebase:

1. Desktop mode for Windows, macOS, and Linux, using Electron plus the local admin page.
2. NAS mode for FreeNAS and similar systems, using a plain Node.js server without Electron, where the admin UI is accessed from a separate web client on the local network.

The objective is to keep the current behavior working while adding the NAS path with the smallest possible refactor.

## Short Answer

Yes, this is feasible without a large rewrite if the startup flow is split into a shared server core and runtime-specific wrappers.

The main reason it is currently coupled is that `apps/server/src/index.ts` mixes these concerns in one bootstrap:

- Electron lifecycle and single-instance lock
- HTTP/HTTPS server startup
- static web client serving
- tray creation
- WebSocket initialization
- shared backend initialization

That is the part that should be separated first.

## Recommended Approach

### 1. Extract a runtime-agnostic server core

Create a module that only builds and configures the Express app and the backend services, without importing Electron directly.

This core should own:

- middleware registration
- database initialization
- filesystem setup
- config loading
- TSOA route registration
- Swagger exposure rules
- API and streaming routes
- error handling
- WebSocket binding to an already created HTTP server

### 2. Add two entrypoints

Keep the current Electron mode intact and add a second Node-only entrypoint.

Suggested shape:

- `electron` entrypoint: current desktop behavior, tray, app lifecycle, embedded web client, single-instance lock.
- `node` entrypoint: pure server process, no Electron imports, no tray, no `app.whenReady()`, no local embedded UI.

### 3. Make the web client runtime-aware

For NAS mode, the UI should not be served from the server bundle as the primary access path.

Instead:

- the web app points to the NAS server API by configurable base URL
- the NAS server exposes the REST API and media endpoints only
- the desktop mode continues serving the embedded local web app as it does now

### 4. Keep business logic unchanged

Avoid moving domain, use cases, repositories, or route definitions unless strictly necessary.

The first iteration should only change startup, deployment, and client configuration.

## Suggested File-Level Refactor

This is the minimum structural split I would expect:

- `apps/server/src/bootstrap/` for shared app initialization
- `apps/server/src/runtimes/electron/` for Electron-specific startup
- `apps/server/src/runtimes/node/` for NAS-specific startup

Possible responsibilities:

- shared bootstrap: build Express app and register middleware/routes
- electron runtime: tray, local UI serving, Electron app lifecycle
- node runtime: listen on configured host/port and expose API to the LAN

## Phased Planning

### Phase 1. Identify the shared startup boundary

Goal: isolate what is truly common from what is Electron-only.

Tasks:

- extract Express app creation and middleware setup
- isolate backend initialization from Electron lifecycle hooks
- make web serving optional instead of mandatory
- keep all current routes and behavior unchanged in Electron mode

Deliverable:

- a shared bootstrap module that can be used by both runtimes

### Phase 2. Add the Node-only runtime

Goal: run the backend without Electron on NAS systems.

Tasks:

- create a Node entrypoint that initializes the same backend services
- remove all Electron-only imports from that runtime path
- disable tray creation and desktop-only features
- bind HTTP/HTTPS on the LAN interface, not only localhost

Deliverable:

- a working server process that can run on FreeNAS-like environments

### Phase 3. Make the web client externalizable

Goal: let another machine on the local network use the admin UI.

Tasks:

- add a configurable API base URL to the web app
- ensure CORS and auth still work across LAN devices
- define how the web client is built or hosted for NAS deployments
- confirm the UI does not depend on Electron-only APIs

Deliverable:

- the web client can connect to a remote Seerial server over the local network

### Phase 4. Packaging and distribution

Goal: publish two distributions from the same repository.

Tasks:

- keep Electron build targets for desktop OSes
- add a Node-only package or archive for NAS
- separate build scripts and release artifacts by runtime
- document installation and upgrade steps for both modes

Deliverable:

- one desktop installer path and one NAS server path

## What Should Not Change

To reduce risk, these parts should remain stable in the first implementation:

- domain models in `libs/domain`
- API contracts and controllers
- database schema unless a runtime-specific setting is needed
- media scanning and playback logic
- authentication and authorization rules

## Main Risks

### 1. Electron imports leaking into Node mode

If any shared module imports Electron implicitly, the NAS runtime will fail immediately.

Mitigation:

- keep Electron imports in the Electron runtime only
- use shared interfaces for runtime hooks where needed

### 2. Static web serving assumptions

The current server expects to serve the local web bundle. NAS mode breaks that assumption.

Mitigation:

- make web serving optional
- treat the web app as a separate client in NAS mode

### 3. Host and network configuration

The desktop mode can stay local-only, but NAS mode must be reachable from the LAN.

Mitigation:

- add explicit host binding and a configurable allowed-origin policy
- keep auth/cookie behavior compatible with LAN access

### 4. Packaging complexity

Maintaining two distributions can increase release complexity.

Mitigation:

- keep one shared source tree
- split only the final runtime and packaging layer

## Validation Strategy

Minimum checks I would expect after the refactor:

- desktop mode still starts and serves the local admin UI
- NAS mode starts without Electron installed or loaded
- both modes expose the same API contract
- the web client can talk to the NAS server over the network
- scanning, streaming, and auth still work in both modes

## Recommendation

This is worth doing, and the safest path is a controlled split of startup responsibilities rather than a feature-flagged monolith.

If the goal is to preserve current behavior with minimal risk, the right order is:

1. extract the shared server bootstrap
2. add a Node-only runtime
3. make the web client configurable
4. separate packaging and release flows

That approach keeps the current Electron experience intact while enabling the NAS distribution as a second runtime.
