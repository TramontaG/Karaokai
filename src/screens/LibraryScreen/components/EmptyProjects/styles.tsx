import styled from "@emotion/styled";

export const Empty = styled.section`
  display: flex;
  min-height: calc(100vh - 7rem);
  padding: 4.2rem 1rem 1.5rem;
  align-items: center;
  flex-direction: column;
  text-align: center;
`;

export const Heading = styled.h1`
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

export const Description = styled.p`
  max-width: 39rem;
  margin: 0.62rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.93rem;
  line-height: 1.45;
`;

export const Footer = styled.footer`
  display: flex;
  margin-top: auto;
  padding-top: 2rem;
  align-items: center;
  gap: 0.55rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.67rem;
`;

export const FooterDot = styled.span`
  width: 0.2rem;
  height: 0.2rem;
  border-radius: 50%;
  background: currentColor;
`;
