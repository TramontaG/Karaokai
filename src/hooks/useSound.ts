import { useCallback } from "react";
import { useAppContext } from "./useAppContext";
export function useSound() {
  const [data, setData] = useAppContext();
  const setSoundEnabled = useCallback(
    (soundEnabled: boolean) => setData({ preferences: { soundEnabled } }),
    [setData]
  );
  return { soundEnabled: data.preferences.soundEnabled, setSoundEnabled };
}
