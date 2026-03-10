![Seerial Banner](assets/banner.svg)

# Seerial Suite

![License](https://img.shields.io/badge/license-GPL--3.0--only-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)
![pnpm](https://img.shields.io/badge/pnpm-workspace-orange.svg)

Seerial is an open-source media management suite, designed to offer a seamless experience across multiple devices.

This repository is a **Monorepo** managed with [pnpm workspaces](https://pnpm.io/workspaces), containing the backend server as well as all official clients (Web, Desktop, and TV).

---

## Monorepo Architecture

The project is divided into two main sections: runnable applications (`apps/`) and shared libraries/configurations (`libs/`).

### Applications (`apps/`)

- **`@seerial/server`**: Main backend built with Node.js, Express, TypeORM, and packable with Electron.
- **`@seerial/web`**: Main web client built with React and Vite.
- **`@seerial/desktop`**: Cross-platform desktop application using Tauri and React.
- **`@seerial/tv`**: Native smart TV application built with Expo / React Native TV.

### Shared Packages (`libs/`)

- **`@seerial/config`**: Global and standardized configurations for ESLint and TypeScript.
- **`@seerial/shared-types`**: Data models, DTOs, and shared TypeScript interfaces across the backend and clients.

---

## Quick Start Guide

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/installation) (Main package manager)

### Installation

By using `pnpm workspaces`, all dependencies across the ecosystem are installed and linked with a single command from the root:

```bash
# 1. Clone the repository
git clone [https://github.com/juanllavero/seerial.git](https://github.com/juanllavero/seerial.git)
cd seerial

# 2. Install all dependencies across all apps
pnpm install
```

### Main Development Commands

Thanks to the global scripts configured in the root, you can easily spin up any part of the suite:

- **`pnpm run dev`**: Starts the Server and the Web Client simultaneously in parallel.
- **`pnpm run dev:server`**: Starts only the backend in development mode.
- **`pnpm run dev:web`**: Starts only the web frontend (Vite).
- **`pnpm run dev:desktop`**: Starts the desktop app development environment (Tauri).
- **`pnpm run dev:tv`**: Starts the Expo server for the TV app.

### Maintenance Commands

- **`pnpm run lint`**: Runs the linters across all packages in the monorepo in parallel to ensure code quality.
- **`pnpm run build`**: Builds all applications for production.

---

## License

This project is licensed under the **GNU General Public License v3.0 only** (`GPL-3.0-only`). See the [LICENSE](./LICENSE) file for more details.
