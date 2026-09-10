import {
  type AudioTrack,
  type BackgroundTrack,
  type KaraokeProject,
  type SubtitlePhrase,
  type SubtitleTrack,
  sortSubtitlePhrases,
} from "../../domain/project";

export function snapshotProject(project: KaraokeProject) {
  return structuredClone(project);
}

export const isSubtitleTrack = (
  track: KaraokeProject["tracks"][number] | null | undefined
): track is SubtitleTrack => track?.type === "subtitle";

export const isAudioTrack = (
  track: KaraokeProject["tracks"][number]
): track is AudioTrack => track.type === "audio";

export const isBackgroundTrack = (
  track: KaraokeProject["tracks"][number] | null | undefined
): track is BackgroundTrack => track?.type === "background";

export function replacePhrase(
  project: KaraokeProject,
  trackId: string,
  phraseId: string,
  nextPhrase: SubtitlePhrase
) {
  return {
    ...project,
    updatedAt: String(Date.now()),
    tracks: project.tracks.map((track) =>
      track.type !== "subtitle" || track.id !== trackId
        ? track
        : {
            ...track,
            phrases: sortSubtitlePhrases(
              track.phrases.map((phrase) =>
                phrase.id === phraseId ? nextPhrase : phrase
              )
            ),
          }
    ),
  };
}

export function movePhraseToSubtitleTrack(
  project: KaraokeProject,
  sourceTrackId: string,
  targetTrackId: string,
  phraseId: string,
  nextPhrase: SubtitlePhrase
) {
  return {
    ...project,
    updatedAt: String(Date.now()),
    tracks: project.tracks.map((track) => {
      if (track.type !== "subtitle") return track;
      if (track.id === sourceTrackId)
        return {
          ...track,
          phrases: track.phrases.filter((phrase) => phrase.id !== phraseId),
        };
      if (track.id === targetTrackId)
        return {
          ...track,
          phrases: sortSubtitlePhrases([...track.phrases, nextPhrase]),
        };
      return track;
    }),
  };
}
