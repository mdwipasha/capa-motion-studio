# CapaMotion

CapaMotion is a local-first desktop application for creating and editing Roblox animation projects. It supports Roblox R6/R15 placeholder rigs, a frame-based pose editor, and readable `.rma` project files.

## Tech stack

- Tauri 2 desktop runtime
- React 19, TypeScript strict mode, Vite, and Tailwind CSS
- Zustand feature stores
- Three.js, React Three Fiber, and Drei
- Reserved Python local AI backend

## Structure

```
src/
  components/       # reusable UI and system components
  features/         # feature UI and project import/export adapters
  hooks/            # playback, autosave, and editor hooks
  lib/              # motion, pose, rig, and .rma utilities
  stores/           # Zustand stores by concern
  types/            # project, motion, rig, and transfer models
src-tauri/          # Tauri desktop shell
python/             # reserved local AI backend
docs/               # product, technical, and task specifications
```

## Run locally

```bash
pnpm install
pnpm tauri dev
```

For browser-only development, run `pnpm dev`. Build the frontend with `pnpm build`.

## Project status

The core editor foundation is usable without AI: projects can be saved as `.rma`, opened again, and restored with their rig, motion, camera, layout, viewport, and editor preferences.

## Current features

- Desktop workspace with toolbar, project sidebar, responsive viewport, inspector, and collapsible timeline panel
- New projects with Roblox R6/R15 metadata and data-driven placeholder rigs
- Timeline, keyframes, frame navigation, playback controls, and basic undo/redo
- Bone hierarchy, synced selection, frame-based pose data, and manual bone rotation fields
- Visual-only X/Y/Z rotation guide; enter `rotation = Vector3.new(x, y, z)` in the inspector to set a rotation
- Versioned, validated JSON `.rma` files containing project metadata, rig, timeline, motion poses, camera, viewport, layout, and preferences
- Save, Save As, Open Project, local recovery snapshots, recent projects, and remove-recent action
- Autosave enabled by default every 30 seconds; configurable in Settings along with default FPS and viewport background color
- Modular importer/exporter registries: `.rma` import/export is active; FBX adapters provide clear placeholder errors until parser/writer work is implemented

## Supported formats

| Format | Import | Export |
| --- | --- | --- |
| CapaMotion `.rma` | Supported | Supported |
| FBX | Registered placeholder | Registered placeholder |
| BVH / GLTF | Planned architecture extension | Planned architecture extension |

## Development progress

- Project foundation: complete
- Workspace and 3D preview: complete
- Motion editor foundation: complete
- Rig and pose editor foundation: complete
- Project file persistence and import/export architecture: complete
- FBX parser and writer: pending
- AI motion workflow: pending

## Screenshot

_Workspace screenshot placeholder. A captured desktop screenshot will be added when desktop packaging is available in the development environment._

## Next milestone

Implement a real FBX importer/exporter, then continue pose tooling with interactive rotation manipulation, constraints, and export-ready retargeting.

## Changelog

### 0.5.0 - Project files, persistence, and transfer foundation

- Added versioned and validated JSON `.rma` documents with project, rig, timeline, motion pose, camera, layout, and editor settings persistence.
- Added Save, Save As, Open Project, autosave recovery snapshots, persistent recent projects, and Settings controls.
- Added modular `.rma` and FBX importer/exporter adapters; `.rma` is fully available while FBX reports an explicit pending implementation message.
- Replaced the non-functional rotation control with a visual-only axis guide and documented manual `Vector3.new` rotation entry.

### 0.4.0 - Rig and pose editor

- Added data-driven Roblox R6/R15 rig definitions and a reusable placeholder rig loader.
- Added expandable bone hierarchy, synchronized bone selection, and frame-based pose restoration.
- Added pose data per frame and automatic timeline keyframe creation.

### 0.3.0 - Motion editor foundation

- Added the internal Motion Data model, isolated motion store, and bounded undo/redo history.
- Added timeline navigation, keyframe selection, creation, editing, deletion, and playback controls.

### 0.2.0 - Workspace and 3D preview

- Split the desktop shell into reusable toolbar, sidebar, viewport, inspector, and bottom-panel components.
- Added an interactive Three.js viewport with lighting, world orientation helpers, and resettable orbit controls.

### 0.1.0 - Project foundation

- Initialized the Tauri + React + TypeScript architecture and dark desktop workspace.
- Added R6/R15 project selection and initial project management UI.
