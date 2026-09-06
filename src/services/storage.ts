import { chooseDirectory, isDesktop } from "./desktop";

export async function selectStorageDirectory() {
  if (!isDesktop()) {
    return null;
  }

  return chooseDirectory();
}
