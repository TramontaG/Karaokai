import { ForEach } from "../ForEach";
import type { KaraokePreviewProps } from "../../util/karaoke/types";
import { useBehavior } from "./behavior";

export function TeleprompterKaraoke(props: KaraokePreviewProps) {
  const behavior = useBehavior(props);
  return (
    <svg
      style={behavior.style}
      viewBox={behavior.viewBox}
      preserveAspectRatio="none"
      data-karaoke-mode="teleprompter"
    >
      <defs>
        <ForEach
          data={behavior.words}
          idCompute={behavior.getWordId}
          render={behavior.renderClip}
        />
      </defs>
      <ForEach
        data={behavior.phrases}
        idCompute={behavior.getPhraseId}
        render={behavior.renderPhrase}
      />
    </svg>
  );
}
