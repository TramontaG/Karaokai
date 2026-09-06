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

export function RenderScreen() {
  const behavior = useBehavior({});
  return (
    <PreviewCanvas
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
              </CurrentPhrase>
            </Render>
            <Render when={preview.showEntryCue}>
              <EntryCue style={preview.entryCueStyle}>
                <EntryCueBar>
                  <EntryCueBarFill />
                </EntryCueBar>
              </EntryCue>
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
              </NextPhrase>
            </Render>
          </SubtitlePreview>
        )}
      />
    </PreviewCanvas>
  );
}
