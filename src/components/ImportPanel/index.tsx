import { FileMusic, FolderOpen, Link2 } from "lucide-react";
import { useBehavior } from "./behavior";
import {
  ChooseFile,
  DropArea,
  DropTitle,
  FileInput,
  FormatText,
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
      <DropArea>
        <FileInput
          aria-label={behavior.fileInputLabel}
          type="file"
          accept={behavior.acceptedFiles}
        />
        <FileMusic aria-hidden="true" size={54} strokeWidth={1.45} />
        <DropTitle>{behavior.dropTitle}</DropTitle>
        <FormatText>{behavior.supportedFormats}</FormatText>
        <ChooseFile>
          <FolderOpen aria-hidden="true" size={18} />
          {behavior.chooseFile}
        </ChooseFile>
      </DropArea>
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
