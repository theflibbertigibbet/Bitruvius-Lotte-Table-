import React from 'react';

export type BoneVariant = 'wedge' | 'pelvis' | 'taper' | 'column' | 'arrowhead' | 'diamond' | 'limb-tapered';

export interface PoseAngled {
  root: { x: number, y: number };
  rootRotation?: number;
  torso: number;
  neck: number;
  rShoulder: number;
  rBicepCorrective?: number;
  rForearm: number;
  rWrist: number;
  lShoulder: number;
  lBicepCorrective?: number;
  lForearm: number;
  lWrist: number;
  hips: number;
  rThigh: number;
  rThighCorrective?: number;
  rCalf: number;
  rAnkle: number;
  lThigh: number;
  lThighCorrective?: number;
  lCalf: number;
  lAnkle: number;
  offsets?: Record<string, { x: number, y: number }>;
}

export interface BonePropsAngled {
  rotation: number;
  corrective?: number;
  length: number;
  width?: number;
  variant?: BoneVariant;
  rounded?: boolean;
  cutout?: number;
  decorations?: Array<{ position: number, shape: string, type: string, size?: number }>;
  showOverlay?: boolean;
  visible?: boolean;
  offset?: { x: number, y: number };
  children?: React.ReactNode;
}
