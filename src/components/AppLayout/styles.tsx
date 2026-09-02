import styled from "@emotion/styled";
export const Shell = styled.div`
  display: grid;
  min-height: 100vh;
  grid-template-columns: 15rem minmax(0, 1fr);
  background: ${({ theme }) => theme.colors.background};
`;
export const Sidebar = styled.aside`
  display: grid;
  align-content: start;
  gap: 2rem;
  padding: 2rem 1.25rem;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.surface};
`;
export const Navigation = styled.nav`
  display: grid;
  gap: 0.75rem;
  a {
    color: ${({ theme }) => theme.colors.textMuted};
    text-decoration: none;
  }
`;
export const Content = styled.main`
  padding: clamp(1.5rem, 4vw, 4rem);
`;
