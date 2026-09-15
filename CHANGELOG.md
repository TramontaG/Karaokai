# Changelog

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

[1.1.0]: https://github.com/TramontaG/Karaokai/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/TramontaG/Karaokai/releases/tag/v1.0.0
