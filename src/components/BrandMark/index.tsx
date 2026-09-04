import { Bar, Mark } from "./styles";

interface BrandMarkProps {
  size?: number;
}

export function BrandMark({ size = 48 }: BrandMarkProps) {
  return (
    <Mark $size={size} aria-hidden="true">
      <Bar />
      <Bar />
      <Bar />
      <Bar />
      <Bar />
    </Mark>
  );
}
