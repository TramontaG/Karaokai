import styled from "@emotion/styled";

export const Page = styled.div`
  width: 100%;
  min-height: 100%;
  padding: 1.15rem 2rem 2.5rem;

  @media (max-width: 760px) {
    padding-inline: 1rem;
  }
`;

export const PageHeader = styled.header`
  display: flex;
  min-height: 4.5rem;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
`;

export const HeaderCopy = styled.div`
  min-width: 0;
`;

export const PageTitle = styled.h1`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
  font-size: clamp(1.7rem, 3vw, 2rem);
  line-height: 1.1;
  letter-spacing: -0.025em;
`;

export const PageDescription = styled.p`
  margin: 0.45rem 0 0;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.82rem;
`;

export const NewProjectButton = styled.button`
  display: inline-flex;
  min-height: 3.15rem;
  padding: 0 1.45rem;
  border: 0;
  border-radius: 0.6rem;
  align-items: center;
  justify-content: center;
  gap: 0.65rem;
  color: #fff;
  background: linear-gradient(120deg, #b742e9 0%, #d867ff 48%, #a934e8 100%);
  box-shadow: 0 0.55rem 1.5rem rgb(176 55 231 / 18%);
  cursor: pointer;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 650;

  &:hover {
    filter: brightness(1.08);
  }
`;

export const Toolbar = styled.div`
  display: flex;
  margin: 1.05rem 0 1.65rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 1050px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

export const FilterButton = styled.button`
  display: inline-flex;
  min-height: 2.6rem;
  padding: 0 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.68rem;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  color: ${({ theme }) => theme.colors.textMuted};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 54%,
    transparent
  );
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
    border-color: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 38%,
      transparent
    );
  }

  &[data-active="true"] {
    border-color: transparent;
    color: #21152b;
    background: linear-gradient(120deg, #bd65f2 0%, #df84ff 52%, #c253ef 100%);
  }
`;

export const CountBadge = styled.span`
  display: inline-grid;
  min-width: 1.35rem;
  height: 1.35rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  place-items: center;
  background: rgb(55 17 74 / 20%);
  font-size: 0.64rem;
`;

export const ViewControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

export const SortControl = styled.div`
  display: flex;
  align-items: center;
  gap: 0.7rem;
`;

export const SortLabel = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.7rem;
  white-space: nowrap;
`;

export const SortButton = styled.button`
  display: flex;
  min-width: 10rem;
  min-height: 2.7rem;
  padding: 0 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.55rem;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: ${({ theme }) => theme.colors.text};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 65%,
    transparent
  );
  cursor: pointer;
  font: inherit;
  font-size: 0.7rem;
`;

export const ViewSwitcher = styled.div`
  display: flex;
  gap: 0.35rem;
`;

export const ViewButton = styled.button`
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  padding: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 0.52rem;
  place-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  background: color-mix(
    in srgb,
    ${({ theme }) => theme.colors.surface} 55%,
    transparent
  );
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }

  &[data-active="true"] {
    color: ${({ theme }) => theme.colors.accent};
    background: color-mix(
      in srgb,
      ${({ theme }) => theme.colors.accent} 16%,
      ${({ theme }) => theme.colors.surface}
    );
  }
`;

export const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem 1.2rem;

  @media (max-width: 1220px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const ListShell = styled.section`
  min-width: 57rem;
`;

export const ListHead = styled.div`
  display: grid;
  min-height: 2.15rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  grid-template-columns:
    minmax(17rem, 2fr) minmax(9rem, 1.2fr) minmax(6rem, 0.7fr)
    minmax(8rem, 1fr) 3.6rem;
  align-items: center;
  color: ${({ theme }) => theme.colors.textMuted};
  font-size: 0.66rem;

  span {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }

  span:last-child {
    justify-content: center;
  }
`;
