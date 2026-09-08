import condensedSource from "../assets/fonts/KaraokAICondensed.ttf";
import condensedBoldSource from "../assets/fonts/KaraokAICondensed-Bold.ttf";
import condensedBoldItalicSource from "../assets/fonts/KaraokAICondensed-BoldItalic.ttf";
import condensedItalicSource from "../assets/fonts/KaraokAICondensed-Italic.ttf";
import monoSource from "../assets/fonts/KaraokAIMono.ttf";
import monoBoldSource from "../assets/fonts/KaraokAIMono-Bold.ttf";
import monoBoldItalicSource from "../assets/fonts/KaraokAIMono-BoldItalic.ttf";
import monoItalicSource from "../assets/fonts/KaraokAIMono-Italic.ttf";
import sansSource from "../assets/fonts/KaraokAISans.ttf";
import sansBoldSource from "../assets/fonts/KaraokAISans-Bold.ttf";
import sansBoldItalicSource from "../assets/fonts/KaraokAISans-BoldItalic.ttf";
import sansItalicSource from "../assets/fonts/KaraokAISans-Italic.ttf";
import serifSource from "../assets/fonts/KaraokAISerif.ttf";
import serifBoldSource from "../assets/fonts/KaraokAISerif-Bold.ttf";
import serifBoldItalicSource from "../assets/fonts/KaraokAISerif-BoldItalic.ttf";
import serifItalicSource from "../assets/fonts/KaraokAISerif-Italic.ttf";
import type { CustomFontPreference } from "../config/userPreferences";
import { readFontFile } from "./desktop";

export interface SubtitleFontOption {
  id: string;
  name: string;
}

const bundledFonts = [
  { id: "KaraokAI Sans", name: "KaraokAI Sans" },
  { id: "KaraokAI Serif", name: "KaraokAI Serif" },
  { id: "KaraokAI Mono", name: "KaraokAI Mono" },
  { id: "KaraokAI Condensed", name: "KaraokAI Condensed" },
] as const;

const bundledFaces = [
  ["KaraokAI Sans", sansSource, {}],
  ["KaraokAI Sans", sansBoldSource, { weight: "700" }],
  ["KaraokAI Sans", sansItalicSource, { style: "italic" }],
  ["KaraokAI Sans", sansBoldItalicSource, { weight: "700", style: "italic" }],
  ["KaraokAI Serif", serifSource, {}],
  ["KaraokAI Serif", serifBoldSource, { weight: "700" }],
  ["KaraokAI Serif", serifItalicSource, { style: "italic" }],
  ["KaraokAI Serif", serifBoldItalicSource, { weight: "700", style: "italic" }],
  ["KaraokAI Mono", monoSource, {}],
  ["KaraokAI Mono", monoBoldSource, { weight: "700" }],
  ["KaraokAI Mono", monoItalicSource, { style: "italic" }],
  ["KaraokAI Mono", monoBoldItalicSource, { weight: "700", style: "italic" }],
  ["KaraokAI Condensed", condensedSource, {}],
  ["KaraokAI Condensed", condensedBoldSource, { weight: "700" }],
  ["KaraokAI Condensed", condensedItalicSource, { style: "italic" }],
  [
    "KaraokAI Condensed",
    condensedBoldItalicSource,
    { weight: "700", style: "italic" },
  ],
] as const satisfies ReadonlyArray<
  readonly [string, string, FontFaceDescriptors]
>;

const loadedFonts = new Set<string>();

export function subtitleFontOptions(customFonts: CustomFontPreference[]) {
  return [
    ...bundledFonts.map(({ id, name }) => ({ id, name })),
    ...customFonts.map(({ id, name }) => ({ id, name })),
  ];
}

async function loadFont(
  id: string,
  source: string | ArrayBuffer,
  descriptors: FontFaceDescriptors = {}
) {
  const key = `${id}:${descriptors.weight ?? "400"}:${descriptors.style ?? "normal"}`;
  if (loadedFonts.has(key)) return;
  const face = new FontFace(id, source, descriptors);
  await face.load();
  document.fonts.add(face);
  loadedFonts.add(key);
}

export async function loadSubtitleFonts(customFonts: CustomFontPreference[]) {
  await Promise.all(
    bundledFaces.map(([id, source, descriptors]) =>
      loadFont(id, `url(${source})`, descriptors)
    )
  );
  await Promise.all(
    customFonts.map(async (font) => {
      const bytes = await readFontFile(font.path);
      if (!bytes) return;
      await loadFont(font.id, bytes.buffer);
    })
  );
}
