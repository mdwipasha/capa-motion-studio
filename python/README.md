# CapaMotion Local AI Backend

The AI pipeline is a local HTTP service only. It never uploads video or pose data to a cloud API.

## Setup

```bash
python -m pip install -r python/requirements.txt
pnpm ai
```

FFmpeg and `ffprobe` must be available on `PATH` for development. Release builds use a downloadable AI runtime sidecar containing `capamotion-ai.exe`, `ffmpeg.exe`, and `ffprobe.exe`, so end users do not need to install Python or FFmpeg manually.

## Build sidecar runtime

```powershell
pnpm ai:runtime -- -FfmpegDir C:\path\to\ffmpeg\bin
```

This creates `dist-ai-runtime/capamotion-ai-runtime-windows-x64.zip`. Publish it to the URL configured by `CAPAMOTION_AI_RUNTIME_URL` before building the Tauri installer.

## Pipeline

1. Validate an MP4, MOV, or AVI video and read metadata with FFprobe.
2. Extract image frames with FFmpeg.
3. Run the `PoseDetector` abstraction using `MediaPipePoseDetector`.
4. Build retarget-free internal Motion Data containing per-frame joint positions, confidence, and placeholder rotation values.
5. Return a skeleton-overlay preview and data compatible with the next retargeting iteration.

The server has cancellable in-memory jobs and removes its temporary source/frame workspace on completion, cancellation, or failure.
