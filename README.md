# Ephany UI

Ephany UI is the open-source React + Vite frontend for the Ephany Framework.  
It provides a modern, developer-friendly interface for browsing and interacting with asset data exposed by any Ephany Framework backend.

The UI is fully decoupled from the API which means frontend developers can point it to their own self-hosted Ephany Framework deployment.

This repo is designed for clarity, extensibility, and rapid launch.

---

## Features

- Vite-powered React application with instant dev startup
- TypeScript-first codebase
- Clean API client architecture (no fetch calls inside components)
- Local environment configuration via `.env` (gitignored)
- Vite proxy for seamless development against any API instance
- Optional mock-data mode for offline development
- Simple structure that welcomes community contributions

---

# Quickstart

## Prerequisites
- Node.js 18+
- npm 9+

## Setup

```
git clone https://github.com/TripleZeroLabs/Ephany-UI-React.git
cd Ephany-UI-React
```

Create your environment file:

```
cp .env.example .env
```

Install dependencies:

```
npm install
```

Start the dev server:

```
npm run dev
```

Visit the URL printed in your terminal (usually `http://localhost:5173`).

By default, the app will point to `http://localhost:8000` unless you change it in `.env`.

---

# Environment Variables

All runtime configuration occurs through `.env` files.  
These values must start with `VITE_` to be available to the frontend.

### `.env.example`

```
# Where /api should proxy to in development.
# Most developers will point to a locally running Ephany Framework instance.
VITE_PROXY_TARGET=http://localhost:8000

# Use mock data instead of a real API for offline development
VITE_USE_MOCK_DATA=false
```

### `.env` is gitignored  
Each developer creates their own `.env` and modifies it based on their API host.

Examples:

To use your live Ephany API:

```
VITE_PROXY_TARGET=https://yourdomain.com
```

To use a local Ephany Framework instance:

```
VITE_PROXY_TARGET=http://localhost:8000
```

---

# How API Calls Work

During development:

- The React app calls **relative** paths, e.g. `/api/assets/`.
- Vite reads `VITE_PROXY_TARGET` and forwards requests:
  ```
  /api → VITE_PROXY_TARGET
  ```
  This avoids CORS issues entirely.

During production:

- Your hosting environment (Nginx, Apache, etc.) should proxy `/api` to your real backend.

---

# Project Structure

```
src/
  api/
    client.ts       # Centralized fetch wrapper
    assets.ts       # Asset-specific API calls
  components/
    ...             # Shared UI components
  pages/
    AssetsPage.tsx  # Example route-level page
  mock/
    assets.json     # Sample asset data for offline mode
  App.tsx
  main.tsx
```

### Conventions

- **No direct fetch calls inside React components.**  
  All HTTP logic belongs in `src/api`.

- **Page-level components** go in `src/pages`.

- **Reusable UI components** go in `src/components`.

- **Mock mode** is enabled when `VITE_USE_MOCK_DATA=true`.

---

# Development Workflow

### Format code
```
npm run format
```

### Lint the project
```
npm run lint
```

### Enable mock data for offline mode
```
VITE_USE_MOCK_DATA=true npm run dev
```

### Build for production
```
npm run build
```

---

# Contributing

We welcome community contributions. Please follow these guidelines:

### 1. Setup
Follow the Quickstart steps above.

### 2. Code style
- Use TypeScript for all new code.
- Run `npm run lint` and `npm run format` before submitting a PR.
- Keep API and UI logic separate (use `src/api`).

---

# License

Licensed under the AGPL-3.0. Modifications and network-deployed versions must remain open source under the same license.
