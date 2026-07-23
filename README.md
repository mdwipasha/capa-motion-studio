# CapaMotion

CapaMotion is a local-first desktop foundation for creating Roblox animation projects. This milestone focuses on a scalable workspace and project metadata—not animation tooling yet.

## Tech stack

- Tauri 2 desktop runtime
- React 19, TypeScript (strict), Vite, Tailwind CSS
- Zustand feature stores
- Planned integrations: Three.js / React Three Fiber, Python local AI backend

## Structure

```
src/
  components/       # reusable UI and system components
  features/         # feature-owned UI (project, editor)
  lib/              # shared utilities and domain helpers
  stores/           # Zustand stores by concern
  types/            # domain types
src-tauri/          # Tauri desktop shell
python/             # reserved local AI backend
docs/               # product, technical, and task specifications
```

## Run locally

```bash
pnpm install
pnpm tauri dev
```

For a browser-only development session, use `pnpm dev`. Build the frontend with `pnpm build`.

## Progress

- Desktop shell with top navigation, workspace sidebar, preview region, inspector, and bottom panel
- New project flow with Roblox R6/R15 metadata
- Mock recent projects, open project flow, and in-memory save placeholder
- Feature-separated Zustand stores and an error boundary

## Next milestone

Implement the editor engine incrementally: Three.js preview canvas, timeline, playback, selectable bones, and persistent `.rma` project files.

## Changelog

### 0.1.0 — Project foundation

- Initialized the Tauri + React + TypeScript application architecture.
- Added dark desktop workspace and project management placeholders.
- Added R6/R15 project rig selection and supporting state models.
