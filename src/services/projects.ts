import { invokeDesktop, isDesktop } from "./desktop";
import { createProjectThumbnail, type KaraokeProject } from "../domain/project";

const browserKey = "karaokai.projects";

export interface ProcessingModels {
  whisperModelId: string;
  demucsModelId: string;
}
export interface ProjectSummary {
  id: string;
  name: string;
  duration: number;
  sizeBytes: number;
  thumbnail?: string | null;
  createdAt: string;
  updatedAt: string;
  processing: KaraokeProject["processing"];
}

export async function renameProject(
  id: string,
  name: string,
  storageDirectory: string | null
) {
  if (isDesktop()) {
    await invokeDesktop<void>("rename_project", {
      projectId: id,
      name,
      storageDirectory,
    });
    return;
  }
  const project = await loadProject(id, storageDirectory);
  if (!project) throw new Error("Project does not exist.");
  await saveProject(
    { ...project, name, updatedAt: String(Date.now()) },
    storageDirectory
  );
}

export async function duplicateProject(
  id: string,
  storageDirectory: string | null
) {
  if (isDesktop()) {
    return invokeDesktop<KaraokeProject>("duplicate_project", {
      projectId: id,
      storageDirectory,
    });
  }
  const project = await loadProject(id, storageDirectory);
  if (!project) throw new Error("Project does not exist.");
  const now = new Date().toISOString();
  const duplicate = {
    ...project,
    id: crypto.randomUUID(),
    name: `${project.name} (copy)`,
    createdAt: now,
    updatedAt: now,
  };
  localStorage.setItem(
    browserKey,
    JSON.stringify([duplicate, ...browserProjects()])
  );
  return duplicate;
}

export function openProjectFolder(id: string, storageDirectory: string | null) {
  if (!isDesktop()) return Promise.resolve();
  return invokeDesktop<void>("open_project_folder", {
    projectId: id,
    storageDirectory,
  });
}

export interface ProjectAudioSources {
  instrumental: string | null;
  vocals: string | null;
}
export interface ProjectRenderOptions {
  projectId: string;
  storageDirectory: string | null;
  outputPath: string;
  width: number;
  height: number;
  fps: 30 | 60;
  instrumentalVolume: number;
  vocalsVolume: number;
  encodingPreset:
    | "ultrafast"
    | "superfast"
    | "veryfast"
    | "faster"
    | "fast"
    | "medium"
    | "slow";
}
export interface ProjectRenderProgress {
  jobId: string;
  status: "rendering" | "completed" | "failed";
  progress?: number;
  outputPath?: string;
  error?: string;
}

export async function ensureProjectThumbnail(
  summary: ProjectSummary,
  storageDirectory: string | null
) {
  if (isDesktop()) return summary;
  if (summary.thumbnail) return summary;
  const project = await loadProject(summary.id, storageDirectory);
  if (!project) return summary;
  const thumbnail = createProjectThumbnail(project);
  if (!thumbnail) return summary;
  await saveProject({ ...project, thumbnail }, storageDirectory);
  return { ...summary, thumbnail };
}

export async function saveProjectThumbnail(
  projectId: string,
  thumbnail: Blob,
  storageDirectory: string | null
) {
  if (!isDesktop()) return;
  const bytes = Array.from(new Uint8Array(await thumbnail.arrayBuffer()));
  await invokeDesktop<void>("save_project_thumbnail", {
    projectId,
    bytes,
    storageDirectory,
  });
}

export async function readProjectThumbnail(
  projectId: string,
  thumbnail: string,
  storageDirectory: string | null
) {
  if (!isDesktop()) return new ArrayBuffer(0);
  return invokeDesktop<ArrayBuffer>("read_project_thumbnail", {
    projectId,
    thumbnail,
    storageDirectory,
  });
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

export async function createYoutubeProject(
  youtubeUrl: string,
  storageDirectory: string | null,
  models: ProcessingModels
) {
  if (!isDesktop()) {
    throw new Error("YouTube import is available in the desktop app only.");
  }
  return invokeDesktop<KaraokeProject>("create_youtube_project", {
    youtubeUrl,
    storageDirectory,
    ...models,
  });
}

export async function continueProjectProcessing(
  id: string,
  lyrics: string,
  storageDirectory: string | null
) {
  if (!isDesktop()) return;
  await invokeDesktop<void>("continue_project_processing", {
    projectId: id,
    lyrics,
    storageDirectory,
  });
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
export async function importBackgroundAsset(
  projectId: string,
  sourcePath: string,
  kind: "image" | "video",
  storageDirectory: string | null
) {
  if (!isDesktop())
    throw new Error("Background import is available in the desktop app only.");
  return invokeDesktop<string>("import_background_asset", {
    projectId,
    sourcePath,
    kind,
    storageDirectory,
  });
}
export async function extractAlbumArt(
  projectId: string,
  storageDirectory: string | null
) {
  if (!isDesktop())
    throw new Error(
      "Album art extraction is available in the desktop app only."
    );
  return invokeDesktop<string>("extract_album_art", {
    projectId,
    storageDirectory,
  });
}
export async function readProjectAsset(
  projectId: string,
  asset: string,
  storageDirectory: string | null
) {
  if (!isDesktop()) return new ArrayBuffer(0);
  return invokeDesktop<ArrayBuffer>("read_project_asset", {
    projectId,
    asset,
    storageDirectory,
  });
}
export function startProjectRender(options: ProjectRenderOptions) {
  return invokeDesktop<string>("start_project_render", { ...options });
}
export function cancelProjectRender(jobId: string) {
  return invokeDesktop<void>("cancel_project_render", { jobId });
}

export async function listProjects(storageDirectory: string | null) {
  if (isDesktop()) {
    return invokeDesktop<ProjectSummary[]>("list_projects", {
      storageDirectory,
    });
  }
  return browserProjects().map(
    ({ id, name, duration, createdAt, updatedAt, processing, ...project }) => ({
      id,
      name,
      duration,
      sizeBytes: new Blob([JSON.stringify(project)]).size,
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
