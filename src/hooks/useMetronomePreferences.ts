import { useAppContext } from "./useAppContext";

export function useMetronomePreferences() {
  const [data, setData] = useAppContext();
  return {
    metronomeEnabled: data.preferences.metronomeEnabled,
    metronomeVolume: data.preferences.metronomeVolume,
    setMetronomeEnabled: (metronomeEnabled: boolean) =>
      setData({ preferences: { metronomeEnabled } }),
    setMetronomeVolume: (metronomeVolume: number) => {
      if (!Number.isFinite(metronomeVolume)) return;
      setData({
        preferences: {
          metronomeVolume: Math.max(0, Math.min(100, metronomeVolume)),
        },
      });
    },
  };
}
