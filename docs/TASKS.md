# TASKS.md

# Capa Motion Studio Roadmap


## Completed


## Phase 1 — Motion Editor

### Project Setup

* [x] Setup Tauri 2
* [x] Setup React
* [x] Setup TypeScript
* [x] Setup Tailwind CSS
* [x] Setup Three.js
* [x] Setup Python

---

### Project System

* [x] Create Project
* [x] Open Project
* [x] Save Project
* [x] Recent Projects
* [x] Versioned .rma Project File
* [x] Save As and Restore Editor State
* [x] Autosave and Project Settings

---

### Rig

* [x] Support R6
* [x] Support R15
* [x] Rig Selector

---

### Editor

* [x] Timeline
* [x] Play
* [x] Pause
* [x] Stop
* [x] Keyframe
* [x] Bone Selection
* [x] Bone Rotation
* [x] Undo
* [x] Redo

---

### Preview

* [x] Camera Control
* [x] Animation Preview

---

### Import / Export

* [ ] Import FBX
* [x] Export FBX
* [x] Modular Import Architecture
* [x] Modular Export Architecture

---

## Phase 2 — AI Motion

* [x] Import Video
* [x] Pose Detection
* [x] Motion Reconstruction
* [x] Generate Draft Animation
* [x] Motion Cleanup
* [x] Apply to Timeline

---

## Phase 3 — AI Tools

* [ ] Text to Motion
* [ ] Motion Library
* [ ] Auto Loop
* [ ] Animation Templates

---

## Phase 4 — Release & Distribution

* [x] Windows NSIS Release Configuration
* [x] Windows MSI Release Configuration
* [x] .rma File Association Configuration
* [x] Version Consistency Guard
* [x] Help, About, and Keyboard Shortcut Viewer
* [x] AI Model Manager Placeholder
* [x] Local Runtime Check
* [x] Local Logging and Log Folder Access
* [x] Crash Recovery Prompt
* [x] Portable Mode
* [x] First Launch Wizard
* [x] Recent Project Search, Pin, and Favorite
* [ ] Signed GitHub Release Updater Endpoint
* [ ] Published GitHub Release Artifacts

---

## Phase 5 â€” Stabilization Fixes

* [x] Interactive Move / Rotate / Scale gizmo
* [x] Position and scale pose data per keyframe
* [x] Transform-aware Undo / Redo shortcuts
* [x] Ctrl + Y redo shortcut
* [x] Ctrl + C / Ctrl + V transform copy-paste shortcut
* [x] Delete / Backspace selected keyframe shortcut
* [x] Keyframe selection immediately syncs transform readback
* [x] Downloadable MediaPipe Pose Landmarker model
* [x] Hide Video to Animation until AI model is installed
* [x] Automatic AI service startup when a local runtime is available
* [x] FFmpeg extraction progress no longer stalls at 15%
* [x] MediaPipe Tasks detector fallback
* [x] Upright retarget root and torso mapping
* [x] Binary FBX 7.4 animation-only export
* [x] FBX rest-pose local transforms and global bind-pose matrices
* [x] R6/R15 skeleton hierarchy validation (R15: 16 bones)
* [x] FBX translation and rotation curves (scale curves only when animated)
* [x] ASCII FBX animation curve import
* [ ] Bundled no-Python AI runtime sidecar
* [ ] Binary FBX import
* [ ] Mesh-preserving FBX import
