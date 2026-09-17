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

## Incomplete Python installations

Setup checks installed package files against the sizes recorded in wheel metadata
before accepting the worker as ready. Missing or truncated libraries trigger
repair. Worker installation downloads fresh packages without reusing uv's cache
and copies their files into the environment, then checks file sizes and runs the
full worker healthcheck, including CTranslate2 and WhisperX imports, before
recording a successful worker installation.
This requires fresh downloads when reinstalling the worker.

The worker pins WhisperX 3.3.2 and CTranslate2 4.6.0. Older CTranslate2 Linux
wheels requested an executable stack and failed to import on glibc 2.41 and newer;
WhisperX 3.3.1 constrained installations to those affected versions. Existing
installations are refreshed through the worker version/source check at startup.

WhisperX 3.3.2 is explicitly pinned despite being yanked upstream for dependency
issues: it allows the corrected CTranslate2 with our pinned Torch 2.6 stack.
Versions 3.3.3 through 3.4.3 restore the incompatible CTranslate2 upper bound,
while 3.5.0 requires Torch 2.7.1 or newer. Validate the full healthcheck and model
inference when changing these pins; a WhisperX upgrade needs a coordinated
upgrade of the Torch stack.

If a subprocess crashes, the setup error includes its termination signal (such as
`SIGBUS`) and any output instead of reporting an exit code of `null`.
