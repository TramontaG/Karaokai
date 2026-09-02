import json
import sys

import ctranslate2
import demucs
import faster_whisper
import torch
import torchaudio
import whisperx


def emit(payload: dict) -> None:
    print(json.dumps(payload), flush=True)


def healthcheck() -> None:
    packages = [
        "ctranslate2",
        "demucs",
        "faster-whisper",
        "torch",
        "torchaudio",
        "whisperx",
    ]
    emit(
        {
            "status": "ready",
            "workerVersion": "0.1.0",
            "dependencies": packages,
        }
    )


def main() -> None:
    if "--healthcheck" in sys.argv:
        healthcheck()
        return

    for line in sys.stdin:
        request = json.loads(line)
        emit(
            {
                "jobId": request.get("jobId"),
                "type": "job.failed",
                "error": {
                    "code": "WORKER_PIPELINE_NOT_IMPLEMENTED",
                    "stage": "worker",
                    "recoverable": False,
                },
            }
        )


if __name__ == "__main__":
    main()
