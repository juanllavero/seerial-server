# @seerial/server — Server Architecture

**Date:** 2026 | **Status:** ✅ Defined  
**Role:** Multimedia server (Plex/Jellyfin-style) + local tray host  
**Stack:** Node.js + Express + TSOA + TypeScript + TypeORM + SQLite (better-sqlite3)

---

## 1. Responsibilities

`@seerial/server` is the backend core of the Seerial suite. It is responsible for:

- Managing multimedia libraries (movies, shows, music).
- Scanning local file systems and building indexed media catalogs.
- Enriching metadata through external providers (TMDB, IMDB, MusicBrainz).
- Exposing REST endpoints through Express + TSOA.
- Streaming media files (passthrough and transcoding).
- Handling auth/authorization and server-level configuration.
- Broadcasting real-time mutations to clients through WebSocket.

Although it behaves as a backend API, it is packaged and run with Electron for desktop distribution, tray integration, and local service orchestration.

---

## 2. High-Level Structure

```
apps/server/
│
├── src/
│   ├── index.ts                          # App bootstrap, middleware chain, startup lifecycle
│   ├── api/v1/
│   │   ├── [bounded-context]/
│   │   │   ├── application/              # use cases, DTOs, ports
│   │   │   ├── domain/                   # domain entities/contracts
│   │   │   └── infrastructure/           # controllers, repositories, adapters
│   │   ├── shared/                       # cross-cutting ports/adapters/services
│   │   └── base-repository/              # repository base behaviors
│   ├── middleware/                       # auth, sanitization, request-id, streaming token
│   ├── routes/                           # generated tsoa routes
│   ├── config/                           # centralized messages/config objects
│   └── utils/                            # logger, constants, helpers
│
├── swagger.json                          # OpenAPI output
├── tsoa.json                             # tsoa generation settings
├── esbuild.config.js                     # backend bundle config
└── package.json
```

Main business contexts under `src/api/v1` include:

- `libraries`, `collections`
- `movies`, `series`, `seasons`, `episodes`, `videos`
- `albums`, `artists`, `songs`, `playlists`
- `watch-lists`, `my-lists`, `users`, `servers`
- `shared` (cross-cutting technical capabilities)

---

## 3. Hexagonal Architecture in Practice

Each context follows a ports-and-adapters layout:

- **Domain:** business model (`domain/*.ts`)
- **Application:** use cases and abstractions (`application/usecases`, `application/ports`, DTOs)
- **Infrastructure:** technology-specific adapters
  - HTTP adapters (`infrastructure/web/controllers`)
  - persistence adapters (`infrastructure/persistence/repositories`, TypeORM models)
  - external providers/adapters (metadata, ffmpeg/media-info, notifications, filesystem)

### Dependency flow

```
Controllers (HTTP/TSOA)
  -> UseCases (Application)
    -> Ports (interfaces)
      -> Adapters (Repositories / Services)
        -> TypeORM / FFmpeg / External APIs / FS / WebSocket
```

The project centralizes concrete wiring in a DI container-like module (`shared/infrastructure/adapters/di/container.ts`) that instantiates repositories, services, and use case factories.

---

## 4. API Layer (Express + TSOA)

### Route generation

- Controllers use TSOA decorators (`@Route`, `@Get`, `@Post`, `@Security`, etc.).
- Routes are generated into `src/routes/routes.ts`.
- API base path is `/api` (configured in `tsoa.json` and reflected in generated routes).

### API docs

- Swagger UI is exposed at `/api-docs`.
- OpenAPI spec is generated from TSOA metadata.

### Response contract

All endpoints return a unified envelope:

```ts
ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  timestamp: string;
}
```

This standardizes frontend consumption and error handling.

---

## 5. Bootstrap and Runtime Lifecycle

Startup sequence in `src/index.ts`:

1. Load environment and initialize Express app.
2. Register cross-cutting middleware (compression, sanitization, request IDs, CORS, rate-limit, helmet, body parser, cookies).
3. Initialize infrastructure dependencies:
  - downloader binary setup
  - SQLite/TypeORM initialization
  - filesystem folders/properties
  - runtime config loading
  - TMDB client initialization
  - server config loading/creation
4. Register Swagger and generated TSOA routes.
5. Serve built web client statically and fallback to `index.html` for SPA routes.
6. Register global error handler.
7. Start HTTP/HTTPS server from persisted server config.
8. Initialize WebSocket notifications and optional UPnP mapping.
9. Create system tray integration (Electron runtime).

