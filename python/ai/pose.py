from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path

from .models import Joint


class PoseDetector(ABC):
    @abstractmethod
    def detect(self, frame_path: Path) -> list[Joint]:
        """Return normalized joints for one image frame."""

    @abstractmethod
    def draw_overlay(self, frame_path: Path, output_path: Path) -> None:
        """Write a visual skeleton overlay for one frame."""

    def close(self) -> None:
        pass


class MediaPipePoseDetector(PoseDetector):
    def __init__(self) -> None:
        try:
            import cv2
            import mediapipe as mp
        except ImportError as error:
            raise RuntimeError("MediaPipe and OpenCV are required. Run: pip install -r python/requirements.txt") from error
        self.cv2 = cv2
        self.mp = mp
        self.pose = mp.solutions.pose.Pose(static_image_mode=True, model_complexity=1, enable_segmentation=False, min_detection_confidence=0.5)
        self.drawer = mp.solutions.drawing_utils
        self.connections = mp.solutions.pose.POSE_CONNECTIONS
        self.landmarks = mp.solutions.pose.PoseLandmark

    def _result(self, frame_path: Path):
        image = self.cv2.imread(str(frame_path))
        if image is None:
            raise ValueError(f"Unable to read extracted frame: {frame_path.name}")
        return image, self.pose.process(self.cv2.cvtColor(image, self.cv2.COLOR_BGR2RGB))

    def detect(self, frame_path: Path) -> list[Joint]:
        _, result = self._result(frame_path)
        if not result.pose_landmarks:
            return []
        return [Joint(landmark.name, (point.x, point.y, point.z), float(point.visibility)) for landmark, point in zip(self.landmarks, result.pose_landmarks.landmark)]

    def draw_overlay(self, frame_path: Path, output_path: Path) -> None:
        image, result = self._result(frame_path)
        if result.pose_landmarks:
            self.drawer.draw_landmarks(image, result.pose_landmarks, self.connections)
        if not self.cv2.imwrite(str(output_path), image):
            raise RuntimeError("Unable to write pose preview image.")

    def close(self) -> None:
        self.pose.close()
