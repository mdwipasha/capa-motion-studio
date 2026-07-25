from __future__ import annotations

import json
import logging
import os
import shutil
import tempfile
import threading
import uuid
from dataclasses import dataclass, field
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from ai.pipeline import run_pipeline
from ai.video import read_metadata, require_supported_video

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s: %(message)s")
logger = logging.getLogger("capamotion.server")


@dataclass
class Job:
    id: str
    cancel_event: threading.Event = field(default_factory=threading.Event)
    step: str = "queued"
    progress: int = 0
    current_frame: int = 0
    message: str = "Queued"
    result: dict | None = None
    error: str | None = None
    metadata: dict | None = None

    def status(self) -> dict:
        return {"id": self.id, "step": self.step, "progress": self.progress, "currentFrame": self.current_frame, "message": self.message, "result": self.result, "error": self.error, "isFinished": self.result is not None or self.error is not None}


JOBS: dict[str, Job] = {}
JOBS_LOCK = threading.Lock()


def run_job(job: Job, source_path: Path, workspace: Path, model_path: str | None = None) -> None:
    def update(step: str, progress: int, current_frame: int, message: str) -> None:
        job.step, job.progress, job.current_frame, job.message = step, progress, current_frame, message
        logger.info("job=%s step=%s progress=%s frame=%s", job.id, step, progress, current_frame)
    try:
        job.result = run_pipeline(source_path, workspace, job.cancel_event, update, detector_factory=lambda: __import__("ai.pose", fromlist=["MediaPipePoseDetector"]).MediaPipePoseDetector(model_path))
    except Exception as error:
        job.error = str(error)
        job.step = "cancelled" if job.cancel_event.is_set() else "failed"
        job.message = job.error
    finally:
        source_path.unlink(missing_ok=True)


class ApiHandler(BaseHTTPRequestHandler):
    def _send_json(self, status: HTTPStatus, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        # The service binds only to loopback; allow Vite and Tauri local origins.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-File-Name, X-AI-Model-Path")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self._send_json(HTTPStatus.OK, {})

    def do_GET(self) -> None:
        if self.path == "/api/health":
            self._send_json(HTTPStatus.OK, {"ok": True, "service": "capa-motion-ai"})
            return
        if self.path.startswith("/api/jobs/"):
            job_id = self.path.removeprefix("/api/jobs/")
            with JOBS_LOCK:
                job = JOBS.get(job_id)
            if not job:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Job not found."})
                return
            self._send_json(HTTPStatus.OK, job.status())
            return
        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found."})

    def do_POST(self) -> None:
        if self.path == "/api/pipeline/run":
            self._start_pipeline()
            return
        if self.path.startswith("/api/jobs/") and self.path.endswith("/cancel"):
            job_id = self.path.removeprefix("/api/jobs/").removesuffix("/cancel")
            with JOBS_LOCK:
                job = JOBS.get(job_id)
            if not job:
                self._send_json(HTTPStatus.NOT_FOUND, {"error": "Job not found."})
                return
            job.cancel_event.set()
            self._send_json(HTTPStatus.OK, {"message": "Cancellation requested."})
            return
        self._send_json(HTTPStatus.NOT_FOUND, {"error": "Endpoint not found."})

    def _start_pipeline(self) -> None:
        file_name = Path(self.headers.get("X-File-Name", "video.mp4")).name
        try:
            if Path(file_name).suffix.lower() not in {".mp4", ".mov", ".avi"}:
                raise ValueError("Unsupported video format. Use MP4, MOV, or AVI.")
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0:
                raise ValueError("The selected video file is empty.")
            workspace = Path(tempfile.mkdtemp(prefix="capamotion-ai-"))
            source_path = workspace / file_name
            source_path.write_bytes(self.rfile.read(length))
            require_supported_video(source_path)
            metadata = read_metadata(source_path)
            model_path = self.headers.get("X-AI-Model-Path") or os.environ.get("CAPAMOTION_AI_MODEL_PATH")
            job = Job(uuid.uuid4().hex)
            job.metadata = {"width": metadata.width, "height": metadata.height, "fps": metadata.fps, "duration": metadata.duration, "total_frames": metadata.total_frames}
            with JOBS_LOCK:
                JOBS[job.id] = job
            threading.Thread(target=run_job, args=(job, source_path, workspace, model_path), daemon=True).start()
            self._send_json(HTTPStatus.ACCEPTED, {"jobId": job.id, "metadata": job.metadata})
        except (ValueError, OSError) as error:
            self._send_json(HTTPStatus.BAD_REQUEST, {"error": str(error)})

    def log_message(self, format: str, *args: object) -> None:
        logger.info("%s - %s", self.address_string(), format % args)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8765), ApiHandler)
    logger.info("CapaMotion AI server listening on http://127.0.0.1:8765")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping AI server")
    finally:
        server.server_close()
