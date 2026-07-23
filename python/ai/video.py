from __future__ import annotations

import json
import shutil
import subprocess
import time
from pathlib import Path

from .models import VideoMetadata

SUPPORTED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi"}


def require_supported_video(path: Path) -> None:
    if not path.is_file():
        raise ValueError("The selected video file is unavailable.")
    if path.suffix.lower() not in SUPPORTED_VIDEO_EXTENSIONS:
        raise ValueError("Unsupported video format. Use MP4, MOV, or AVI.")


def _run(command: list[str], cancel_event: object | None = None) -> subprocess.CompletedProcess[str]:
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    while process.poll() is None:
        if cancel_event is not None and getattr(cancel_event, "is_set")():
            process.terminate()
            process.wait(timeout=3)
            raise RuntimeError("Pipeline cancelled by user.")
        time.sleep(0.1)
    stdout, stderr = process.communicate()
    if process.returncode != 0:
        raise RuntimeError(stderr.strip() or "FFmpeg command failed.")
    return subprocess.CompletedProcess(command, process.returncode, stdout, stderr)


def read_metadata(path: Path) -> VideoMetadata:
    require_supported_video(path)
    if shutil.which("ffprobe") is None:
        raise RuntimeError("ffprobe was not found. Install FFmpeg and add it to PATH.")
    result = _run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate,nb_frames,duration", "-of", "json", str(path)])
    streams = json.loads(result.stdout).get("streams", [])
    if not streams:
        raise ValueError("The video has no readable video stream.")
    stream = streams[0]
    numerator, denominator = str(stream.get("avg_frame_rate", "0/1")).split("/", 1)
    fps = float(numerator) / max(float(denominator), 1.0)
    duration = float(stream.get("duration") or 0)
    total_frames = int(stream.get("nb_frames") or round(fps * duration))
    if fps <= 0 or duration <= 0 or total_frames <= 0:
        raise ValueError("The video metadata is incomplete or corrupt.")
    return VideoMetadata(int(stream["width"]), int(stream["height"]), fps, duration, total_frames)


def extract_frames(video_path: Path, output_dir: Path, cancel_event: object | None = None) -> list[Path]:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg was not found. Install FFmpeg and add it to PATH.")
    output_dir.mkdir(parents=True, exist_ok=True)
    _run(["ffmpeg", "-y", "-i", str(video_path), "-vsync", "0", str(output_dir / "frame_%06d.png")], cancel_event)
    frames = sorted(output_dir.glob("frame_*.png"))
    if not frames:
        raise RuntimeError("FFmpeg did not extract any frames.")
    return frames
