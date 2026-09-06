import { useEffect, useState } from "react";
import { useAppContext } from "../../../../hooks/useAppContext";
import { readProjectThumbnail } from "../../../../services/projects";
import { type ProjectArtworkProps } from ".";

function thumbnailMimeType(thumbnail: string) {
  const extension = thumbnail.split(".").pop()?.toLowerCase();
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/jpeg";
}

export function useBehavior({ projectId, thumbnail }: ProjectArtworkProps) {
  const [data] = useAppContext();
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(
    thumbnail?.startsWith("data:") ? thumbnail : null
  );

  useEffect(() => {
    if (!thumbnail) {
      setThumbnailUrl(null);
      return;
    }
    if (thumbnail.startsWith("data:")) {
      setThumbnailUrl(thumbnail);
      return;
    }
    let disposed = false;
    let objectUrl: string | null = null;
    void readProjectThumbnail(
      projectId,
      thumbnail,
      data.preferences.storageDirectory
    )
      .then((bytes) => {
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: thumbnailMimeType(thumbnail) })
        );
        if (disposed) URL.revokeObjectURL(objectUrl);
        else setThumbnailUrl(objectUrl);
      })
      .catch(() => {
        if (!disposed) setThumbnailUrl(null);
      });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data.preferences.storageDirectory, projectId, thumbnail]);

  return { thumbnailUrl };
}
