import { useBehavior } from "./behavior";
import {
  AnchorPoint,
  ControlArm,
  ControlPoint,
  Curve,
  CurveCanvas,
  Diagonal,
  Editor,
  GridLine,
} from "./styles";

export interface CubicBezierEditorLabels {
  title: string;
  p1x: string;
  p1y: string;
  p2x: string;
  p2y: string;
}

export interface CubicBezierEditorProps {
  value: string;
  labels: CubicBezierEditorLabels;
  onChange: (value: string) => void;
}

export function CubicBezierEditor(props: CubicBezierEditorProps) {
  const behavior = useBehavior(props);

  return (
    <Editor>
      <CurveCanvas
        viewBox="0 0 100 100"
        role="group"
        aria-label={behavior.labels.title}
      >
        <GridLine x1="25" y1="0" x2="25" y2="100" />
        <GridLine x1="50" y1="0" x2="50" y2="100" />
        <GridLine x1="75" y1="0" x2="75" y2="100" />
        <GridLine x1="0" y1="25" x2="100" y2="25" />
        <GridLine x1="0" y1="50" x2="100" y2="50" />
        <GridLine x1="0" y1="75" x2="100" y2="75" />
        <Diagonal x1="0" y1="100" x2="100" y2="0" />
        <ControlArm
          x1="0"
          y1="100"
          x2={behavior.pointOne.x}
          y2={behavior.pointOne.y}
        />
        <ControlArm
          x1="100"
          y1="0"
          x2={behavior.pointTwo.x}
          y2={behavior.pointTwo.y}
        />
        <Curve d={behavior.curvePath} />
        <AnchorPoint cx="0" cy="100" r="1.6" />
        <AnchorPoint cx="100" cy="0" r="1.6" />
        <ControlPoint
          cx={behavior.pointOne.x}
          cy={behavior.pointOne.y}
          r="3.6"
          tabIndex={0}
          role="button"
          aria-label={behavior.pointOneLabel}
          onPointerDown={behavior.onPointOnePointerDown}
          onPointerMove={behavior.onPointOnePointerMove}
          onPointerUp={behavior.onPointerUp}
          onPointerCancel={behavior.onPointerUp}
          onKeyDown={behavior.onPointOneKeyDown}
        />
        <ControlPoint
          cx={behavior.pointTwo.x}
          cy={behavior.pointTwo.y}
          r="3.6"
          tabIndex={0}
          role="button"
          aria-label={behavior.pointTwoLabel}
          onPointerDown={behavior.onPointTwoPointerDown}
          onPointerMove={behavior.onPointTwoPointerMove}
          onPointerUp={behavior.onPointerUp}
          onPointerCancel={behavior.onPointerUp}
          onKeyDown={behavior.onPointTwoKeyDown}
        />
      </CurveCanvas>
    </Editor>
  );
}
