# Karaoke modes

Tracks save `karaokeMode`, independently of timeline geometry. Missing values use
Continuity and preserve legacy `animation.template` projects. Changing the mode
retains the track's styles, phrases, words, curves, and timings.

`src/util/karaoke/modes.ts` registers each mode's localized label, description and
renderer. Add a mode ID to `KaraokeMode` in the domain and register a component
accepting `{ track, currentTime }`. The editor and export use this same renderer.
Continuity retains its existing rendering path. Modes consume project data;
they must not change the timeline to obtain their visual layout.

Banner computes reference-space rectangles directly from word timestamps:

```
left  = anchor + (word.start - currentTime) / 1000 * pixelsPerSecond
right = anchor + (word.end   - currentTime) / 1000 * pixelsPerSecond
```

Time increases to the right; rectangles move to the left. X offsets position the
playhead and Y offsets position the lane. Existing position offsets are additive
across track, phrase and word. Colors inherit word → phrase → track → defaults.
Speed belongs to the track and defaults to 300. Banner font size defaults to 14
(reference at 640 px width) and inherits by scope; it changes labels independently
of rectangle height. The default palette is white text with timeline purple
rectangles and a subtle active-word highlight. Banner keeps separate read/unread
text colors from Continuity. Phrase-wide rounded clips affect only the outer
corners, leaving internal word boundaries square. Rectangle transparency (0–100%) applies only to the rectangle group, including
pause hatching. Each phrase casts a soft shadow from its combined rectangle
silhouette, following segment opacity without adding shadows between words. Internal segment boundaries use a
1.5 px translucent white divider, composited with the rectangle opacity.
Text and connecting lines remain opaque; rectangle transparency does not affect
the playhead. It fades in over 1000 ms before a segment starts and out over 1000 ms
after it ends, using a smoothstep curve driven by song time. Overlapping fade
windows use their maximum opacity, keeping it steady within phrases and joined
silences. Empty tracks and idle lanes have no persistent fallback marker. Long labels
can align to the actual left edge of their rectangle (the default) or stay
centered. This includes long text overflowing a short rectangle and sustained
words whose rectangle exceeds the available width after the playhead. This
alignment uses 10 px of left padding at the 640 px reference width (increasing
with font size), and does not pin labels to the viewport. Both options inherit by scope.
Labels use Continuity's black
text shadow, including labels lifted above the rectangles. SVG scales the same reference coordinates for preview
and export, including different output resolutions.

Banner builds visual runs from chronologically sorted phrases. Consecutive phrases
with gaps from 0 through 2000 ms share a rounded outline and shadow. A positive
short gap becomes a synthetic, hatched silence, inheriting the outgoing edge's
style; touching phrases simply join, retaining their internal divider. Gaps over
2000 ms and overlapping phrases start separate runs. Grouping uses valid word
bounds, like project normalization, but changes no project data, phrase IDs,
word timing, or timeline state. The shared Banner component uses these same runs
in preview and exported frames.

Canvas measures labels using their resolved fonts. The pure layout function
positions colliding labels above the rectangles and joins them with lines, without
changing rectangle boundaries. Layout does not depend on playback time, so seek,
reverse seek and frame rendering produce the same positions. Explicit gaps render as timed, hatched rectangles like the timeline, without
labels. They participate in phrase clipping and playhead styling, but never in
label collision layout. State intervals are half-open: start is current, end is read.

Validation:

- `npm test` includes exact boundaries, fractional times, speed, inheritance and collision cases.
- `npm run build` checks types and production bundling.
- `env -u ELECTRON_RUN_AS_NODE npx electron electron/tests/render-frames.cjs --banner`
  verifies encoded rectangle positions and state colors at 30/60 fps and 360p/1080p,
  with solid and video backgrounds. Omit `--banner` to check Continuity.
