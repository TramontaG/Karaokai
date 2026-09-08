import { KeyRound, ShieldCheck } from "lucide-react";
import { Render } from "../../../../components/Render";
import { Field, Label } from "../../styles";
import { useBehavior } from "./behavior";
import {
  ActionButton,
  Actions,
  CookiesCard,
  CookiesCopy,
  CookiesInput,
  Status,
} from "./styles";

export function YoutubeCookies() {
  const behavior = useBehavior({});

  return (
    <CookiesCard>
      <CookiesCopy>
        <KeyRound aria-hidden="true" size={18} />
        <div>
          <strong>{behavior.title}</strong>
          <span>{behavior.description}</span>
        </div>
      </CookiesCopy>
      <Render when={behavior.available}>
        <Field>
          <Label htmlFor="youtube-cookies">{behavior.inputLabel}</Label>
          <CookiesInput
            id="youtube-cookies"
            value={behavior.value}
            onChange={behavior.onChange}
            placeholder={behavior.placeholder}
            spellCheck={false}
          />
        </Field>
        <Status>
          <ShieldCheck aria-hidden="true" size={15} />
          {behavior.privacy}
        </Status>
        <Render when={behavior.configured}>
          <Status data-configured="true">{behavior.configuredLabel}</Status>
        </Render>
        <Render when={behavior.loading}>
          <Status>{behavior.loadingLabel}</Status>
        </Render>
        <Render when={Boolean(behavior.error)}>
          <Status data-error="true">{behavior.error}</Status>
        </Render>
        <Actions>
          <ActionButton
            type="button"
            disabled={!behavior.canSave}
            onClick={behavior.onSave}
          >
            {behavior.actionLabel}
          </ActionButton>
          <Render when={behavior.configured}>
            <ActionButton
              type="button"
              data-secondary="true"
              disabled={behavior.saving}
              onClick={behavior.onRemove}
            >
              {behavior.removeLabel}
            </ActionButton>
          </Render>
        </Actions>
      </Render>
      <Render when={!behavior.available}>
        <Status>{behavior.unavailableLabel}</Status>
      </Render>
    </CookiesCard>
  );
}
