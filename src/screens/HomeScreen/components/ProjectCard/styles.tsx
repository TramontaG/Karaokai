import styled from "@emotion/styled";
import { type ProjectCover } from "./behavior";

const covers: Record<ProjectCover, string> = {
  "violet-sunset":
    "radial-gradient(circle at 70% 35%, #ff8bc5 0 5%, transparent 6%), linear-gradient(155deg, #20245f 0%, #6d3f91 45%, #ed859e 72%, #332a50 100%)",
  "neon-city":
    "linear-gradient(105deg, transparent 0 20%, rgb(241 61 255 / 48%) 21% 23%, transparent 24% 48%, rgb(22 208 255 / 55%) 49% 52%, transparent 53%), linear-gradient(160deg, #0e1539 0%, #181350 48%, #702252 100%)",
  "orange-road":
    "linear-gradient(174deg, transparent 0 66%, #24232d 67% 72%, transparent 73%), radial-gradient(circle at 72% 43%, #ffcf88 0 7%, transparent 8%), linear-gradient(160deg, #422642 0%, #df704f 52%, #272a4d 100%)",
  "misty-forest":
    "linear-gradient(102deg, transparent 0 20%, rgb(7 35 34 / 65%) 21% 25%, transparent 26% 45%, rgb(8 40 35 / 72%) 46% 53%, transparent 54%), linear-gradient(145deg, #1c5058 0%, #91a9b6 47%, #122d30 100%)",
  "night-sky":
    "radial-gradient(circle at 70% 38%, #ff9a78 0 5%, transparent 6%), linear-gradient(155deg, #171d53 0%, #494c9e 48%, #c76f85 72%, #18223e 100%)",
};

export const Card = styled.article`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.65rem;
  background: ${({ theme }) => theme.colors.surface};
  box-shadow: 0 0.75rem 1.8rem rgb(0 0 0 / 10%);
  transition:
    border-color 160ms ease,
    transform 160ms ease;

  &:hover {
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 48%,
      transparent
    );
    transform: translateY(-2px);
  }
`;

export const Cover = styled.div<{ $cover: ProjectCover }>`
  position: relative;
  aspect-ratio: 16 / 7.4;
  background: ${({ $cover }) => covers[$cover]};

  &::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 48%, rgb(3 4 13 / 44%));
    content: "";
  }
`;

export const Duration = styled.span`
  position: absolute;
  right: 0.55rem;
  bottom: 0.5rem;
  z-index: 1;
  padding: 0.2rem 0.35rem;
  border-radius: 0.3rem;
  color: #fff;
  background: rgb(5 6 14 / 84%);
  font-size: 0.68rem;
  font-weight: 650;
`;

export const Details = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
  padding: 0.85rem 0.7rem 0.9rem;
`;

export const ProjectTitle = styled.h3`
  overflow: hidden;
  margin: 0 0 0.28rem;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.78rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ProjectArtist = styled.p`
  overflow: hidden;
  margin: 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.68rem;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const MenuButton = styled.button`
  display: grid;
  width: 1.7rem;
  height: 1.7rem;
  padding: 0;
  border: 0;
  border-radius: 0.35rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }
`;
