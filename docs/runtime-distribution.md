# Runtime distribution

GitHub Releases in `TramontaG/Karaokai` is the initial distribution channel for runtime assets.

Each runtime release publishes a `runtime-manifest.json` and the archives referenced by it. The application must only activate an archive after its SHA-256 and size match the manifest.

## Initial setup contract

The first-run installer obtains these assets from the runtime release:

- `ffmpeg-<platform>-<architecture>.zip` → `runtime/ffmpeg`;
- `ml-worker-<platform>-<architecture>.zip` → `runtime/workers`;
- `demucs-htdemucs-any-any.zip` → `models/demucs/htdemucs`;

Whisper models are not mirrored in GitHub Releases. The Model Manager downloads Tiny, Base, Small, Medium and Large-v3 from their official Hugging Face repositories. A model definition must pin its repository revision and verify the downloaded content before activation.

The release workflow produces the manifest from the final archives. It is the source of truth for the filename, platform, architecture, byte size and SHA-256 of every asset.

## Publishing

The application version `0.1.x` resolves the pinned runtime tag `runtime-v0.1.1`. Push that tag to start the publishing workflow, or run **Publish runtime assets** manually with the same value. The job packages each worker/static-FFmpeg pair, smoke-tests the worker, obtains HTDemucs, generates the manifest and creates the matching GitHub Release.

The manifest and every archive must remain attached to that immutable tag. A new runtime must use a new tag and update the pin in the application; existing release assets must not be replaced in place.

Do not mark an application release as production-ready until the corresponding runtime release has completed successfully and the generated archives have been smoke-tested on each target operating system.
