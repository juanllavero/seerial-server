# Seerial Suite — Quality Shield

**Date:** 2026 | **Status:** ✅ Defined

## 1. Tooling Stack

```
┌─────────────────────────────────────────────────┐
│                Quality Shield                   │
│                                                 │
│     Biome          — Lint + Format + Imports    │
│     Dep. Cruiser   — Architecture guardian      │
│     Turbo          — Orchestration + Cache      │
└─────────────────────────────────────────────────┘
        ↑
   git commit (via lefthook)
```

### Why Biome instead of ESLint + Prettier?

Biome is a single Rust binary that replaces ESLint, Prettier, and import-sorting plugins simultaneously. For a solo developer, this eliminates plugin version conflicts and significantly reduces configuration overhead. It is approximately 25x faster than ESLint on large codebases.

---

## 2. Biome

**Scope:** all `apps/` and `libs/` packages extend `libs/config/biome.json`.

### Critical rules enabled

| Rule                        | What it prevents                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------- |
| `useAltText`                | `<img>` without `alt` — accessibility                                                       |
| `useKeydownEvents`          | `onClick` without keyboard equivalent                                                       |
| `useExhaustiveDependencies` | Incomplete `useEffect`/`useCallback` dependency arrays — the most common React bug category |
| `noExplicitAny`             | Use of `any` type                                                                           |
| `noUnusedImports`           | Dead imports left in files                                                                  |

### Config inheritance

Each `apps/*` and `libs/*` package contains a minimal `biome.json` that extends the root config:

```json
{
  "extends": ["../../libs/config/biome.json"]
}
```

---

## 3. Dependency Cruiser

Validates that the architectural rules defined in [ARCHITECTURE.md](./ARCHITECTURE.md) are enforced automatically on every commit.

### Forbidden import patterns

| Rule                   | What it prevents                                                           |
| ---------------------- | -------------------------------------------------------------------------- |
| `no-cross-feature`     | A feature importing directly from another feature                          |
| `no-circular`          | Circular dependencies in any direction                                     |
| `no-feature-internals` | Pages importing from sub-folders of a feature (must go through `index.ts`) |
| `no-domain-hooks`      | `libs/domain` importing React hooks or TanStack Query                      |
| `no-api-components`    | `libs/api` importing UI components                                         |
| `no-libs-app-import`   | `libs/*` importing from `apps/*`                                           |

### Allowed dependency flow

```
apps/*
  └── libs/api
        └── libs/domain
              └── (no dependencies)
```

---

## 4. Turbo

Turbo orchestrates tasks across the monorepo. It runs `biome` and `dependency-cruiser` in parallel, and caches results so that unchanged packages are not re-analyzed.

### `turbo.json` pipeline (root)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "lint": {
      "outputs": []
    },
    "check:arch": {
      "outputs": []
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Standard commands

```bash
# Lint and format all packages
turbo lint

# Validate architecture rules
turbo check:arch

# Build all packages
turbo build

# Run a specific app
turbo dev --filter=@seerial/web
```

---

## 5. Git Hooks (lefthook)

Pre-commit hook runs lint and architecture check only on changed files for speed.

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    lint:
      run: turbo lint --filter=[HEAD]
    arch:
      run: turbo check:arch --filter=[HEAD]
```

---

## 6. TypeScript Configuration

All packages extend `libs/config/tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

`noUncheckedIndexedAccess` is explicitly enabled because array access (`arr[0]`) in TypeScript is otherwise unsafely typed as `T` instead of `T | undefined`.

---

## 7. Best Practices Reference

| #   | Rule                                                                | Reason                                                          |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1   | All files in `kebab-case`                                           | Consistent across OS file systems (Linux is case-sensitive)     |
| 2   | Each layer (`api/`, `model/`) has its own `index.ts` barrel         | Defines the public API of each layer, prevents internal leakage |
| 3   | Pages always import from the feature barrel (`features/x/index.ts`) | Enforced by Dependency Cruiser                                  |
| 4   | No `any` — use `unknown` + type narrowing                           | `any` disables TypeScript entirely                              |
| 5   | Business logic in `@seerial/domain`, not in components              | Enables testing and reuse without a DOM                         |
| 6   | `!!count && <Comp />` not `count && <Comp />`                       | `0 && <Comp />` renders the literal `0` in the DOM              |
| 7   | Early returns for error and loading states                          | Reduces nesting, improves readability                           |
| 8   | Filters and pagination in URL `searchParams`                        | Shareable URLs, back-button support                             |
| 9   | Form validation with Zod + React Hook Form                          | Typed validation consistent between client and server           |
| 10  | All documentation and code in English                               | Consistency across the codebase                                 |
