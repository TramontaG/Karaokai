import styled from "@emotion/styled";
import { Link } from "@tanstack/react-router";

export const Page = styled.div`
  width: 100%;
  margin: 0 auto;
  padding: 1.35rem 2rem 2.5rem;

  @media (max-width: 700px) {
    padding-inline: 1rem;
  }
`;

export const Hero = styled.header`
  display: flex;
  align-items: center;
  flex-direction: column;
  text-align: center;
`;

export const HeroTitle = styled.h1`
  margin: 1.45rem 0 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1.65rem, 3vw, 2.05rem);
  line-height: 1.2;
  letter-spacing: -0.025em;
`;

export const Highlight = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  background: linear-gradient(90deg, #d878ff 0%, #ba5df2 100%);
  background-clip: text;
  -webkit-text-fill-color: transparent;
`;

export const HeroDescription = styled.p`
  max-width: 39rem;
  margin: 0.62rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.93rem;
  line-height: 1.45;
`;

export const RecentSection = styled.section`
  margin-top: 2.5rem;
`;

export const RecentHeader = styled.header`
  display: flex;
  margin-bottom: 0.9rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const RecentTitle = styled.h2`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 1rem;
  letter-spacing: -0.015em;
`;

export const ViewAll = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.accent};
  font-size: 0.75rem;
  font-weight: 600;
  text-decoration: none;

  &:hover {
    filter: brightness(1.12);
  }
`;

export const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(9.4rem, 1fr));
  gap: 1.25rem;
`;
