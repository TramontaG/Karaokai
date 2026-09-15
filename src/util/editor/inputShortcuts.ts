const singleLineInputTypes = new Set([
  "text",
  "number",
  "search",
  "email",
  "password",
  "tel",
  "url",
]);

// Field editing owns its keys, including Delete, Backspace and native undo.
// Return true even for controls that do not need an Enter commit (e.g. selects).
export function handleEditorInputKeyDown(event: KeyboardEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return false;
  const input = target.closest("input");
  const editing =
    Boolean(target.closest("input, textarea, select")) ||
    (target instanceof HTMLElement && target.isContentEditable);
  if (!editing) return false;
  if (
    input &&
    singleLineInputTypes.has(input.type) &&
    event.key === "Enter" &&
    !event.defaultPrevented &&
    !event.isComposing &&
    event.keyCode !== 229 &&
    !event.repeat &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.altKey &&
    !event.shiftKey
  ) {
    event.preventDefault();
    input.blur();
  }
  return true;
}
