# CapaMotion

CapaMotion is a local-first desktop application for creating and editing Roblox animation projects. It supports Roblox R6/R15 placeholder rigs, a frame-based pose editor, readable `.rma` project files, and a local video-to-motion reconstruction pipeline.

## Tech stack

- Tauri 2 desktop runtime
- React 19, TypeScript strict mode, Vite, and Tailwind CSS
- Zustand feature stores
- Three.js, React Three Fiber, and Drei
- Python local AI backend with MediaPipe pose detection

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

The core editor and local AI pipeline foundation are usable: projects can be saved as `.rma`, opened again, and restored with their rig, motion, camera, layout, viewport, editor preferences, and optional reconstructed AI motion data.

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
- Local AI Motion Pipeline with MP4/MOV/AVI selection, drag-and-drop, metadata, FFmpeg extraction progress, cancellation, logs, and original/skeleton previews
- Python `PoseDetector` abstraction with the initial MediaPipe adapter; reconstruction produces confidence-scored joint positions and placeholder rotations for future retargeting
- Data-driven retarget engine with separate R6/R15 bone-mapping JSON files, quaternion-based rotation conversion, and editable generated poses
- Fast, Balanced, and High Quality cleanup presets for sampling, rotation smoothing, jitter reduction, and keyframe reduction
- Before / After / Split preview modes for source-pose comparison against the Roblox rig preview
- Local ASCII FBX animation export with generated R6/R15 skeleton hierarchy and rotation curves

## Supported formats

| Format | Import | Export |
| --- | --- | --- |
| CapaMotion `.rma` | Supported | Supported |
| FBX | Registered placeholder | Local ASCII animation export |
| BVH / GLTF | Planned architecture extension | Planned architecture extension |

## Local AI pipeline

Install and start the local backend before using the **AI** toolbar button:

```bash
python -m pip install -r python/requirements.txt
pnpm ai
```

FFmpeg and `ffprobe` must be on `PATH`. Supported video inputs are MP4, MOV, and AVI. The pipeline binds only to `127.0.0.1` and sends no video, frames, or pose data to cloud services. Its output is retarget-free internal Motion Data and is persisted as optional AI motion data in `.rma` files.

## Retargeting and FBX export

After AI processing finishes, choose **Create Roblox Draft**, select the cleanup quality, and build the timeline for the active project rig. Both R6 and R15 are supported through separate external mapping files. The generated keyframes are normal editor poses: they can be selected, changed, removed, and saved like manually authored data.

The FBX button exports a local ASCII FBX 7.4 rotation animation with the project rig hierarchy. It is intended for Roblox Studio animation-import validation; mesh, facial, finger, and physics data are intentionally not generated.

## Development progress

- Project foundation: complete
- Workspace and 3D preview: complete
- Motion editor foundation: complete
- Rig and pose editor foundation: complete
- Project file persistence and import/export architecture: complete
- Local AI motion pipeline foundation: complete
- R6/R15 retargeting, cleanup, and editable draft timeline: complete
- Local FBX animation export: complete
- FBX import: pending

## Screenshot

_Workspace screenshot placeholder. A captured desktop screenshot will be added when desktop packaging is available in the development environment._

## Next milestone

Validate and refine FBX import compatibility, then evolve cleanup with foot locking, hand locking, and constraints.

## Changelog

### 0.7.0 - Roblox retargeting, cleanup, and FBX export

- Added external R6/R15 bone mappings, quaternion-based rotation conversion, and asynchronous retarget progress.
- Added Fast, Balanced, and High Quality cleanup presets with smoothing, jitter reduction, and keyframe reduction.
- Added editable AI-generated timeline poses, Before/After/Split preview modes, and local ASCII FBX 7.4 animation export.

### 0.6.0 - Local AI motion pipeline

- Added local Python service modules for video validation/metadata, FFmpeg extraction, MediaPipe pose detection, and retarget-free reconstruction.
- Added the AI Motion Pipeline UI with drag-and-drop, metadata, progress polling, cancellation, pipeline logs, and original/skeleton-overlay previews.
- Added optional reconstructed AI Motion Data persistence inside `.rma` project documents.

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
