import React from "react";
import { Knight } from "./Knight";
import { Mannequin } from "./angled/Mannequin";
import { Pose, PartName, JointConstraint } from "../types";
import { PoseAngled } from "./angled/typesAngled";

// Canvas is exactly 12 large squares wide × 9 large squares tall
// Each large square = 60px, each small square = 15px (1/4 size)
const COLS = 12;
const ROWS = 9;
const LARGE = 60;
const SMALL = LARGE / 4; // 15px

const W = COLS * LARGE; // 720
const H = ROWS * LARGE; // 540

interface CanvasGridProps {
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

export default function CanvasGrid({
  lightHue,
  intensity,
  fadeSpeed,
  showGrid,
  showObjects,
  blendMode,
  activeModel = 'knight',
  poseKnight,
  poseMannequin,
  onMouseDownOnPart,
  selectedPart
}: CanvasGridProps) {
  
  // Default pose for the knight mannequin
  const defaultPoseKnight: Pose = poseKnight || {
    root: { x: W / 2, y: H / 2 },
    bodyRotation: 0,
    waist: 0,
    torso: 0,
    collar: 0,
    head: 0,
    rShoulder: 20,
    rForearm: 10,
    rWrist: 0,
    lShoulder: -20,
    lForearm: -10,
    lWrist: 0,
    rThigh: 10,
    rCalf: 0,
    rAnkle: 0,
    lThigh: -10,
    lCalf: 0,
    lAnkle: 0,
  };

  // Default pose for the mannequin
  const defaultPoseMannequin: PoseAngled = poseMannequin || {
    root: { x: W / 2, y: H / 2 },
    rootRotation: 0,
    torso: 180,
    neck: 0,
    rShoulder: 20,
    rForearm: 10,
    rWrist: 0,
    lShoulder: -20,
    lForearm: -10,
    lWrist: 0,
    hips: 0,
    rThigh: 10,
    rCalf: 0,
    rAnkle: 0,
    lThigh: -10,
    lCalf: 0,
    lAnkle: 0,
  };

  const defaultVisibility = Object.values(PartName).reduce((acc, part) => {
    acc[part as PartName] = true;
    return acc;
  }, {} as Record<PartName, boolean>);

  const defaultJointModes = Object.values(PartName).reduce((acc, part) => {
    acc[part as PartName] = 'fk';
    return acc;
  }, {} as Record<PartName, JointConstraint>);

  return (
    <div
      style={{
        width: W,
        height: H,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {/* Backlight — greyscale radial */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, #e8e8e8 0%, #d0d0d0 35%, #b0b0b0 65%, #888 100%)",
        }}
      />

      {/* Soft center hotspot */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.1) 35%, transparent 60%)",
        }}
      />

      {/* Dynamic Light hue from props */}
      <div 
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: lightHue,
          opacity: intensity,
          transition: `background-color ${fadeSpeed} ease-in-out, opacity 0.3s ease`,
          mixBlendMode: "overlay"
        }}
      />

      {/* SVG grids */}
      {showGrid && (
        <svg
          style={{ position: "absolute", inset: 0 }}
          width={W}
          height={H}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Small grid pattern */}
            <pattern id="smallGrid" width={SMALL} height={SMALL} patternUnits="userSpaceOnUse">
              <path
                d={`M ${SMALL} 0 L 0 0 0 ${SMALL}`}
                fill="none"
                stroke="rgba(0,0,0,0.1)"
                strokeWidth="0.5"
              />
            </pattern>

            {/* Large grid pattern */}
            <pattern id="largeGrid" width={LARGE} height={LARGE} patternUnits="userSpaceOnUse">
              <rect width={LARGE} height={LARGE} fill="url(#smallGrid)" />
              <path
                d={`M ${LARGE} 0 L 0 0 0 ${LARGE}`}
                fill="none"
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          {/* Fill with combined grid */}
          <rect width={W} height={H} fill="url(#largeGrid)" />

          {/* Border lines on right and bottom edges */}
          <line x1={W} y1={0} x2={W} y2={H} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
          <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(0,0,0,0.3)" strokeWidth="1" />
        </svg>
      )}

      {/* Subtle glass reflection */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 45%)",
          pointerEvents: "none",
        }}
      />

      {/* Sample Puppets/Objects */}
      <div 
        className="relative z-20 flex gap-20 pointer-events-none transition-opacity duration-500 h-full items-center justify-center"
        style={{ opacity: showObjects ? 1 : 0 }}
      >
        <div 
          className="absolute inset-0 transition-all duration-300"
          style={{ mixBlendMode: blendMode as any }}
        >
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
             
             {/* --- KNIGHT MANNEQUIN --- */}
             {activeModel === 'knight' && (
               <>
                 {/* Skeletal Rig (Underneath) */}
                 <g className="text-zinc-400">
                   <Knight 
                     pose={defaultPoseKnight} 
                     showOverlay={true} 
                     renderMode="wireframe"
                     selectedParts={{}}
                     visibility={defaultVisibility}
                     pin="root"
                     jointModes={defaultJointModes}
                   />
                 </g>

                 {/* Black Mannequin (Over) */}
                 <g className="text-black" opacity={0.85}>
                   <Knight 
                     pose={defaultPoseKnight} 
                     showOverlay={false} 
                     renderMode="silhouette"
                     selectedParts={selectedPart ? { [selectedPart]: true } : {}}
                     visibility={defaultVisibility}
                     pin="root"
                     jointModes={defaultJointModes}
                     onMouseDownOnPart={onMouseDownOnPart as any}
                   />
                 </g>
               </>
             )}

             {/* --- MANNEQUIN --- */}
             {activeModel === 'mannequin' && (
               <>
                 {/* Skeletal Rig (Underneath) */}
                 <g className="text-zinc-400">
                   <Mannequin 
                     pose={defaultPoseMannequin} 
                     showOverlay={true} 
                     skeletonMode={true} 
                   />
                 </g>

                 {/* Black Mannequin (Over) */}
                 <g className="text-black" opacity={0.85}>
                   <Mannequin 
                     pose={defaultPoseMannequin} 
                     showOverlay={false} 
                     selectedPart={selectedPart}
                     onMouseDownOnPart={onMouseDownOnPart as any}
                   />
                 </g>
               </>
             )}

          </svg>
        </div>
      </div>
    </div>
  );
}
