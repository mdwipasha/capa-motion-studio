from __future__ import annotations

import base64
import logging
import shutil
from pathlib import Path
from threading import Event
from typing import Callable

from .models import PoseFrame, as_json
from .pose import MediaPipePoseDetector, PoseDetector
from .reconstruction import build_motion_data
from .video import extract_frames, read_metadata

logger = logging.getLogger("capamotion.ai")


def run_pipeline(video_path: Path, workspace: Path, cancel_event: Event, update: Callable[[str, int, int, str], None], detector_factory: Callable[[], PoseDetector] = MediaPipePoseDetector) -> dict:
    try:
        update("loading_video", 5, 0, "Reading video metadata")
        metadata = read_metadata(video_path)
        update("extracting_frames", 15, 0, "Extracting frames with FFmpeg")
        frames = extract_frames(video_path, workspace / "frames", cancel_event, lambda percent: update("extracting_frames", 15 + int(percent * 0.2), 0, f"Extracting frames with FFmpeg {percent}%"))
        detector: PoseDetector = detector_factory()
        poses: list[PoseFrame] = []
        try:
            for index, frame_path in enumerate(frames):
                if cancel_event.is_set():
                    raise RuntimeError("Pipeline cancelled by user.")
                joints = detector.detect(frame_path)
                poses.append(PoseFrame(index, index / metadata.fps, joints))
                progress = 35 + int((index + 1) / len(frames) * 50)
                update("detecting_pose", progress, index + 1, f"Detecting pose {index + 1}/{len(frames)}")
            overlay_path = workspace / "pose_overlay.png"
            detector.draw_overlay(frames[0], overlay_path)
        finally:
            detector.close()
        update("building_motion", 90, len(frames), "Building internal Motion Data")
        motion_data = build_motion_data(poses, metadata.fps)
        preview = base64.b64encode((workspace / "pose_overlay.png").read_bytes()).decode("ascii")
        original = base64.b64encode(frames[0].read_bytes()).decode("ascii")
        update("finished", 100, len(frames), "Pipeline completed")
        return {"video": as_json(metadata), "motionData": motion_data, "poseFrames": [as_json(frame) for frame in poses], "originalDataUrl": f"data:image/png;base64,{original}", "overlayDataUrl": f"data:image/png;base64,{preview}"}
    except Exception:
        logger.exception("AI pipeline failed")
        raise
    finally:
        shutil.rmtree(workspace, ignore_errors=True)
