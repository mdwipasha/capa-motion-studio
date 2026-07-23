# CapaMotion Local AI Backend

The AI pipeline is a local HTTP service only. It never uploads video or pose data to a cloud API.

## Setup

```bash
python -m pip install -r python/requirements.txt
pnpm ai
```

FFmpeg and `ffprobe` must be available on `PATH`. The frontend calls `http://127.0.0.1:8765` and reports a clear error when this service is not running.

## Pipeline

1. Validate an MP4, MOV, or AVI video and read metadata with FFprobe.
2. Extract image frames with FFmpeg.
3. Run the `PoseDetector` abstraction using `MediaPipePoseDetector`.
4. Build retarget-free internal Motion Data containing per-frame joint positions, confidence, and placeholder rotation values.
5. Return a skeleton-overlay preview and data compatible with the next retargeting iteration.

The server has cancellable in-memory jobs and removes its temporary source/frame workspace on completion, cancellation, or failure.
