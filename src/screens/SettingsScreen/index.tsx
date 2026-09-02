import { useBehavior } from "./behavior";
import { Field, Label, Panel, Select, Toggle } from "./styles";
export function SettingsScreen() {
  const behavior = useBehavior({});
  return (
    <Panel>
      <h1>{behavior.title}</h1>
      <p>{behavior.description}</p>
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
      <Label>
        <Toggle
          type="checkbox"
          checked={behavior.soundEnabled}
          onChange={behavior.onSoundChange}
        />
        {behavior.soundLabel}
      </Label>
      <button onClick={behavior.onRemoveDownloads}>
        {behavior.removeDownloadsLabel}
      </button>
    </Panel>
  );
}
