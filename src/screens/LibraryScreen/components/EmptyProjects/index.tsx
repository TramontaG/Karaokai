import { LockKeyhole } from "lucide-react";
import { BrandMark } from "../../../../components/BrandMark";
import { ImportPanel } from "../../../../components/ImportPanel";
import {
  Description,
  Empty,
  Footer,
  FooterDot,
  Heading,
  Highlight,
} from "./styles";

export interface EmptyProjectsProps {
  titlePrefix: string;
  titleHighlight: string;
  description: string;
  localLabel: string;
  privateLabel: string;
  unlimitedLabel: string;
}

export function EmptyProjects(props: EmptyProjectsProps) {
  return (
    <Empty>
      <BrandMark size={58} />
      <Heading>
        {props.titlePrefix}
        <Highlight>{props.titleHighlight}</Highlight>
      </Heading>
      <Description>{props.description}</Description>
      <ImportPanel />
      <Footer>
        <LockKeyhole aria-hidden="true" size={14} />
        <span>{props.localLabel}</span>
        <FooterDot />
        <span>{props.privateLabel}</span>
        <FooterDot />
        <span>{props.unlimitedLabel}</span>
      </Footer>
    </Empty>
  );
}
