import React from "react";
import CanvasGrid from "./CanvasGrid";
import WoodFrame from "./WoodFrame";
import { Pose, PartName } from "../types";
import { PoseAngled } from "./angled/typesAngled";

interface LightTableProps {
  lightHue: string;
  intensity: number;
  fadeSpeed: string;
  showGrid: boolean;
  showObjects: boolean;
  blendMode: string;
  activeModel?: 'knight' | 'mannequin';
  poseKnight?: Pose;
  poseMannequin?: PoseAngled;
  onMouseDownOnPart?: (part: PartName, e: React.MouseEvent) => void;
  selectedPart?: PartName | null;
}

export default function LightTable({
  lightHue,
  intensity,
  fadeSpeed,
  showGrid,
  showObjects,
  blendMode,
  activeModel,
  poseKnight,
  poseMannequin,
  onMouseDownOnPart,
  selectedPart
}: LightTableProps) {
  return (
    <div className="relative mx-auto inline-block" style={{ perspective: "1200px" }}>
      {/* Main table structure */}
      <div
        className="relative mx-auto inline-block"
        style={{
          transform: "rotateX(4deg)",
          transformOrigin: "center bottom",
        }}
      >
        <WoodFrame>
          <CanvasGrid 
            lightHue={lightHue}
            intensity={intensity}
            fadeSpeed={fadeSpeed}
            showGrid={showGrid}
            showObjects={showObjects}
            blendMode={blendMode}
            activeModel={activeModel}
            poseKnight={poseKnight}
            poseMannequin={poseMannequin}
            onMouseDownOnPart={onMouseDownOnPart}
            selectedPart={selectedPart}
          />
        </WoodFrame>
      </div>
    </div>
  );
}
