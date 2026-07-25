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

## Installation and system requirements

- Supported platform: Windows 10/11 (64-bit)
- Desktop runtime: Microsoft WebView2 Runtime
- Optional AI runtime: Python 3.12+, FFmpeg/FFprobe, and `python/requirements.txt`
- Installer targets: NSIS `.exe` and WiX `.msi`

```bash
pnpm install
pnpm release
```

Tauri writes installer artifacts under `src-tauri/target/release/bundle/`. To use Portable Mode, place a `portable.flag` file beside the executable; data, models, cache, and logs then remain under its adjacent `data/` directory. Installer builds use the application data directory.

## Project status

The core editor and local AI pipeline foundation are usable: projects can be saved as `.rma`, opened again, and restored with their rig, motion, camera, layout, viewport, editor preferences, and optional reconstructed AI motion data.

## Current features

- Desktop workspace with toolbar, project sidebar, responsive viewport, inspector, and collapsible timeline panel
- New projects with Roblox R6/R15 metadata and data-driven placeholder rigs
- Timeline, keyframes, frame navigation, playback controls, and basic undo/redo
- Bone hierarchy, synced selection, frame-based pose data, interactive Move/Rotate/Scale gizmo controls, and manual transform fields
- Position, rotation, and scale are stored per keyframe; `rotation = Vector3.new(x, y, z)` remains available for Roblox-style rotation entry
- Versioned, validated JSON `.rma` files containing project metadata, rig, timeline, motion poses, camera, viewport, layout, and preferences
- Save, Save As, Open Project, local recovery snapshots, recent projects, and remove-recent action
- Autosave enabled by default every 30 seconds; configurable in Settings along with default FPS and viewport background color
- Modular importer/exporter registries: `.rma` import/export is active; ASCII FBX animation curves can be imported into the editor timeline
- Local AI Motion Pipeline with MP4/MOV/AVI selection, drag-and-drop, metadata, responsive FFmpeg extraction progress, cancellation, logs, and original/skeleton previews
- AI Tools panel gated by the same local runtime/model readiness as Video to Animation
- Text to Motion draft generation from local prompt-matched presets; generated keyframes remain editable in the timeline
- Motion Library, Animation Templates, and Auto Loop tools for quickly applying starter motions and loop-ready endings
- Python `PoseDetector` abstraction with MediaPipe classic and MediaPipe Tasks support; reconstruction produces confidence-scored joint positions and placeholder rotations for future retargeting
- Data-driven retarget engine with separate R6/R15 bone-mapping JSON files, quaternion-based rotation conversion, and editable generated poses
- Fast, Balanced, and High Quality cleanup presets for sampling, rotation smoothing, jitter reduction, and keyframe reduction
- Before / After / Split preview modes for source-pose comparison against the Roblox rig preview
- Local Binary FBX 7.4 animation-only export with an Armature-rooted R6/R15 skeleton hierarchy, terminal leaf bones, and translation/rotation curves; scale curves are written only when used

## Supported formats

| Format | Import | Export |
| --- | --- | --- |
| CapaMotion `.rma` | Supported | Supported |
| FBX | ASCII skeleton/animation curve import | Binary FBX 7.4 animation-only export |
| BVH / GLTF | Planned architecture extension | Planned architecture extension |

## Local AI pipeline

The AI pipeline is local-only. The **AI** toolbar button appears after both pieces are ready:

- CapaMotion AI Runtime: a downloadable sidecar containing `capamotion-ai.exe`, `ffmpeg.exe`, and `ffprobe.exe`.
- MediaPipe Pose Landmarker model: downloaded from Help - AI Models.

Development builds can still use system Python and FFmpeg:

```bash
python -m pip install -r python/requirements.txt
pnpm ai
```

Supported video inputs are MP4, MOV, and AVI. The pipeline binds only to `127.0.0.1` and sends no video, frames, or pose data to cloud services. Its output is retarget-free internal Motion Data and is persisted as optional AI motion data in `.rma` files.

## AI models, release, and recovery

Use **Help - AI Models** to download and manage the local AI runtime bundle and MediaPipe Pose Landmarker model. The Video to Animation menu is hidden until both are ready. When a video is submitted, the app starts the sidecar service automatically and prepends the runtime folder to `PATH` so bundled FFmpeg tools are used. Development builds fall back to system Python and FFmpeg when no sidecar is installed.

Build the Windows AI runtime bundle with:

```powershell
pnpm ai:runtime -- -FfmpegDir C:\path\to\ffmpeg\bin
```

The script creates `dist-ai-runtime/capamotion-ai-runtime-windows-x64.zip`. Publish that zip to the URL configured by `CAPAMOTION_AI_RUNTIME_URL` at build time, or to the default GitHub Releases path shown in Help - AI Models.

