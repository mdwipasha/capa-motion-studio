from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from .models import Joint

POSE_LANDMARK_NAMES = [
    "NOSE", "LEFT_EYE_INNER", "LEFT_EYE", "LEFT_EYE_OUTER", "RIGHT_EYE_INNER", "RIGHT_EYE", "RIGHT_EYE_OUTER",
    "LEFT_EAR", "RIGHT_EAR", "MOUTH_LEFT", "MOUTH_RIGHT", "LEFT_SHOULDER", "RIGHT_SHOULDER", "LEFT_ELBOW",
    "RIGHT_ELBOW", "LEFT_WRIST", "RIGHT_WRIST", "LEFT_PINKY", "RIGHT_PINKY", "LEFT_INDEX", "RIGHT_INDEX",
    "LEFT_THUMB", "RIGHT_THUMB", "LEFT_HIP", "RIGHT_HIP", "LEFT_KNEE", "RIGHT_KNEE", "LEFT_ANKLE",
    "RIGHT_ANKLE", "LEFT_HEEL", "RIGHT_HEEL", "LEFT_FOOT_INDEX", "RIGHT_FOOT_INDEX",
]


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
    def __init__(self, model_path: str | None = None) -> None:
        try:
            import cv2
            import mediapipe as mp
        except ImportError as error:
            raise RuntimeError("MediaPipe and OpenCV are required. Run: pip install -r python/requirements.txt") from error
        self.cv2 = cv2
        self.mp = mp
        self.mode = "solutions" if hasattr(mp, "solutions") else "tasks"
        self.latest_result: Any | None = None
        if self.mode == "solutions":
            self.pose = mp.solutions.pose.Pose(static_image_mode=True, model_complexity=1, enable_segmentation=False, min_detection_confidence=0.5)
            self.drawer = mp.solutions.drawing_utils
            self.connections = mp.solutions.pose.POSE_CONNECTIONS
            self.landmarks = mp.solutions.pose.PoseLandmark
            return
        if not model_path or not Path(model_path).is_file():
            raise RuntimeError("MediaPipe Tasks model is missing. Download the AI model from Help > AI Models before running Video to Animation.")
        from mediapipe.tasks import python
        from mediapipe.tasks.python import vision
        options = vision.PoseLandmarkerOptions(base_options=python.BaseOptions(model_asset_path=model_path), running_mode=vision.RunningMode.IMAGE, min_pose_detection_confidence=0.5)
        self.pose = vision.PoseLandmarker.create_from_options(options)

    def _result(self, frame_path: Path):
        image = self.cv2.imread(str(frame_path))
        if image is None:
            raise ValueError(f"Unable to read extracted frame: {frame_path.name}")
        if self.mode == "solutions":
            result = self.pose.process(self.cv2.cvtColor(image, self.cv2.COLOR_BGR2RGB))
        else:
            rgb = self.cv2.cvtColor(image, self.cv2.COLOR_BGR2RGB)
            result = self.pose.detect(self.mp.Image(image_format=self.mp.ImageFormat.SRGB, data=rgb))
        self.latest_result = result
        return image, result

    def detect(self, frame_path: Path) -> list[Joint]:
        _, result = self._result(frame_path)
        if self.mode == "solutions":
            if not result.pose_landmarks:
                return []
            return [Joint(landmark.name, (point.x, point.y, point.z), float(point.visibility)) for landmark, point in zip(self.landmarks, result.pose_landmarks.landmark)]
        if not result.pose_landmarks:
            return []
        return [Joint(POSE_LANDMARK_NAMES[index], (point.x, point.y, point.z), float(getattr(point, "visibility", 1.0))) for index, point in enumerate(result.pose_landmarks[0])]

    def draw_overlay(self, frame_path: Path, output_path: Path) -> None:
        image, result = self._result(frame_path)
        if self.mode == "solutions" and result.pose_landmarks:
            self.drawer.draw_landmarks(image, result.pose_landmarks, self.connections)
        elif self.mode == "tasks" and result.pose_landmarks:
            height, width = image.shape[:2]
            for point in result.pose_landmarks[0]:
                self.cv2.circle(image, (int(point.x * width), int(point.y * height)), 2, (52, 211, 153), -1)
        if not self.cv2.imwrite(str(output_path), image):
            raise RuntimeError("Unable to write pose preview image.")

    def close(self) -> None:
        self.pose.close()
