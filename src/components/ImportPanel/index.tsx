import { FileMusic, FolderOpen, Link2 } from "lucide-react";
import { Render } from "../Render";
import { useBehavior } from "./behavior";
import {
  ChooseFile,
  DropArea,
  DropTitle,
  FileInput,
  FormatText,
  ImportError,
  ImportShell,
  InputShell,
  Separator,
  SeparatorLine,
  YoutubeButton,
  YoutubeForm,
  YoutubeInput,
} from "./styles";

export function ImportPanel() {
  const behavior = useBehavior({});

  return (
    <ImportShell>
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
          {behavior.isImporting ? "…" : behavior.chooseFile}
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
          />
        </InputShell>
        <YoutubeButton type="submit">{behavior.download}</YoutubeButton>
      </YoutubeForm>
    </ImportShell>
  );
}
