import { FileMusic, FolderOpen, Link2 } from "lucide-react";
import { Render } from "../Render";
import { useBehavior } from "./behavior";
import {
  ChooseFile,
  CloseYoutubeDialog,
  DropArea,
  DropTitle,
  FileInput,
  FormatText,
  ImportError,
  ImportShell,
  InputShell,
  Separator,
  SeparatorLine,
  YoutubeDownloadDialog,
  YoutubeDownloadOverlay,
  YoutubeDownloadSpinner,
  YoutubeButton,
  YoutubeForm,
  YoutubeInput,
} from "./styles";

export function ImportPanel() {
  const behavior = useBehavior({});

  return (
    <ImportShell>
      <Render when={behavior.youtubeDialogOpen}>
        <YoutubeDownloadOverlay>
          <YoutubeDownloadDialog
            role="alertdialog"
            aria-modal="true"
            aria-label={behavior.youtubeDownloading}
          >
            <Render when={behavior.isYoutubeImporting}>
              <YoutubeDownloadSpinner aria-hidden="true" />
            </Render>
            <strong>{behavior.youtubeDialogTitle}</strong>
            <Render when={behavior.youtubeDialogDismissible}>
              <>
                <ImportError role="alert">
                  {behavior.youtubeDialogError}
                </ImportError>
                <CloseYoutubeDialog
                  type="button"
                  onClick={behavior.onCloseYoutubeError}
                >
                  {behavior.closeYoutubeDialog}
                </CloseYoutubeDialog>
              </>
            </Render>
          </YoutubeDownloadDialog>
        </YoutubeDownloadOverlay>
      </Render>
      <DropArea onDragOver={behavior.onDragOver} onDrop={behavior.onDrop}>
        <FileInput
          ref={behavior.fileInputRef}
          aria-label={behavior.fileInputLabel}
          type="file"
          accept={behavior.acceptedFiles}
          onChange={behavior.onFileChange}
        />
        <FileMusic aria-hidden="true" size={54} strokeWidth={1.45} />
        <DropTitle>{behavior.dropTitle}</DropTitle>
        <FormatText>{behavior.supportedFormats}</FormatText>
        <ChooseFile type="button" onClick={behavior.onChooseFile}>
          <FolderOpen aria-hidden="true" size={18} />
          {behavior.fileActionLabel}
        </ChooseFile>
      </DropArea>
      <Render when={() => behavior.error !== null}>
        <ImportError role="alert">{behavior.error}</ImportError>
      </Render>
      <Separator>
        <SeparatorLine />
        <span>{behavior.separator}</span>
        <SeparatorLine />
      </Separator>
      <YoutubeForm onSubmit={behavior.onYoutubeSubmit}>
        <InputShell>
          <Link2 aria-hidden="true" size={18} />
          <YoutubeInput
            aria-label={behavior.youtubeInputLabel}
            type="url"
            placeholder={behavior.youtubePlaceholder}
            value={behavior.youtubeUrl}
            onChange={behavior.onYoutubeUrlChange}
            disabled={behavior.isImporting}
            required
          />
        </InputShell>
        <YoutubeButton type="submit" disabled={behavior.isImporting}>
          {behavior.youtubeActionLabel}
        </YoutubeButton>
      </YoutubeForm>
    </ImportShell>
  );
}
