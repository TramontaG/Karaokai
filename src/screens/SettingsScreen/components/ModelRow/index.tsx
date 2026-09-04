import { CloudDownload, Ellipsis, LoaderCircle } from "lucide-react";
import { Render } from "../../../../components/Render";
import { ActionMenu } from "../ActionMenu";
import { useBehavior, type ModelRowProps } from "./behavior";
import {
  ActionArea,
  DefaultBadge,
  DownloadButton,
  InstallProgress,
  MenuButton,
  MenuWrap,
  Meta,
  ModelName,
  ProgressFill,
  ProgressLabel,
  ProgressTrack,
  Row,
  SetDefaultButton,
  Status,
  StatusDot,
} from "./styles";

export function ModelRow(props: ModelRowProps) {
  const behavior = useBehavior(props);

  return (
    <Row>
      <ModelName>
        <CloudDownload aria-hidden="true" size={16} />
        <strong>{behavior.name}</strong>
      </ModelName>
      <Status
        data-installed={behavior.isInstalled}
        data-downloading={behavior.isDownloading}
      >
        <StatusDot />
        {behavior.statusLabel}
      </Status>
      <Meta>{behavior.backend}</Meta>
      <Meta>{behavior.sizeLabel}</Meta>
      <ActionArea>
        <Render when={behavior.isInstalled}>
          <MenuWrap data-settings-actions>
            <MenuButton
              type="button"
              aria-label={behavior.menuButtonLabel}
              aria-expanded={behavior.menuOpen}
              onClick={behavior.onMenuClick}
            >
              <Ellipsis aria-hidden="true" size={18} />
            </MenuButton>
            <Render when={behavior.menuOpen}>
              <ActionMenu
                label={behavior.menuLabel}
                isDependency={false}
                isModel
                openFolderLabel={behavior.openFolderLabel}
                verifyLabel={behavior.verifyLabel}
                updatesLabel={behavior.updatesLabel}
                detailsLabel={behavior.detailsLabel}
                defaultLabel={behavior.setDefaultLabel}
                removeLabel={behavior.removeLabel}
                onOpenFolder={behavior.onOpenFolder}
                onVerify={behavior.onVerify}
                onCheckUpdates={behavior.onVerify}
                onDetails={behavior.onDetails}
                onSetDefault={behavior.onSetDefault}
                onRemove={behavior.onRemove}
              />
            </Render>
          </MenuWrap>
          <Render when={behavior.isDefault}>
            <DefaultBadge>{behavior.defaultBadge}</DefaultBadge>
          </Render>
          <Render when={behavior.isNotDefault}>
            <SetDefaultButton type="button" onClick={behavior.onSetDefault}>
              {behavior.setDefaultLabel}
            </SetDefaultButton>
          </Render>
        </Render>
        <Render when={behavior.showDownloadButton}>
          <DownloadButton type="button" onClick={behavior.onDownloadClick}>
            {behavior.actionLabel}
          </DownloadButton>
        </Render>
        <Render when={behavior.showInstallProgress}>
          <InstallProgress
            role="progressbar"
            aria-label={behavior.progressAriaLabel}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={behavior.progress}
            aria-valuetext={behavior.progressLabel}
          >
            <ProgressLabel>
              <LoaderCircle aria-hidden="true" size={15} />
              {behavior.progressLabel}
            </ProgressLabel>
            <ProgressTrack aria-hidden="true">
              <ProgressFill $progress={behavior.progress} />
            </ProgressTrack>
          </InstallProgress>
        </Render>
      </ActionArea>
    </Row>
  );
}
