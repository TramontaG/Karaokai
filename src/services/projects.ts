import { invokeDesktop, isDesktop } from "./desktop";
import { type KaraokeProject } from "../domain/project";

const browserKey = "karaokai.projects";

export interface ProcessingModels {
  whisperModelId: string;
  demucsModelId: string;
}
export interface ProjectSummary {
  id: string;
  name: string;
  duration: number;
  createdAt: string;
  updatedAt: string;
  processing: KaraokeProject["processing"];
}

export interface ProjectAudioSources {
  instrumental: string | null;
  vocals: string | null;
}

function browserProjects() {
  try {
    return JSON.parse(
      localStorage.getItem(browserKey) ?? "[]"
    ) as KaraokeProject[];
  } catch {
    return [];
  }
}

export async function createLocalProject(
  sourcePath: string,
  storageDirectory: string | null,
  models: ProcessingModels
) {
  if (isDesktop()) {
    return invokeDesktop<KaraokeProject>("create_local_project", {
      sourcePath,
      storageDirectory,
      ...models,
    });
  }

  const now = new Date().toISOString();
  const fileName = sourcePath.split(/[\\/]/).pop() ?? "Untitled";
  const project: KaraokeProject = {
    version: 1,
    id: crypto.randomUUID(),
    name: fileName.replace(/\.[^.]+$/, ""),
    createdAt: now,
    updatedAt: now,
    duration: 0,
    tempo: {
      bpm: 120,
      offset: 0,
    },
    tracks: [
      {
        id: "background-main",
        type: "background",
        name: "Background",
        visible: true,
        locked: false,
        zIndex: -10,
      },
      {
        id: "audio-main",
        type: "audio",
        name: "Instrumental",
        visible: true,
        locked: false,
        zIndex: 0,
        source: sourcePath,
        volume: 1,
        muted: false,
      },
    ],
    processing: [
      { id: "import", status: "completed" },
      { id: "separation", status: "pending" },
      { id: "transcription", status: "pending" },
      { id: "subtitles", status: "pending" },
    ],
  };
  localStorage.setItem(
    browserKey,
    JSON.stringify([project, ...browserProjects()])
  );
  return project;
}

export async function loadProject(id: string, storageDirectory: string | null) {
  if (isDesktop())
    return invokeDesktop<KaraokeProject>("load_project", {
      projectId: id,
      storageDirectory,
    });
  return browserProjects().find((project) => project.id === id) ?? null;
}

export async function projectAudioSources(
  id: string,
  storageDirectory: string | null
) {
  if (isDesktop()) {
    return invokeDesktop<ProjectAudioSources>("project_audio_sources", {
      projectId: id,
      storageDirectory,
    });
  }
  return { instrumental: null, vocals: null };
}

export async function readProjectAudio(sourceId: string) {
  if (!isDesktop()) return new ArrayBuffer(0);
  return invokeDesktop<ArrayBuffer>("read_project_audio", { sourceId });
}

export async function listProjects(storageDirectory: string | null) {
  if (isDesktop()) {
    return invokeDesktop<ProjectSummary[]>("list_projects", {
      storageDirectory,
    });
  }
  return browserProjects().map(
    ({ id, name, duration, createdAt, updatedAt, processing }) => ({
      id,
      name,
      duration,
      createdAt,
      updatedAt,
      processing,
    })
  );
}

export async function saveProject(
  project: KaraokeProject,
  storageDirectory: string | null
) {
  if (isDesktop())
    return invokeDesktop<void>("save_project", { project, storageDirectory });
  localStorage.setItem(
    browserKey,
    JSON.stringify(
      browserProjects().map((item) => (item.id === project.id ? project : item))
    )
  );
}

export async function deleteProject(
  id: string,
  storageDirectory: string | null
) {
  if (isDesktop()) {
    return invokeDesktop<void>("delete_project", {
      projectId: id,
      storageDirectory,
    });
  }
  localStorage.setItem(
    browserKey,
    JSON.stringify(browserProjects().filter((project) => project.id !== id))
  );
}
