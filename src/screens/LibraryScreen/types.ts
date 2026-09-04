export type ProjectFilter = "all" | "recent" | "favorites" | "mine";

export type ProjectCover =
  | "violet-sunset"
  | "neon-city"
  | "orange-road"
  | "misty-forest"
  | "night-sky"
  | "blue-jellyfish"
  | "pink-moon"
  | "red-silhouette"
  | "palm-sunset"
  | "purple-mountain"
  | "magenta-flower"
  | "ocean-dusk";

export type ProjectAction =
  | "open"
  | "rename"
  | "favorite"
  | "duplicate"
  | "export"
  | "open-folder"
  | "delete";

export interface ProjectItem {
  id: string;
  title: string;
  artist: string;
  duration: string;
  updated: string;
  cover: ProjectCover;
  isFavorite: boolean;
  isRecent: boolean;
  isMine: boolean;
}
