import {
  Download,
  Ellipsis,
  FileCode2,
  TerminalSquare,
  Video,
} from "lucide-react";
import { Render } from "../../../../components/Render";
import { ActionMenu } from "../ActionMenu";
import { useBehavior, type DependencyRowProps } from "./behavior";
import {
  Actions,
  ComponentName,
  IconBox,
  InstallButton,
  MenuButton,
  Meta,
  Row,
  Status,
  StatusDot,
  UpdateStatus,
} from "./styles";

export function DependencyRow(props: DependencyRowProps) {
  const behavior = useBehavior(props);

  return (
    <Row>
      <ComponentName>
        <IconBox>
          <Render when={behavior.isFfmpeg}>
            <TerminalSquare aria-hidden="true" size={18} />
          </Render>
          <Render when={behavior.isWorker}>
            <FileCode2 aria-hidden="true" size={18} />
          </Render>
          <Render when={behavior.isYtDlp}>
            <Video aria-hidden="true" size={18} />
          </Render>
        </IconBox>
        <strong>{behavior.name}</strong>
      </ComponentName>
      <Status data-installed={behavior.isInstalled}>
        <StatusDot />
        {behavior.statusLabel}
      </Status>
      <Meta>{behavior.installedVersion}</Meta>
      <Meta>{behavior.platform}</Meta>
      <Meta>{behavior.sizeLabel}</Meta>
      <Actions data-settings-actions>
        <Render when={behavior.showMenu}>
          <MenuButton
            type="button"
            aria-label={behavior.menuButtonLabel}
            aria-expanded={behavior.menuOpen}
            onClick={behavior.onMenuClick}
          >
            <Ellipsis aria-hidden="true" size={18} />
          </MenuButton>
        </Render>
        <Render when={behavior.menuOpen}>
          <ActionMenu
            label={behavior.menuLabel}
            isDependency
            isModel={false}
            openFolderLabel={behavior.openFolderLabel}
            verifyLabel={behavior.verifyLabel}
            updatesLabel={behavior.updatesLabel}
            detailsLabel={behavior.detailsLabel}
            defaultLabel={behavior.defaultLabel}
            removeLabel={behavior.removeLabel}
            onOpenFolder={behavior.onOpenFolder}
            onVerify={behavior.onVerify}
            onCheckUpdates={behavior.onCheckUpdates}
            onDetails={behavior.onDetails}
            onSetDefault={behavior.onDetails}
            onRemove={behavior.onRemove}
          />
        </Render>
      </Actions>
      <Render when={behavior.showUpdateStatus}>
        <UpdateStatus data-verified={behavior.isVerified}>
          {behavior.updateLabel}
        </UpdateStatus>
      </Render>
      <Render when={behavior.canInstall}>
        <InstallButton
          type="button"
          disabled={behavior.installing}
          onClick={behavior.onInstall}
        >
          <Download aria-hidden="true" size={15} />
          {behavior.installLabel}
        </InstallButton>
      </Render>
    </Row>
  );
}
