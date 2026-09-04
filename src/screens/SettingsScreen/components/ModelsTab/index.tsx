import { AudioLines, BrainCircuit } from "lucide-react";
import { ForEach } from "../../../../components/ForEach";
import { Render } from "../../../../components/Render";
import { DetailsModal } from "../DetailsModal";
import { useBehavior } from "./behavior";
import {
  Backend,
  DetailRow,
  DetailsGrid,
  Group,
  GroupHeader,
  Panel,
  PanelDescription,
  PanelTitle,
} from "./styles";

export function ModelsTab() {
  const behavior = useBehavior({});

  return (
    <Panel>
      <PanelTitle>{behavior.title}</PanelTitle>
      <PanelDescription>{behavior.description}</PanelDescription>
      <Group>
        <GroupHeader>
          <AudioLines aria-hidden="true" size={20} />
          {behavior.whisperTitle}
        </GroupHeader>
        <ForEach
          data={behavior.whisperModels}
          idCompute={behavior.getModelId}
          render={behavior.renderModel}
        />
      </Group>
      <Group>
        <GroupHeader>
          <BrainCircuit aria-hidden="true" size={20} />
          {behavior.demucsTitle}
        </GroupHeader>
        <ForEach
          data={behavior.demucsModels}
          idCompute={behavior.getModelId}
          render={behavior.renderModel}
        />
      </Group>
      <Render when={behavior.detailsOpen}>
        <DetailsModal
          title={behavior.selectedName}
          closeLabel={behavior.closeLabel}
          onClose={behavior.onCloseDetails}
        >
          <DetailsGrid>
            <DetailRow>
              <span>{behavior.selectedTypeLabel}</span>
              <strong>{behavior.selectedType}</strong>
            </DetailRow>
            <DetailRow>
              <span>{behavior.selectedSizeLabel}</span>
              <strong>{behavior.selectedSize}</strong>
            </DetailRow>
            <DetailRow>
              <span>{behavior.selectedAccuracyLabel}</span>
              <strong>{behavior.selectedAccuracy}</strong>
            </DetailRow>
            <DetailRow>
              <span>{behavior.selectedSpeedLabel}</span>
              <strong>{behavior.selectedSpeed}</strong>
            </DetailRow>
            <DetailRow>
              <span>{behavior.selectedVramLabel}</span>
              <strong>{behavior.selectedVram}</strong>
            </DetailRow>
            <DetailRow>
              <span>{behavior.selectedLanguagesLabel}</span>
              <strong>{behavior.selectedLanguages}</strong>
            </DetailRow>
            <DetailRow>
              <span>{behavior.selectedPathLabel}</span>
              <strong>{behavior.selectedPath}</strong>
            </DetailRow>
            <Backend>
              <span>{behavior.backendLabel}</span>
              <strong>{behavior.selectedBackend}</strong>
            </Backend>
          </DetailsGrid>
        </DetailsModal>
      </Render>
    </Panel>
  );
}
