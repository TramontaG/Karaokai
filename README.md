# KaraokAI

A local-first desktop application that turns songs into karaoke projects: it separates vocals and instrumental tracks, transcribes lyrics with word-level timestamps, provides a visual timeline editor, and exports the result as a video.

> [!NOTE]
> Current version: `0.1.0-rc.4` — release candidate. The main workflow is functional; public Windows and macOS distribution still require their respective publishing and signing steps.

## What KaraokAI does

```text
Import a song or YouTube video
             ↓
Separate vocals and instrumental locally
             ↓
Transcribe and create synchronized subtitles
             ↓
Edit lyrics, timing, appearance, and background
             ↓
Export a karaoke video
```

Audio and video processing run on the user's computer. Internet access is only required to download the runtime and models on first use and, naturally, to import a YouTube video.

## Features

### Project creation and processing

- local file import (`.mp3`, `.wav`, `.flac`, `.m4a`, `.aac`, and `.ogg`);
- YouTube video import, preserving the video as the project's background;
- optional YouTube cookies for cases where the platform requires authentication;
- local vocal and instrumental separation with Demucs;
- vocal transcription with word-level timestamps;
- explicit pause tokens between words, preserved in both the project and timeline;
- progress for every processing stage: import, separation, transcription, and subtitle generation.

### Karaoke editor

- multiple subtitle tracks, as well as audio and background tracks;
- phrase and word text editing directly from the side panel;
- insert, remove, and edit words and pauses;
- automatic splitting of multiple words entered into one item, distributing its duration proportionally to word length;
- phrase splitting with the `S` shortcut or the split tool, using the word boundary nearest the cursor;
- horizontal phrase dragging and movement between tracks;
- `Ctrl`-dragging words to redistribute timing without leaving empty space in a phrase;
- timeline zoom with `Ctrl` + scroll, BPM/offset grid, and optional playback following;
- undo and redo history for edits;
- track, phrase, and word styling: font, weight, italic, underline, superscript/subscript, scale, position, and read colors;
- animation curves and inter-phrase transitions;
- video, image, album-art, solid-color, and gradient backgrounds with `cover` and `contain` modes;
- user-imported fonts;
- project thumbnails generated from the editor preview.

### Library and export

- project library in grid or list view;
- rename, duplicate, delete, open the project folder, and reopen projects;
- project and asset persistence in the selected data directory;
- video export from 480p to 1440p, at 30 or 60 FPS, with instrumental/vocals/mix audio modes and H.264 presets;
- render progress, safe cancellation, and editing lock while a video is being generated.

## Technology

| Layer      | Technologies                                 |
| ---------- | -------------------------------------------- |
| Desktop    | Electron, Node.js                            |
| Interface  | React 19, TypeScript, Vite                   |
| Styling    | Emotion Styled                               |
| Navigation | TanStack Router                              |
| Processing | Python 3.11, PyTorch, Demucs, faster-whisper |
| Media      | FFmpeg, yt-dlp                               |

## Local runtime

The application bundle does not include Python, models, or large binaries. On first use, the Runtime Manager installs everything in the selected data directory without modifying the system Python, `PATH`, or Windows Registry.

| Component | Source                                         |
| --------- | ---------------------------------------------- |
| `uv`      | Official Astral release, verified with SHA-256 |
| Python    | Private installation managed by `uv`           |
| ML Worker | PyPI and the official PyTorch wheel index      |
| FFmpeg    | `imageio-ffmpeg` wheel from PyPI               |
| yt-dlp    | PyPI                                           |
| Whisper   | Pinned revisions from Hugging Face             |
| Demucs    | Meta's model repository                        |

Models, runtime components, and cache can be checked, removed, or reinstalled from Settings. See [docs/runtime-installation.md](docs/runtime-installation.md) for details.

## Development

### Prerequisites

- Node.js 22 LTS;
- npm.

### Installation

```bash
git clone git@github.com:TramontaG/Karaokai.git
cd Karaokai
npm install
```

### Run in development

```bash
npm run dev
```

This command starts Vite and the Electron window.

### Commands

| Command                       | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `npm run dev`                 | Runs Electron with Vite in development mode              |
| `npm run dev:web`             | Runs only the Vite frontend                              |
| `npm run build`               | Type-checks and generates the web bundle                 |
| `npm run build:desktop`       | Packages targets for the current platform                |
| `npm run build:windows`       | Builds the Windows x64 NSIS installer                    |
| `npm run build:windows:store` | Builds the Microsoft Store AppX package on Windows 10/11 |
| `npm run format`              | Formats the repository with Prettier                     |
| `npm run format:check`        | Checks formatting without changing files                 |

Artifacts are written to `release/`.

## Distribution

| Platform        | Current target      | Status                                                                                   |
| --------------- | ------------------- | ---------------------------------------------------------------------------------------- |
| Linux           | AppImage and `.deb` | Packaging validated                                                                      |
| Windows x64     | NSIS `.exe`         | Packaging validated; unsigned for closed RC distribution                                 |
| Microsoft Store | AppX                | Configured; requires a Partner Center account and reserved identity                      |
| macOS           | DMG                 | Configured; requires a macOS build, signing, and notarization before public distribution |

Before submitting to the Microsoft Store, reserve the app name in Partner Center and replace `appx.identityName` in `electron-builder.yml` with the exact value supplied by Microsoft. The `appx` target is the Store package format supported by electron-builder; Microsoft signs the published package.

## Privacy

- audio, stems, projects, and renders stay on the device;
- there is no telemetry, advertising, or mandatory song upload;
- runtime and model downloads are stored only in the selected data directory;
- YouTube imports use the network to retrieve video information and download the video;
- all managed data can be removed from Settings.

## License and third-party software

KaraokAI is free software licensed under the
[GNU General Public License v3.0 or later](LICENSE). Third-party components
remain subject to their own licenses; see
[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Read
[PRIVACY.md](PRIVACY.md) and [CONTENT_RIGHTS.md](CONTENT_RIGHTS.md) before
importing or publishing media.

## Repository structure

```text
Karaokai/
├── src/                  # React UI, editor, and renderer services
├── electron/             # Main process, IPC, rendering, and runtime
├── worker/               # Python separation and transcription worker
├── docs/                 # Technical documentation
├── src-tauri/            # Previous implementation, kept temporarily
├── electron-builder.yml  # Build targets and packaging configuration
└── projectDefinition.md  # Technical and product specification
```

## Additional documentation

- [Runtime installation](docs/runtime-installation.md)
- [Technical and product specification](projectDefinition.md)
