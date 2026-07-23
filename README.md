# CapaMotion

CapaMotion is a local-first desktop application for creating Roblox animation projects. It currently provides a project workspace and 3D rig preview foundation; animation editing is intentionally not implemented yet.

## Tech stack

- Tauri 2 desktop runtime
- React 19, TypeScript (strict), Vite, Tailwind CSS
- Zustand feature stores
- Three.js, React Three Fiber, and Drei viewport foundation
- Reserved Python local AI backend

## Structure

```
src/
  components/       # reusable UI and system components
  features/         # feature-owned UI (project, editor, preview)
  hooks/            # React hooks
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

For browser-only development, use `pnpm dev`. Build the frontend with `pnpm build`.

## Current progress

- Desktop workspace with a top toolbar, project sidebar, responsive viewport, inspector, and collapsible bottom panel
- New project flow with Roblox R6/R15 metadata
- Mock recent projects, open project flow, and in-memory save placeholder
- React Three Fiber scene with perspective camera, orbit/pan/zoom controls, grid, axes, and lighting
- R6 and R15 wireframe rig placeholders selected from project metadata
- Feature-separated project, workspace, camera, preview, and settings stores, plus an error boundary

## Current features

- Project toolbar: New, Open mock, Save placeholder, disabled Import/Export, and AI/Settings placeholders
- Resettable viewport camera and grid visibility control
- Project metadata and empty-selection inspector
- `Timeline Coming Soon` panel reserved for a future editor milestone

## Screenshot

_Workspace screenshot placeholder. A captured desktop screenshot will be added when desktop packaging is available in the development environment._

## Next milestone

Implement the timeline, keyframes, playback controls, selectable bones, and persistent `.rma` project files.

## Changelog

### 0.2.0 - Workspace and 3D preview

- Split the desktop shell into reusable toolbar, sidebar, viewport, inspector, and bottom-panel components.
- Added an interactive Three.js viewport with lighting, world orientation helpers, and resettable orbit controls.
- Added presentation-only R6/R15 rig placeholders designed to be replaced by real model adapters later.

### 0.1.0 - Project foundation

- Initialized the Tauri + React + TypeScript application architecture.
- Added dark desktop workspace and project management placeholders.
- Added R6/R15 project rig selection and supporting state models.
