import styled from "@emotion/styled";

export const Shell = styled.div`
  display: grid;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.75rem;
  grid-template-columns: clamp(13rem, 17.2vw, 16.5rem) minmax(0, 1fr);
  color: ${({ theme }) => theme.colors.text};
  background:
    radial-gradient(
      circle at 78% 40%,
      color-mix(in srgb, ${({ theme }) => theme.colors.accent} 3%, transparent),
      transparent 42%
    ),
    ${({ theme }) => theme.colors.background};

  @media (max-width: 900px) {
    grid-template-columns: 5.25rem minmax(0, 1fr);
  }
`;

export const ResizeHandle = styled.div`
  position: fixed;
  z-index: 1000;
  touch-action: none;
  user-select: none;

  &[data-direction="North"] {
    top: 0;
    right: 0.75rem;
    left: 0.75rem;
    height: 0.375rem;
    cursor: n-resize;
  }

  &[data-direction="NorthEast"] {
    top: 0;
    right: 0;
    width: 0.75rem;
    height: 0.75rem;
    cursor: nesw-resize;
  }

  &[data-direction="East"] {
    top: 0.75rem;
    right: 0;
    bottom: 0.75rem;
    width: 0.375rem;
    cursor: e-resize;
  }

  &[data-direction="SouthEast"] {
    right: 0;
    bottom: 0;
    width: 0.75rem;
    height: 0.75rem;
    cursor: nwse-resize;
  }

  &[data-direction="South"] {
    right: 0.75rem;
    bottom: 0;
    left: 0.75rem;
    height: 0.375rem;
    cursor: s-resize;
  }

  &[data-direction="SouthWest"] {
    bottom: 0;
    left: 0;
    width: 0.75rem;
    height: 0.75rem;
    cursor: nesw-resize;
  }

  &[data-direction="West"] {
    top: 0.75rem;
    bottom: 0.75rem;
    left: 0;
    width: 0.375rem;
    cursor: w-resize;
  }

  &[data-direction="NorthWest"] {
    top: 0;
    left: 0;
    width: 0.75rem;
    height: 0.75rem;
    cursor: nwse-resize;
  }
`;

export const Sidebar = styled.aside`
  display: flex;
  min-height: 0;
  padding: 2rem 1.1rem 4rem;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  flex-direction: column;
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 76%,
    transparent
  );
  box-shadow: 1rem 0 3.5rem rgb(0 0 0 / 8%);

  @media (max-width: 900px) {
    padding-inline: 0.7rem;
  }
`;

export const Brand = styled.div`
  display: flex;
  padding: 0 0.8rem;
  align-items: center;
  gap: 0.8rem;

  @media (max-width: 900px) {
    padding: 0;
    justify-content: center;
  }
`;

export const BrandName = styled.strong`
  color: ${({ theme }) => theme.colors.text};
  font-size: 1.25rem;
  letter-spacing: -0.02em;

  @media (max-width: 900px) {
    display: none;
  }
`;

export const BrandAccent = styled.span`
  color: ${({ theme }) => theme.colors.accent};
`;

export const Navigation = styled.nav`
  display: grid;
  gap: 0.45rem;
  margin-top: 2.3rem;

  a {
    display: flex;
    min-height: 3.2rem;
    padding: 0 0.9rem;
    border-radius: 0.65rem;
    align-items: center;
    gap: 0.9rem;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.88rem;
    text-decoration: none;
    transition:
      color 150ms ease,
      background 150ms ease;
  }

  a:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }

  a[data-status="active"] {
    color: ${({ theme }) => theme.colors.accent};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 15%,
      ${({ theme }) => theme.colors.surface}
    );
  }

  @media (max-width: 900px) {
    a {
      padding: 0;
      justify-content: center;
      font-size: 0;
    }
  }
`;

export const SidebarFooter = styled.footer`
  margin-top: auto;
  padding: 0 0.8rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

export const StorageLabel = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.72rem;
`;

export const StorageDescription = styled.p`
  margin: 0.35rem 0 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.65rem;
`;

export const StorageLine = styled.div`
  height: 0.45rem;
  overflow: hidden;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.border};

  &::before {
    display: block;
    width: 26%;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #b35cef, #d77cff);
    content: "";
  }
`;

export const Workspace = styled.div`
  display: grid;
  min-width: 0;
  min-height: 0;
  grid-template-rows: 5.4rem minmax(0, 1fr);
`;

export const Titlebar = styled.header`
  display: flex;
  min-width: 0;
  padding: 1.25rem 1.6rem 0.85rem;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  user-select: none;
`;

export const SearchBox = styled.label`
  display: flex;
  width: min(18rem, 34vw);
  height: 2.6rem;
  padding: 0 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.65rem;
  align-items: center;
  gap: 0.6rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 70%,
    transparent
  );

  &:focus-within {
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 45%,
      transparent
    );
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  color: ${({ theme }) => theme.colors.text};
  background: transparent;
  font: inherit;
  font-size: 0.75rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.textMuted};
  }

  &::-webkit-search-cancel-button {
    display: none;
  }
`;

export const ThemeButton = styled.button`
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 50%;
  place-items: center;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 82%,
    transparent
  );
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border};
  }
`;

export const WindowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

export const WindowAction = styled.button`
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  border: 0;
  border-radius: 0.4rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: transparent;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background: ${({ theme }) => theme.colors.border};
  }

  &:last-child:hover {
    color: #fff;
    background: #d53f50;
  }
`;

export const Content = styled.main`
  min-width: 0;
  min-height: 0;
  overflow: auto;
`;