Phase 3 AI Tools use the same readiness gate. Text to Motion, Motion Library, Auto Loop, and Animation Templates appear from the toolbar only after the runtime and pose model are installed. The first Text to Motion implementation is a local prompt-to-preset draft generator, so it creates editable timeline poses without using a cloud API.

Release configuration registers `.rma` as a CapaMotion project type and launch arguments are validated before opening a project. Help provides About, runtime diagnostics, logs, keyboard shortcuts, model management, and update-check readiness. Interrupted sessions offer the latest cached recent project for recovery.

Version `0.8.0` is verified across package, Cargo, and Tauri manifests during prebuild. Signed auto-update artifacts are enabled, but publishing an updater requires a GitHub Releases endpoint, updater public key, and private signing key supplied through CI secrets.

## Release process

1. Update the version; the prebuild guard validates every manifest.
2. Configure the signed GitHub Releases endpoint/public key for production.
3. Provide the Tauri private signing key through CI secrets.
4. Run `pnpm release`, then upload `.exe`, `.msi`, and updater artifacts to GitHub Releases.

## Troubleshooting

- **AI runtime unavailable:** use Help - AI Models to download the CapaMotion AI Runtime, or install Python and FFmpeg for development.
- **No AI model:** use Help - AI Models to download the local MediaPipe Pose Landmarker model.
- **Recovered session shown:** restore the snapshot or dismiss it and open `.rma` manually.
- **Release build is slow or fails:** install required Windows SDK/WiX tooling and retry `pnpm release`.

## Retargeting and FBX export

After AI processing finishes, choose **Create Roblox Draft**, select the cleanup quality, and build the timeline for the active project rig. Both R6 and R15 are supported through separate external mapping files. The generated keyframes are normal editor poses: they can be selected, changed, removed, and saved like manually authored data.

The FBX button exports a Binary FBX 7.4 animation-only file with an Armature-rooted project rig hierarchy, terminal leaf bones, animation stack/layer, and connected translation/rotation curves. A bind pose is intentionally omitted because animation-only output contains no mesh skin or cluster data. Scale curves are omitted unless scale is actually animated. Mesh, material, texture, camera, light, facial, finger, and physics data are intentionally not generated.

## Development progress

- Project foundation: complete
- Workspace and 3D preview: complete
- Motion editor foundation: complete
- Rig and pose editor foundation: complete
- Project file persistence and import/export architecture: complete
- Local AI motion pipeline foundation: complete
- Phase 3 AI tools: complete
- R6/R15 retargeting, cleanup, and editable draft timeline: complete
- Local FBX animation export: complete
- FBX import: partial ASCII animation import; binary and mesh-preserving import remain pending

## Screenshot

_Workspace screenshot placeholder. A captured desktop screenshot will be added when desktop packaging is available in the development environment._

## Next milestone

Validate and refine FBX import/export compatibility, then replace the local prompt-to-preset Text to Motion generator with a richer local model when the AI runtime bundle is ready for larger models.

## Changelog

### Unreleased - Editor, AI, and FBX stability fixes

- Replaced the visual-only rig gizmo with interactive Move, Rotate, and Scale transform controls.
- Added per-keyframe position and scale pose data, direct keyframe readback, and transform-aware undo/redo shortcuts.
- Replaced the AI model placeholder with a real MediaPipe Pose Landmarker download path and hid Video to Animation until the model is installed.
- Fixed FFmpeg extraction progress so Video to Animation no longer appears stuck at 15%.
- Added MediaPipe Tasks support for environments where `mediapipe.solutions` is unavailable.
- Added automatic AI service startup with support for a future bundled `capamotion-ai.exe` runtime sidecar.
- Added downloadable AI runtime bundle management so release users can run Video to Animation without manually installing Python or FFmpeg.
- Added Phase 3 AI Tools: Text to Motion, Motion Library, Auto Loop, and Animation Templates, all gated behind local AI runtime/model readiness.
- Stabilized retarget root/torso mapping so generated Roblox drafts remain upright instead of inheriting a sideways hip-axis rotation.
- Rewrote FBX export as Binary FBX 7.4 animation-only output with validated Armature-rooted skeletons, terminal leaf bones, typed time metadata, standard FBX footer, animation stack/layer, curve nodes, curves, and connections; partial ASCII FBX animation import remains available.

### 0.8.0 - Release and user experience foundation

- Added Windows NSIS/MSI release configuration, `.rma` file association, Portable Mode routing, and version consistency validation.
- Added Help/About, runtime diagnostics, local model-manager placeholder, log folder access, keyboard shortcuts, and update-check readiness.
- Added first-launch wizard, cached-session recovery, expanded Settings, and searchable/pinnable/favoritable recent projects.

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
