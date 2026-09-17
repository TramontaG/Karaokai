# Changelog

## [1.1.1] - 2026-09-16

### Fixed

- Recover projects after AI processing failures when valid Demucs vocals and instrumental audio exist, preserving editable subtitles or creating an empty main subtitle track. Remove failed projects without valid stems.
- Prevent pending processing stages from trapping recovered projects on the preparation screen, including previously failed projects.
- Validate every runtime component before reporting setup success, handle interrupted downloads and disk errors, and prevent concurrent runtime installations and duplicate bootstrap calls.
- Verify write access to the selected data directory and save the model selected during onboarding as the default.
- Clean up export workers and encoders when windows close or renderers crash, and avoid sending progress events to unavailable frames.
- Stop video background composition at the final overlay frame and exclude gap tokens from exported subtitles.

### Dependencies

- Updated the processing worker to 0.4.13 with WhisperX 3.3.2 and CTranslate2 4.6.0 to address Linux native-library compatibility.

### Tests

- Added regression coverage for project recovery, bootstrap downloads, runtime installation concurrency, and export lifecycle failures.
- Expanded CI checks to Windows and Linux.

## [1.1.0] - 2026-09-15

### Added

- Metronome with volume control and saved preferences.
- Timeline markers for BPM and time signature changes, with placement, editing, movement, and deletion controls.
- Redo support alongside undo, preserving editor selection.
- Regression coverage for playback, timeline following, keyboard shortcuts, resource cleanup, musical timing, and runtime installation.

### Improved

- Smoother timeline following and more efficient subtitle updates during playback.
- Timeline scrolling, zooming, clip gestures, and keyboard input handling.
- Loading and preparation screens with installation progress and retry controls.
- Cleanup of event listeners and editor resources when leaving a screen.

### Fixed

- Setup crashes caused by incomplete Python libraries: validate installed package sizes, reinstall from fresh downloads, and verify native imports before marking the worker ready.
- Runtime errors now report termination signals instead of “exited with null”.
- Worker health checks now time out instead of leaving startup waiting indefinitely.

### Dependencies

- Updated the processing worker to 0.4.12 and PyTorch/TorchAudio to 2.6.0.

## [1.0.0]

- Initial stable desktop release with local karaoke editing, stem separation, synchronized subtitles, and Windows and Linux installers.

[1.1.1]: https://github.com/TramontaG/Karaokai/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/TramontaG/Karaokai/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/TramontaG/Karaokai/releases/tag/v1.0.0
