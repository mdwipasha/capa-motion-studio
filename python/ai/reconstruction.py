from __future__ import annotations

from .models import PoseFrame


def build_motion_data(pose_frames: list[PoseFrame], fps: float) -> dict:
    """Create a retarget-free, .rma-compatible internal motion payload."""
    keyframes = [{"id": f"ai-{frame.frame}", "frame": frame.frame} for frame in pose_frames]
    return {
        "version": 1,
        "timeline": {"fps": min(60, max(1, round(fps))), "duration": pose_frames[-1].timestamp if pose_frames else 0, "keyframes": keyframes},
        "reconstruction": [{"frame": frame.frame, "timestamp": frame.timestamp, "jointPositions": [{"name": joint.name, "position": joint.position, "confidence": joint.confidence, "rotation": None} for joint in frame.joints]} for frame in pose_frames],
    }
