from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Any


@dataclass(frozen=True)
class VideoMetadata:
    width: int
    height: int
    fps: float
    duration: float
    total_frames: int


@dataclass(frozen=True)
class Joint:
    name: str
    position: tuple[float, float, float]
    confidence: float


@dataclass(frozen=True)
class PoseFrame:
    frame: int
    timestamp: float
    joints: list[Joint]


def as_json(value: Any) -> Any:
    if hasattr(value, "__dataclass_fields__"):
        return asdict(value)
    raise TypeError(f"Cannot serialize {type(value)!r}")
