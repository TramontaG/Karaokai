import { ForEach } from "../../components/ForEach";
import { Render } from "../../components/Render";
import {
  CurrentPhrase,
  EntryCue,
  EntryCueBar,
  EntryCueBarFill,
  NextPhrase,
  PreviewBackground,
  PreviewCanvas,
  PreviewWord,
  PreviewWordFill,
  SubtitlePreview,
} from "../EditorScreen/styles";
import { useBehavior } from "./behavior";
import { FrameStamp } from "./styles";

export function RenderScreen() {
  const behavior = useBehavior({});
  return (
    <PreviewCanvas
      style={behavior.canvasStyle}
      data-render-preview="true"
      data-render-video-overlay={behavior.videoCompositedByEncoder}
    >
      <PreviewBackground style={behavior.backgroundStyle}>
        <Render when={behavior.hasBackgroundImage}>
          <img
            src={behavior.backgroundSource}
            alt=""
            onLoad={behavior.onBackgroundLoad}
          />
        </Render>
      </PreviewBackground>
      <ForEach
        data={behavior.previews}
        idCompute={(preview) => preview.id}
        render={(preview) => (
          <SubtitlePreview style={preview.containerStyle}>
            <Render when={preview.showCurrentPhrase}>
              <CurrentPhrase style={preview.currentStyle}>
                <ForEach
                  data={preview.words}
                  idCompute={(word) => word.id}
                  render={(word) => (
                    <PreviewWord
                      $unreadColor={word.unreadColor}
                      $scale={word.scale}
                      $fontFamily={word.fontFamily}
                      $fontWeight={word.fontWeight}
                      $fontStyle={word.fontStyle}
                      $textDecoration={word.textDecoration}
                      $verticalAlign={word.verticalAlign}
                      $offsetX={word.offsetX}
                      $offsetY={word.offsetY}
                    >
                      {word.text}
                      <PreviewWordFill
                        $progress={word.progress}
                        $readColor={word.readColor}
                      >
                        {word.text}
                      </PreviewWordFill>
                    </PreviewWord>
                  )}
                />
                <Render
                  when={
                    preview.showEntryCue &&
                    preview.entryCuePhraseId ===
                      preview.timing.primaryPhrase?.id
                  }
                >
                  <EntryCue style={preview.entryCueStyle}>
                    <EntryCueBar>
                      <EntryCueBarFill />
                    </EntryCueBar>
                  </EntryCue>
                </Render>
              </CurrentPhrase>
            </Render>
            <Render when={preview.showNextPhrase}>
              <NextPhrase style={preview.nextPhraseStyle}>
                <ForEach
                  data={preview.secondaryWords}
                  idCompute={(word) => word.id}
                  render={(word) => (
                    <PreviewWord
                      $unreadColor={word.unreadColor}
                      $scale={word.scale}
                      $fontFamily={word.fontFamily}
                      $fontWeight={word.fontWeight}
                      $fontStyle={word.fontStyle}
                      $textDecoration={word.textDecoration}
                      $verticalAlign={word.verticalAlign}
                      $offsetX={word.offsetX}
                      $offsetY={word.offsetY}
                    >
                      {word.text}
                      <PreviewWordFill
                        $progress={word.progress}
                        $readColor={word.readColor}
                      >
                        {word.text}
                      </PreviewWordFill>
                    </PreviewWord>
                  )}
                />
                <Render
                  when={
                    preview.showEntryCue &&
                    preview.entryCuePhraseId ===
                      preview.timing.secondaryPhrase?.id
                  }
                >
                  <EntryCue style={preview.entryCueStyle}>
                    <EntryCueBar>
                      <EntryCueBarFill />
                    </EntryCueBar>
                  </EntryCue>
                </Render>
              </NextPhrase>
            </Render>
          </SubtitlePreview>
        )}
      />
      <FrameStamp style={behavior.frameStampStyle} aria-hidden="true" />
    </PreviewCanvas>
  );
}
