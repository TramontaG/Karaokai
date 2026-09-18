import { ForEach } from "../ForEach";
import { useBehavior, type KaraokePreviewProps } from "./behavior";
export function BannerKaraoke(props: KaraokePreviewProps) {
  const behavior = useBehavior(props);
  return (
    <svg
      style={behavior.style}
      viewBox={behavior.viewBox}
      preserveAspectRatio="none"
      data-karaoke-mode="banner"
    >
      <defs>
        <pattern
          id={behavior.gapPatternId}
          patternUnits="userSpaceOnUse"
          width="5"
          height="5"
          patternTransform={behavior.gapPatternTransform}
        >
          <rect width="2" height="5" fill="white" fillOpacity="0.18" />
        </pattern>
        <ForEach
          data={behavior.groups}
          idCompute={behavior.getGroupId}
          render={behavior.renderGroupClip}
        />
      </defs>
      <ForEach
        data={behavior.groups}
        idCompute={behavior.getGroupId}
        render={behavior.renderGroupRectangles}
      />
      <ForEach
        data={behavior.words}
        idCompute={behavior.getWordId}
        render={behavior.renderWord}
      />
      <ForEach
        data={behavior.markers}
        idCompute={behavior.getMarkerId}
        render={behavior.renderMarker}
      />
    </svg>
  );
}
