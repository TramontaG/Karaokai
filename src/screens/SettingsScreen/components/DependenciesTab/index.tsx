import { CheckCircle2, CircleAlert, RefreshCw } from "lucide-react";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { DetailsModal } from "../DetailsModal";
import { useBehavior } from "./behavior";
import {
  CheckupButton,
  CheckupResult,
  DetailsGrid,
  DetailsRow,
  DetailsStatus,
  Panel,
  PanelDescription,
  PanelHeader,
  PanelTitle,
  RuntimeList,
} from "./styles";

export function DependenciesTab() {
  const behavior = useBehavior({});

  return (
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>{behavior.title}</PanelTitle>
          <PanelDescription>{behavior.description}</PanelDescription>
        </div>
        <CheckupButton
          type="button"
          disabled={behavior.checking}
          data-checking={behavior.checking}
          onClick={behavior.onRunCheckup}
        >
          <RefreshCw aria-hidden="true" size={16} />
          {behavior.checkupLabel}
        </CheckupButton>
      </PanelHeader>
      <Render when={behavior.hasCheckupResult}>
        <CheckupResult>
          <CheckCircle2 aria-hidden="true" size={16} />
          {behavior.checkupResult}
        </CheckupResult>
      </Render>
      <Render when={behavior.hasError}>
        <CheckupResult data-variant="error">{behavior.error}</CheckupResult>
      </Render>
      <RuntimeList>
        <ForEach
          data={behavior.components}
          idCompute={behavior.getComponentId}
          render={behavior.renderComponent}
        />
      </RuntimeList>
      <Render when={behavior.detailsOpen}>
        <DetailsModal
          title={behavior.selectedName}
          closeLabel={behavior.closeLabel}
          onClose={behavior.onCloseDetails}
        >
          <DetailsGrid>
            <DetailsRow>
              <span>{behavior.installedVersionLabel}</span>
              <strong>{behavior.installedVersion}</strong>
            </DetailsRow>
            <DetailsRow>
              <span>{behavior.availableVersionLabel}</span>
              <strong>{behavior.availableVersion}</strong>
            </DetailsRow>
            <DetailsRow>
              <span>{behavior.platformLabel}</span>
              <strong>{behavior.platform}</strong>
            </DetailsRow>
            <DetailsRow>
              <span>{behavior.sizeLabel}</span>
              <strong>{behavior.size}</strong>
            </DetailsRow>
            <DetailsRow>
              <span>{behavior.installedAtLabel}</span>
              <strong>{behavior.installedAt}</strong>
            </DetailsRow>
            <DetailsRow>
              <span>{behavior.checksumLabel}</span>
              <strong>{behavior.checksum}</strong>
            </DetailsRow>
            <DetailsRow>
              <span>{behavior.statusLabel}</span>
              <DetailsStatus data-verified={behavior.detailsVerified}>
                <Render when={behavior.detailsVerified}>
                  <CheckCircle2 aria-hidden="true" size={15} />
                </Render>
                <Render when={behavior.detailsNotVerified}>
                  <CircleAlert aria-hidden="true" size={15} />
                </Render>
                {behavior.status}
              </DetailsStatus>
            </DetailsRow>
          </DetailsGrid>
        </DetailsModal>
      </Render>
    </Panel>
  );
}
