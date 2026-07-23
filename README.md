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
  features/         # feature-owned UI (project, editor, preview, motion, rig)
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
- Motion Data foundation with timeline, FPS, duration, current frame, and keyframes
- Play, pause, stop, frame navigation, editable keyframes, and basic undo/redo
- Data-driven R6/R15 placeholder rig loader with expandable bone hierarchy
- Bone selection, synced viewport highlighting, rotation gizmo, and pose data by frame

## Current features

- Project toolbar: New, Open mock, Save placeholder, disabled Import/Export, and AI/Settings placeholders
- Resettable viewport camera and grid visibility control
- Project metadata and empty-selection inspector
- Timeline panel with a dedicated, expandable editor area
- Interactive timeline with frame ruler, playhead, selectable keyframe markers, and playback settings
- Keyboard shortcuts: Space, Left/Right Arrow, Delete, Ctrl+Z, and Ctrl+Shift+Z
- Bone hierarchy with expand/collapse and synced hierarchy/viewport selection
- Bone inspector for position, rotation, and read-only scale; rotation changes are saved as poses at the active frame

## Screenshot

_Workspace screenshot placeholder. A captured desktop screenshot will be added when desktop packaging is available in the development environment._

## Next milestone

Add persistent `.rma` project files, then evolve the pose editor with constraints and export-ready motion data.

## Changelog

### 0.4.0 - Rig and pose editor

- Added data-driven Roblox R6/R15 rig definitions and a reusable placeholder rig loader.
- Added expandable bone hierarchy, synchronized bone selection, and viewport rotation gizmo.
- Added pose data per frame, automatic timeline keyframe creation, and frame-based pose restoration.

### 0.3.0 - Motion editor foundation

- Added the internal Motion Data model, isolated motion store, and bounded undo/redo history.
- Added timeline navigation, frame playhead, keyframe marker selection, creation, editing, and deletion.
- Added timeline playback controls, FPS/duration settings, and keyboard shortcuts.

### 0.2.0 - Workspace and 3D preview

- Split the desktop shell into reusable toolbar, sidebar, viewport, inspector, and bottom-panel components.
- Added an interactive Three.js viewport with lighting, world orientation helpers, and resettable orbit controls.
- Added presentation-only R6/R15 rig placeholders designed to be replaced by real model adapters later.

### 0.1.0 - Project foundation

- Initialized the Tauri + React + TypeScript application architecture.
- Added dark desktop workspace and project management placeholders.
- Added R6/R15 project rig selection and supporting state models.