---

## 6. Persistence Architecture

Database is handled via TypeORM with `better-sqlite3`:

- Data source bootstrapped in `DatabaseManager`.
- SQLite pragmas are tuned (`foreign_keys`, `WAL`, `busy_timeout`, `synchronous`).
- Schema sync is currently enabled at startup (`synchronize()`), with migration helpers available for future production hardening.
- Models are TypeORM entities with relational mappings (libraries, media items, lists, users, server config, etc.).

A shared `WriteQueue` serializes write operations in scan-heavy flows to avoid SQLite writer contention (`SQLITE_BUSY`/`SQLITE_LOCKED`).

---

## 7. Media Processing and Ingestion

The server supports both indexing and playback pipelines.

### Library scanning

- `ScanLibraryUseCase` orchestrates by library type.
- Specialized use cases process movies/series/music.
- Files are discovered through filesystem service ports.
- Metadata enrichment is performed via provider ports (TMDB and related services).
- Notifications are emitted as mutations while scan progresses.

### Streaming

Video streaming exposes two modes:

- **Passthrough:** direct file range streaming.
- **Transcoded:** on-the-fly transcode pipeline.

Both modes use JWT-signed temporary URLs and middleware-based token verification for stream access.

---

## 8. Security Model

Security is integrated through middleware and TSOA security definitions:

- Cookie-based JWT authentication (`cookieAuth`, `cookieAuthFast`).
- Admin-only and management policies (`adminAuth`, `managementAuth`).
- Optional public endpoints (`public` security scheme).
- Login route-specific rate limiting + global rate limiting.
- Input sanitization middleware for `body`, `query`, and `params`.
- Request correlation IDs (`X-Request-Id`) for tracing.
- Helmet hardening (with selective relaxations for streaming compatibility).
- Optional remote IP filter, proxy trust configuration, and local-network management mode.

---

## 9. Real-Time Update Channel

`NotificationServiceImpl` binds a WebSocket server to the same HTTP/HTTPS server instance (`upgrade` flow).

It broadcasts mutation events (libraries, movies, series, collections, albums, etc.) so clients can invalidate/update views in near real time during scans and metadata updates.

---

## 10. Cross-Cutting Technical Services

`shared` provides reusable ports/adapters used by many contexts:

- Filesystem abstraction
- Media info extraction (ffmpeg/ffprobe)
- Video processing and extraction
- Image processing (collages/thumbnails)
- Metadata providers and external search
- Download management
- Notification transport
- Config and server runtime orchestration

This keeps use cases technology-agnostic and testable.

---

## 11. Build, Packaging, and Deployment Style

- Build: `esbuild` bundles server entry (`src/index.ts`) to `dist/index.js`.
- API docs/routes generation: `tsoa spec`, `tsoa routes`.
- Lint/type checks: Biome + TypeScript.
- Tests: Jest + ts-jest.
- Packaging: Electron Builder (Windows/macOS/Linux targets), including static assets and runtime dependencies.

This results in a distributable local media server app, not only a raw Node process.

---

## 12. Testing and Quality Notes

Current test setup is Jest with TypeScript support and focused test files in selected adapters/services.

Quality posture in the backend currently includes:

- strict TypeScript configuration
- standardized API responses and centralized error handling
- structured logging through Pino
- input sanitization and defensive middleware
- write serialization for SQLite-heavy operations

As the codebase grows, the highest-value additions are broader application/use-case test coverage and explicit DB migration workflows for production upgrades.

---

## 13. Key Architecture Rules (Server)

1. Keep domain/application isolated from transport and infrastructure details.
2. New external integrations must enter through `application/ports` and adapter implementations.
3. Controllers orchestrate use cases; business rules stay in use cases/domain.
4. Return `ApiResponse<T>` consistently from HTTP controllers.
5. Use centralized DI container factories for service/repository composition.
6. Favor serialized writes for scan/update workflows that can create SQLite contention.
7. Keep authentication declarative through TSOA `@Security` + shared auth module.
8. Keep generated artifacts (`routes.ts`, `swagger.json`) out of manual edits; regenerate through scripts.
9. Prefer shared cross-cutting services under `shared` instead of duplicating utilities per module.
10. Preserve module symmetry (`application`, `domain`, `infrastructure`) for each new bounded context.
