import {
  BrainCircuit,
  Database,
  Info,
  Monitor,
  Package,
  Settings2,
  Trash2,
} from "lucide-react";
import { Render } from "../../components/Render";
import { useBehavior } from "./behavior";
import { DependenciesTab } from "./components/DependenciesTab";
import { ModelsTab } from "./components/ModelsTab";
import {
  AboutGrid,
  DangerButton,
  DangerCopy,
  DangerZone,
  Field,
  FormGrid,
  Label,
  Page,
  PageDescription,
  PageHeader,
  PageTitle,
  Panel,
  PanelDescription,
  PanelTitle,
  Select,
  StoragePath,
  Tab,
  Tabs,
  Toggle,
  ToggleLabel,
} from "./styles";

export function SettingsScreen() {
  const behavior = useBehavior({});

  return (
    <Page>
      <PageHeader>
        <PageTitle>{behavior.title}</PageTitle>
        <PageDescription>{behavior.description}</PageDescription>
      </PageHeader>
      <Tabs aria-label={behavior.tabsLabel}>
        <Tab
          type="button"
          data-active={behavior.dependenciesActive}
          aria-pressed={behavior.dependenciesActive}
          onClick={behavior.onShowDependencies}
        >
          <Package aria-hidden="true" size={18} />
          {behavior.dependenciesTab}
        </Tab>
        <Tab
          type="button"
          data-active={behavior.modelsActive}
          aria-pressed={behavior.modelsActive}
          onClick={behavior.onShowModels}
        >
          <BrainCircuit aria-hidden="true" size={18} />
          {behavior.modelsTab}
        </Tab>
        <Tab
          type="button"
          data-active={behavior.generalActive}
          aria-pressed={behavior.generalActive}
          onClick={behavior.onShowGeneral}
        >
          <Settings2 aria-hidden="true" size={18} />
          {behavior.generalTab}
        </Tab>
        <Tab
          type="button"
          data-active={behavior.appearanceActive}
          aria-pressed={behavior.appearanceActive}
          onClick={behavior.onShowAppearance}
        >
          <Monitor aria-hidden="true" size={18} />
          {behavior.appearanceTab}
        </Tab>
        <Tab
          type="button"
          data-active={behavior.storageActive}
          aria-pressed={behavior.storageActive}
          onClick={behavior.onShowStorage}
        >
          <Database aria-hidden="true" size={18} />
          {behavior.storageTab}
        </Tab>
        <Tab
          type="button"
          data-active={behavior.aboutActive}
          aria-pressed={behavior.aboutActive}
          onClick={behavior.onShowAbout}
        >
          <Info aria-hidden="true" size={18} />
          {behavior.aboutTab}
        </Tab>
      </Tabs>
      <Render when={behavior.dependenciesActive}>
        <DependenciesTab />
      </Render>
      <Render when={behavior.modelsActive}>
        <ModelsTab />
      </Render>
      <Render when={behavior.generalActive}>
        <Panel>
          <PanelTitle>{behavior.generalTitle}</PanelTitle>
          <PanelDescription>{behavior.generalDescription}</PanelDescription>
          <FormGrid>
            <Field>
              <Label htmlFor="language">{behavior.languageLabel}</Label>
              <Select
                id="language"
                value={behavior.language}
                onChange={behavior.onLanguageChange}
              >
                <option value="pt-BR">{behavior.portuguese}</option>
                <option value="en-US">{behavior.english}</option>
              </Select>
            </Field>
            <ToggleLabel>
              <Toggle
                type="checkbox"
                checked={behavior.soundEnabled}
                onChange={behavior.onSoundChange}
              />
              {behavior.soundLabel}
            </ToggleLabel>
          </FormGrid>
        </Panel>
      </Render>
      <Render when={behavior.appearanceActive}>
        <Panel>
          <PanelTitle>{behavior.appearanceTitle}</PanelTitle>
          <PanelDescription>{behavior.appearanceDescription}</PanelDescription>
          <FormGrid>
            <Field>
              <Label htmlFor="theme">{behavior.themeLabel}</Label>
              <Select
                id="theme"
                value={behavior.themePreference}
                onChange={behavior.onThemeChange}
              >
                <option value="system">{behavior.system}</option>
                <option value="light">{behavior.light}</option>
                <option value="dark">{behavior.dark}</option>
              </Select>
            </Field>
          </FormGrid>
        </Panel>
      </Render>
      <Render when={behavior.storageActive}>
        <Panel>
          <PanelTitle>{behavior.storageTitle}</PanelTitle>
          <PanelDescription>{behavior.storageDescription}</PanelDescription>
          <StoragePath>
            <span>{behavior.storagePathLabel}</span>
            <strong>{behavior.storagePath}</strong>
          </StoragePath>
          <DangerZone>
            <Trash2 aria-hidden="true" size={22} />
            <DangerCopy>
              <strong>{behavior.dangerTitle}</strong>
              <span>{behavior.dangerDescription}</span>
            </DangerCopy>
            <DangerButton type="button" onClick={behavior.onRemoveDownloads}>
              {behavior.removeDownloadsLabel}
            </DangerButton>
          </DangerZone>
        </Panel>
      </Render>
      <Render when={behavior.aboutActive}>
        <Panel>
          <PanelTitle>{behavior.aboutTitle}</PanelTitle>
          <PanelDescription>{behavior.aboutDescription}</PanelDescription>
          <AboutGrid>
            <span>{behavior.versionLabel}</span>
            <strong>{behavior.version}</strong>
            <span>{behavior.privacyLabel}</span>
          </AboutGrid>
        </Panel>
      </Render>
    </Page>
  );
}
