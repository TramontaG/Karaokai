import { useEffect, useState } from "react";
import { useAppContext } from "./useAppContext";
import { loadSubtitleFonts } from "../services/subtitleFonts";

export function useSubtitleFonts() {
  const [data] = useAppContext();
  const [ready, setReady] = useState(false);
  const fontsKey = JSON.stringify(data.preferences.customFonts);

  useEffect(() => {
    let disposed = false;
    setReady(false);
    void loadSubtitleFonts(data.preferences.customFonts)
      .catch(() => undefined)
      .finally(() => {
        if (!disposed) setReady(true);
      });
    return () => {
      disposed = true;
    };
  }, [fontsKey]);

  return ready;
}
