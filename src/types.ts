export enum PartName {
  RWrist = 'rWrist', LWrist = 'lWrist',
  RElbow = 'rElbow', LElbow = 'lElbow',
  RShoulder = 'rShoulder', LShoulder = 'lShoulder',
  Collar = 'collar', Torso = 'torso', Waist = 'waist',
  RThigh = 'rThigh', LThigh = 'lThigh',
  RSkin = 'rSkin', LSkin = 'lSkin',
  RAnkle = 'rAnkle', LAnkle = 'lAnkle',
  Head = 'head'
}

export type AnchorName = 'root' | PartName;
export type PartSelection = Partial<Record<PartName, boolean>>;
export type PartVisibility = Partial<Record<PartName, boolean>>;
export type JointConstraint = 'fk' | 'stretch' | 'curl';
export type RenderMode = 'default' | 'wireframe' | 'silhouette' | 'backlight';

export interface Vector2D { x: number; y: number; }

export interface Pose {
  root: Vector2D;
  bodyRotation: number;
  offsets?: Partial<Record<PartName, Vector2D>>;
  waist: number;
  torso: number;
  collar: number;
  head: number;
  rShoulder: number;
  rForearm: number;
  rWrist: number;
  lShoulder: number;
  lForearm: number;
  lWrist: number;
  rThigh: number;
  rCalf: number;
  rAnkle: number;
  lThigh: number;
  lCalf: number;
  lAnkle: number;
}

export type RotationMode = 'none' | 'offset' | 'match';

export const PART_ABBREVIATIONS: Record<PartName, string> = {
  [PartName.Head]: 'HD',
  [PartName.Collar]: 'CL',
  [PartName.Torso]: 'TR',
  [PartName.Waist]: 'WS',
  [PartName.RShoulder]: 'RS',
  [PartName.RElbow]: 'RE',
  [PartName.RWrist]: 'RW',
  [PartName.LShoulder]: 'LS',
  [PartName.LElbow]: 'LE',
  [PartName.LWrist]: 'LW',
  [PartName.RThigh]: 'RT',
  [PartName.RSkin]: 'RSh',
  [PartName.RAnkle]: 'RA',
  [PartName.LThigh]: 'LT',
  [PartName.LSkin]: 'LSh',
  [PartName.LAnkle]: 'LA',
};
export const partNameToPoseKey = (part: PartName): keyof Pose => part as any;
