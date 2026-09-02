import { open } from "@tauri-apps/plugin-dialog";
import { isTauri } from "@tauri-apps/api/core";

export async function selectStorageDirectory() {
  if (!isTauri()) {
    return null;
  }

  const selected = await open({ directory: true, multiple: false });
  return typeof selected === "string" ? selected : null;
}
