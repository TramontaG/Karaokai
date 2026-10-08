# Changelog

## [1.3.0] - 2026-10-08

### Added

- Identify imported songs using MP3 metadata or AcoustID, confirm artist and title, and look up synchronized lyrics from LRCLIB before transcription. Users can provide their own lyrics when no match is available.
- Align confirmed lyrics to vocals with WhisperX, including phrase-level fine alignment in the editor and a retry action when transcription fails.
- Delete projects from the library with a confirmation dialog.
- Prefill track information during import and support moving phrases between subtitle tracks.

### Improved

- Queue lyric alignment until stem separation completes and show clearer preparation progress and lookup errors.
- Improve timeline beat and time-signature snapping, phrase dragging, playback behavior, and background video synchronization.
- Keep Book mode fade-ins in timeline order after wrapping, while showing phrases by their reading start.

### Tests

- Add coverage for track lookup, MP3 metadata, queued lyrics, phrase alignment, project deletion, import, track prefill, timeline gestures, and preparation flows.

## [1.2.0] - 2026-09-28

### Added

- Banner karaoke mode with timestamp-accurate word rectangles, a configurable playhead, speed, font size, state colors, rectangle transparency, shadows, and word separators.
- Book karaoke mode with compact stacked phrases, fixed reading positions, automatic page capacity, and cyclic replacements that wait for enough space.
- Teleprompter karaoke mode with continuous scrolling, smoothly varying speed across phrase boundaries, and configurable X/Y reading anchors.
- A shared karaoke mode registry for switching between Continuity, Banner, Book, and Teleprompter without changing project phrases or timeline geometry.

### Improved

- Banner renders explicit pauses and joins consecutive phrases with gaps of up to two seconds, preserves phrase-wide rounded corners, and accommodates long labels with padding and collision handling.
- Banner playhead fades in and out over one second around active content.
- Book pages appear together three seconds before singing resumes after long pauses, with phrase fades and anticipation cues only at the first entry or after a pause of at least four seconds.
- Teleprompter scrolls through short pauses, reaches the reading anchor exactly at each phrase start, and handles long pauses with coordinated scroll entrances and exits.
- Preview and exported frames share mode renderers, inherited text styling, word timing curves, and deterministic positions when seeking.

### Fixed

- Prevent taller Book replacements from moving other visible phrases or overlapping occupied space.
- Expand read-color clipping for accented and italic glyphs in Book and Teleprompter, and paint completed words without clipping to prevent unread remnants.

### Tests

- Added layout and timing coverage for Banner, Book, and Teleprompter, including pauses, text bounds, stable positions, anchor offsets, continuous scroll velocity, and deterministic seeking.
- Expanded encoded-frame checks for karaoke modes and accented/italic text at 30/60 fps and 360p/1080p with solid and video backgrounds.

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

[1.3.0]: https://github.com/TramontaG/Karaokai/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/TramontaG/Karaokai/compare/v1.1.1...v1.2.0
[1.1.1]: https://github.com/TramontaG/Karaokai/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/TramontaG/Karaokai/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/TramontaG/Karaokai/releases/tag/v1.0.0
