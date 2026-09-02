import enUS from "./locales/en-US.json";
import ptBR from "./locales/pt-BR.json";

export const languagePacks = {
  "pt-BR": ptBR,
  "en-US": enUS satisfies Record<keyof typeof ptBR, string>,
} as const;
export type Language = keyof typeof languagePacks;
export type TranslationKey = keyof typeof ptBR;
export const languages: readonly Language[] = ["pt-BR", "en-US"];

export function translate(
  language: Language,
  key: TranslationKey,
  values: Record<string, string> = {}
) {
  return languagePacks[language][key].replace(
    /\{(\w+)\}/g,
    (_, name: string) => values[name] ?? `{${name}}`
  );
}
