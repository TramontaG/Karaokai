# Runtime installation

The KaraokAI application bundle does not contain or redistribute Python, FFmpeg, machine-learning libraries, or model weights. The first-run Runtime Manager downloads and installs the required components into the data directory selected by the user.

## Installation sources

- `uv` is downloaded from a pinned official Astral GitHub Release and verified with its published SHA-256;
- a pinned CPython build is installed and managed by `uv` without consulting or modifying the system Python;
- the KaraokAI virtual environment is populated from PyPI and the official PyTorch CPU wheel index;
- `imageio-ffmpeg` supplies the platform-specific FFmpeg binary from its PyPI wheel;
- HTDemucs weights are downloaded by Demucs from Meta's model repository;
- faster-whisper models are downloaded from pinned Hugging Face revisions.

Only KaraokAI's own small worker protocol source is bundled as an application resource. Before installation it is copied to the user's writable runtime directory; no third-party package or model is included with it.

## Local layout

```text
KaraokAI/
├── runtime/
│   ├── tools/uv
│   ├── python/
│   ├── python-environment/
│   ├── worker-source/
│   └── ffmpeg/ffmpeg
├── models/
│   ├── demucs/
│   └── whisper/
├── cache/
└── config/runtime-state.json
```

The installer never updates the user's `PATH`, never uses the system Python, and never registers its managed Python globally. Removing downloaded data deletes the runtime, models, and caches under this directory.
