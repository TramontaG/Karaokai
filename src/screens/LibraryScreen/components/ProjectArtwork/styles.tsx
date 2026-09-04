import styled from "@emotion/styled";
import { type ProjectCover } from "../../types";

const covers: Record<ProjectCover, string> = {
  "violet-sunset":
    "radial-gradient(circle at 68% 37%, #ffb1cf 0 4%, transparent 5%), linear-gradient(165deg, transparent 0 57%, #1d2447 58% 65%, transparent 66%), linear-gradient(150deg, #30336f 0%, #a6548c 48%, #ed8ca5 69%, #292844 100%)",
  "neon-city":
    "linear-gradient(94deg, transparent 0 15%, rgb(244 42 255 / 58%) 16% 18%, transparent 19% 42%, rgb(22 207 255 / 58%) 43% 46%, transparent 47% 70%, rgb(255 56 184 / 45%) 71% 73%, transparent 74%), linear-gradient(160deg, #08132e 0%, #15205b 46%, #70204d 100%)",
  "orange-road":
    "linear-gradient(90deg, transparent 0 49%, #ff9d3c 49.5% 50.5%, transparent 51%), linear-gradient(174deg, transparent 0 65%, #25242b 66% 75%, transparent 76%), radial-gradient(circle at 68% 37%, #ffd18d 0 6%, transparent 7%), linear-gradient(160deg, #5d3344 0%, #ef7d4c 52%, #222947 100%)",
  "misty-forest":
    "linear-gradient(100deg, transparent 0 16%, rgb(5 30 29 / 80%) 17% 22%, transparent 23% 40%, rgb(7 39 35 / 78%) 41% 47%, transparent 48% 66%, rgb(8 43 37 / 72%) 67% 74%, transparent 75%), linear-gradient(145deg, #173f47 0%, #84a5b2 47%, #112b2c 100%)",
  "night-sky":
    "linear-gradient(91deg, transparent 0 19%, rgb(9 14 46 / 88%) 20% 22%, transparent 23%), radial-gradient(circle at 69% 37%, #ff9b75 0 5%, transparent 6%), linear-gradient(155deg, #171e53 0%, #4f509c 48%, #d16e85 73%, #17223c 100%)",
  "blue-jellyfish":
    "radial-gradient(ellipse at 38% 35%, rgb(139 203 255 / 78%) 0 10%, transparent 11%), radial-gradient(ellipse at 68% 55%, rgb(107 185 255 / 74%) 0 8%, transparent 9%), linear-gradient(145deg, #052c5f 0%, #0756a1 48%, #082554 100%)",
  "pink-moon":
    "radial-gradient(circle at 55% 35%, #f2c5f4 0 6%, transparent 6.5%), radial-gradient(ellipse at 50% 84%, #b3458f 0 26%, transparent 27%), linear-gradient(155deg, #3c2456 0%, #b95a9f 47%, #f59fba 73%, #452657 100%)",
  "red-silhouette":
    "radial-gradient(ellipse at 58% 52%, rgb(13 10 20 / 88%) 0 21%, transparent 22%), linear-gradient(105deg, transparent 0 42%, rgb(255 37 57 / 50%) 43% 46%, transparent 47%), linear-gradient(145deg, #230d20 0%, #9e132c 52%, #250817 100%)",
  "palm-sunset":
    "linear-gradient(80deg, transparent 0 18%, rgb(12 19 31 / 90%) 19% 21%, transparent 22% 73%, rgb(10 17 28 / 88%) 74% 76%, transparent 77%), linear-gradient(155deg, #522958 0%, #d6537d 48%, #f08b71 70%, #15243a 100%)",
  "purple-mountain":
    "linear-gradient(155deg, transparent 0 54%, #1b2452 55% 66%, transparent 67%), radial-gradient(circle at 68% 29%, #d693ff 0 2%, transparent 3%), linear-gradient(150deg, #13183c 0%, #333278 52%, #151b3e 100%)",
  "magenta-flower":
    "radial-gradient(ellipse at 64% 62%, #d11d8e 0 10%, transparent 11%), radial-gradient(ellipse at 49% 45%, #8f175f 0 15%, transparent 16%), linear-gradient(145deg, #291332 0%, #851450 54%, #e02c91 100%)",
  "ocean-dusk":
    "linear-gradient(175deg, transparent 0 63%, rgb(13 38 61 / 72%) 64% 70%, transparent 71%), radial-gradient(circle at 70% 40%, #f5a3a5 0 4%, transparent 5%), linear-gradient(155deg, #26355f 0%, #9c5c84 54%, #ec8e98 72%, #1a334c 100%)",
};

export const Artwork = styled.div<{
  $cover: ProjectCover;
  $compact: boolean;
}>`
  position: relative;
  width: ${({ $compact }) => ($compact ? "4.6rem" : "100%")};
  min-width: ${({ $compact }) => ($compact ? "4.6rem" : "0")};
  height: ${({ $compact }) => ($compact ? "2.85rem" : "auto")};
  aspect-ratio: ${({ $compact }) => ($compact ? "auto" : "2.25 / 1")};
  overflow: hidden;
  border-radius: ${({ $compact }) => ($compact ? "0.3rem" : "0.6rem 0.6rem 0 0")};
  background: ${({ $cover }) => covers[$cover]};

  &::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 45%, rgb(3 4 13 / 42%));
    content: "";
  }
`;

export const Duration = styled.span`
  position: absolute;
  right: 0.5rem;
  bottom: 0.45rem;
  z-index: 1;
  padding: 0.2rem 0.36rem;
  border-radius: 0.28rem;
  color: #fff;
  background: rgb(4 5 13 / 88%);
  font-size: 0.67rem;
  font-weight: 650;
`;
