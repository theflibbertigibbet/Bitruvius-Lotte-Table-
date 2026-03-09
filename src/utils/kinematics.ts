import { ANATOMY, BASE_ROTATIONS, RIGGING } from '../constants';
import { PartName, Pose, Vector2D } from '../types';

export const lerp = (start: number, end: number, t: number): number => start * (1 - t) + end * t;

// This function calculates the shortest angular difference between two angles (in degrees).
// It's robust for angles in any range, including those outside [-180, 180].
export const getShortestAngleDiffDeg = (currentDeg: number, startDeg: number): number => {
  let diff = currentDeg - startDeg;

  // Normalize diff to [-180, 180]
  // First, bring it to [0, 360)
  diff = ((diff % 360) + 360) % 360; 
  
  // Then, adjust to [-180, 180]
  if (diff > 180) {
    diff -= 360;
  }
  return diff;
};

// NOTE: This function is currently not used in App.tsx for direct drag updates.
// It would be used for interpolating between two full poses over time.
export const lerpAngleShortestPath = (a: number, b: number, t: number): number => {
  // Use 'a' and 'b' directly for interpolation, but calculate shortest difference based on normalized angles.
  // The 'return a + ...' part needs 'a' as the starting point.

  // Normalize angles to [0, 360) for consistent difference calculation
  const normalizeAngle0to360 = (angle: number): number => {
    return ((angle % 360) + 360) % 360;
  };

  let startAngle = normalizeAngle0to360(a);
  let endAngle = normalizeAngle0to360(b);

  let delta = endAngle - startAngle;

  // Adjust delta to be within [-180, 180] for shortest path
  if (delta > 180) {
    delta -= 360;
  } else if (delta < -180) {
    delta += 360;
  }
  
  // Apply this shortest delta from the original 'a'
  return a + delta * t;
};

export const interpolatePoseWithShortestPath = (poseA: Pose, poseB: Pose, t: number): Pose => {
  const clampedT = Math.max(0, Math.min(1, t));
  const result: Pose = { ...poseA };

  // Interpolate root position
  result.root = {
    x: lerp(poseA.root.x, poseB.root.x, clampedT),
    y: lerp(poseA.root.y, poseB.root.y, clampedT)
  };

  // Interpolate all other numeric properties (rotations)
  const keys = new Set<string>([...Object.keys(poseA), ...Object.keys(poseB)]);
  keys.forEach((key) => {
    if (key === 'root' || key === 'offsets') return; // Skip non-rotation keys

    const valA = (poseA as any)[key] || 0;
    const valB = (poseB as any)[key] || 0;

    if (typeof valA === 'number' && typeof valB === 'number') {
      (result as any)[key] = lerpAngleShortestPath(valA, valB, clampedT);
    }
  });

  // Interpolate offsets if they exist
  result.offsets = {};
  const allOffsetKeys = new Set([...Object.keys(poseA.offsets || {}), ...Object.keys(poseB.offsets || {})]);
  allOffsetKeys.forEach(key => {
    const offA = poseA.offsets?.[key] || { x: 0, y: 0 };
    const offB = poseB.offsets?.[key] || { x: 0, y: 0 };
    result.offsets![key] = {
      x: lerp(offA.x, offB.x, clampedT),
      y: lerp(offA.y, offB.y, clampedT)
    };
  });

  return result;
};


const rad = (deg: number): number => deg * Math.PI / 180;
const deg = (rad: number): number => rad * 180 / Math.PI;
const rotateVec = (x: number, y: number, angleDeg: number): Vector2D => {
  const r = rad(angleDeg);
  const c = Math.cos(r);
  const s = Math.sin(r);
  return { x: x * c - y * s, y: x * s + y * c };
};
const addVec = (v1: Vector2D, v2: Vector2D): Vector2D => ({ x: v1.x + v2.x, y: v1.y + v2.y });

export const getTotalRotation = (key: string, pose: Pose): number => {
  const keyMap: Record<string, keyof Pose> = {
    [PartName.RElbow]: 'rForearm',
    [PartName.LElbow]: 'lForearm',
    [PartName.RSkin]: 'rCalf',
    [PartName.LSkin]: 'lCalf',
  };
  const actualKey = keyMap[key] || key as keyof Pose;
  return (BASE_ROTATIONS[actualKey as keyof typeof BASE_ROTATIONS] || 0) + ((pose as any)[actualKey] || 0);
};

const calculateBoneGlobalPositions = (
  parentGlobalPos: Vector2D,
  parentGlobalAngle: number,
  boneTotalLocalRotation: number,
  boneLength: number,
  boneOffset: Vector2D = { x: 0, y: 0 },
  isUpwardDrawing: boolean = false
): { globalStartPoint: Vector2D; globalEndPoint: Vector2D; childInheritedGlobalAngle: number } => {
  const rotatedOffset = rotateVec(boneOffset.x, boneOffset.y, parentGlobalAngle);
  const globalStartPoint = addVec(parentGlobalPos, rotatedOffset);
  const boneGlobalAngleForItsBody = parentGlobalAngle + boneTotalLocalRotation;
  const y_direction = isUpwardDrawing ? -1 : 1;
  const boneVector = rotateVec(0, boneLength * y_direction, boneGlobalAngleForItsBody);
  const globalEndPoint = addVec(globalStartPoint, boneVector);
  const childInheritedGlobalAngle = parentGlobalAngle + boneTotalLocalRotation;
  return { globalStartPoint, globalEndPoint, childInheritedGlobalAngle };
};

export const getJointPositions = (pose: Pose, pin?: string) => {
  const { root } = pose;
  const offsets = pose.offsets || {};
  const bodyRotation = getTotalRotation('bodyRotation', pose); // Use actual bodyRotation from pose

  const waistCalc = calculateBoneGlobalPositions(root, bodyRotation, getTotalRotation(PartName.Waist, pose), ANATOMY.WAIST, offsets[PartName.Waist], true);
  const torsoCalc = calculateBoneGlobalPositions(waistCalc.globalEndPoint, waistCalc.childInheritedGlobalAngle, getTotalRotation(PartName.Torso, pose), ANATOMY.TORSO, offsets[PartName.Torso], true);
  const collarCalc = calculateBoneGlobalPositions(torsoCalc.globalEndPoint, torsoCalc.childInheritedGlobalAngle, getTotalRotation(PartName.Collar, pose), ANATOMY.COLLAR, offsets[PartName.Collar], true);
  const collarChildAngle = collarCalc.childInheritedGlobalAngle;
  const collarEnd = collarCalc.globalEndPoint;

  const headGapOffset = rotateVec(0, -ANATOMY.HEAD_NECK_GAP_OFFSET, collarChildAngle);
  const headPivot = addVec(collarEnd, headGapOffset);
  const headGlobalAngle = collarChildAngle + getTotalRotation(PartName.Head, pose);
  const headTip = addVec(headPivot, rotateVec(0, -ANATOMY.HEAD, headGlobalAngle));

  const getArmJoints = (isRight: boolean) => {
    const shoulderAttachX = isRight ? RIGGING.R_SHOULDER_X_OFFSET_FROM_COLLAR_CENTER : RIGGING.L_SHOULDER_X_OFFSET_FROM_COLLAR_CENTER;
    const shoulderAttach = addVec(collarEnd, rotateVec(shoulderAttachX, RIGGING.SHOULDER_Y_OFFSET_FROM_COLLAR_END, collarChildAngle));
    const upperArmCalc = calculateBoneGlobalPositions(shoulderAttach, collarChildAngle, getTotalRotation(isRight ? PartName.RShoulder : PartName.LShoulder, pose), ANATOMY.UPPER_ARM, offsets[isRight ? PartName.RShoulder : PartName.LShoulder], false);
    const forearmCalc = calculateBoneGlobalPositions(upperArmCalc.globalEndPoint, upperArmCalc.childInheritedGlobalAngle, getTotalRotation(isRight ? 'rForearm' : 'lForearm', pose), ANATOMY.LOWER_ARM, offsets[isRight ? PartName.RElbow : PartName.LElbow], false);
    const handGlobalAngle = forearmCalc.childInheritedGlobalAngle + getTotalRotation(isRight ? PartName.RWrist : PartName.LWrist, pose);
    const handTip = addVec(forearmCalc.globalEndPoint, rotateVec(0, ANATOMY.HAND, handGlobalAngle));
    return { shoulder: shoulderAttach, elbow: upperArmCalc.globalEndPoint, wrist: forearmCalc.globalEndPoint, hand: handTip };
  };

  const getLegJoints = (isRight: boolean) => {
    const thighCalc = calculateBoneGlobalPositions(root, bodyRotation, getTotalRotation(isRight ? PartName.RThigh : PartName.LThigh, pose), ANATOMY.LEG_UPPER, offsets[isRight ? PartName.RThigh : PartName.LThigh], false);
    const calfCalc = calculateBoneGlobalPositions(thighCalc.globalEndPoint, thighCalc.childInheritedGlobalAngle, getTotalRotation(isRight ? 'rCalf' : 'lCalf', pose), ANATOMY.LEG_LOWER, offsets[isRight ? PartName.RSkin : PartName.LSkin], false);
    const ankleGlobalAngle = calfCalc.childInheritedGlobalAngle + getTotalRotation(isRight ? PartName.RAnkle : PartName.LAnkle, pose);
    const footTip = addVec(calfCalc.globalEndPoint, rotateVec(0, ANATOMY.FOOT, ankleGlobalAngle));
    return { hip: root, knee: thighCalc.globalEndPoint, ankle: calfCalc.globalEndPoint, footTip };
  };

  const rArm = getArmJoints(true);
  const lArm = getArmJoints(false);
  const rLeg = getLegJoints(true);
  const lLeg = getLegJoints(false);

  return {
    root,
    waist: root, // Waist pivot is at root in current model
    torso: waistCalc.globalEndPoint,
    collar: torsoCalc.globalEndPoint,
    head: headPivot,
    rShoulder: rArm.shoulder,
    rElbow: rArm.elbow, // Actual elbow position (end of upper arm)
    rWrist: rArm.wrist, // Actual wrist position (end of forearm)
    lShoulder: lArm.shoulder,
    lElbow: lArm.elbow,
    lWrist: lArm.wrist,
    rThigh: root, // Hip joint for right leg (at root)
    [PartName.RSkin]: rLeg.knee, // Knee joint for right leg (end of thigh)
    rAnkle: rLeg.ankle, // Ankle joint for right leg (end of calf)
    lThigh: root, // Hip joint for left leg (at root)
    [PartName.LSkin]: lLeg.knee, // Knee joint for left leg (end of thigh)
    lAnkle: lLeg.ankle, // Ankle joint for left leg (end of calf)
    headTip,
    rFootTip: rLeg.footTip,
    lFootTip: lLeg.footTip,
    rHandTip: rArm.hand,
    lHandTip: lArm.hand,
  };
};

export const getPartGlobalAngles = (pose: Pose) => {
  const angles: { [key: string]: number } = {};
  const bodyRotation = getTotalRotation('bodyRotation', pose);
  const waistGlobal = bodyRotation + getTotalRotation(PartName.Waist, pose);
  const torsoGlobal = waistGlobal + getTotalRotation(PartName.Torso, pose);
  const collarGlobal = torsoGlobal + getTotalRotation(PartName.Collar, pose);
  angles[PartName.Waist] = waistGlobal;
  angles[PartName.Torso] = torsoGlobal;
  angles[PartName.Collar] = collarGlobal;
  angles[PartName.Head] = collarGlobal + getTotalRotation(PartName.Head, pose);

  const processArm = (isRight: boolean) => {
    const sKey = isRight ? PartName.RShoulder : PartName.LShoulder;
    const fKey = isRight ? 'rForearm' : 'lForearm'; // Use string key for pose property
    const wKey = isRight ? PartName.RWrist : PartName.LWrist;
    const sAngle = collarGlobal + getTotalRotation(sKey, pose);
    const fAngle = sAngle + getTotalRotation(fKey, pose);
    const wAngle = fAngle + getTotalRotation(wKey, pose);
    angles[sKey] = sAngle;
    angles[isRight ? PartName.RElbow : PartName.LElbow] = fAngle; // Store global angle for elbow (end of bicep)
    angles[wKey] = wAngle;
  };
  processArm(true);
  processArm(false);

  const processLeg = (isRight: boolean) => {
    const tKey = isRight ? PartName.RThigh : PartName.LThigh;
    const cKey = isRight ? 'rCalf' : 'lCalf'; // Use string key for pose property
    const aKey = isRight ? PartName.RAnkle : PartName.LAnkle;
    const tAngle = bodyRotation + getTotalRotation(tKey, pose);
    const cAngle = tAngle + getTotalRotation(cKey, pose);
    const aAngle = cAngle + getTotalRotation(aKey, pose);
    angles[tKey] = tAngle;
    angles[isRight ? PartName.RSkin : PartName.LSkin] = cAngle; // Store global angle for knee (end of thigh)
    angles[aKey] = aAngle;
  };
  processLeg(true);
  processLeg(false);

  return angles;
};

export const solveArmIK = (target: Vector2D, isRight: boolean, pose: Pose, bendMode: 'contraction' | 'extension' = 'contraction') => {
  const joints = getJointPositions(pose);
  const sPos = isRight ? joints.rShoulder : joints.lShoulder;
  const l1 = ANATOMY.UPPER_ARM;
  const l2 = ANATOMY.LOWER_ARM;
  const dx = target.x - sPos.x;
  const dy = target.y - sPos.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);
  // Max reach check for arm. Prevent IK if target is beyond reach.
  // Add a small tolerance to allow target slightly outside max reach if desired
  const MAX_ARM_DIST = l1 + l2 + 5; // Allow 5 units over max length
  if (dist > MAX_ARM_DIST || dist < Math.abs(l1 - l2)) return null; 

  const angleToTarget = Math.atan2(dy, dx);
  // Law of Cosines to find internal angles
  // Angle at shoulder (sAngleTri) relative to the line from shoulder to target
  const sAngleTri = Math.acos((l1 * l1 + distSq - l2 * l2) / (2 * l1 * dist));
  // Angle at elbow (eAngleTri)
  const eAngleTri = Math.acos((l1 * l1 + l2 * l2 - distSq) / (2 * l1 * l2));

  // Global angle of the upper arm
  const sGlobal = bendMode === 'contraction' 
    ? angleToTarget - sAngleTri 
    : angleToTarget + sAngleTri;
  
  // Local angle of the forearm relative to upper arm
  const fLocal = bendMode === 'contraction' 
    ? Math.PI - eAngleTri 
    : -(Math.PI - eAngleTri);

  const collarAngle = getPartGlobalAngles(pose)[PartName.Collar];
  return {
    shoulder: deg(sGlobal) - collarAngle - BASE_ROTATIONS[isRight ? PartName.RShoulder : PartName.LShoulder],
    forearm: deg(fLocal) - BASE_ROTATIONS[isRight ? 'rForearm' : 'lForearm']
  };
};

export const solveLegIK = (target: Vector2D, isRight: boolean, pose: Pose, bendMode: 'contraction' | 'extension' = 'contraction') => {
  const joints = getJointPositions(pose);
  const hPos = isRight ? joints.rThigh : joints.lThigh;
  const l1 = ANATOMY.LEG_UPPER;
  const l2 = ANATOMY.LEG_LOWER;
  const dx = target.x - hPos.x;
  const dy = target.y - hPos.y;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);
  // Max reach check for leg. Prevent IK if target is beyond reach.
  const MAX_LEG_DIST = l1 + l2 + 5; // Allow 5 units over max length
  if (dist > MAX_LEG_DIST || dist < Math.abs(l1 - l2)) return null; 

  const angleToTarget = Math.atan2(dy, dx);
  // Law of Cosines to find internal angles
  // Angle at hip (tAngleTri) relative to the line from hip to target
  const tAngleTri = Math.acos((l1 * l1 + distSq - l2 * l2) / (2 * l1 * dist));
  // Angle at knee (kAngleTri)
  const kAngleTri = Math.acos((l1 * l1 + l2 * l2 - distSq) / (2 * l1 * l2));

  // Global angle of the upper leg
  const tGlobal = bendMode === 'contraction' 
    ? angleToTarget - tAngleTri 
    : angleToTarget + tAngleTri;
  
  // Local angle of the lower leg relative to upper leg
  const cLocal = bendMode === 'contraction' 
    ? Math.PI - kAngleTri 
    : -(Math.PI - kAngleTri);

  const bodyRot = getTotalRotation('bodyRotation', pose);
  return {
    thigh: deg(tGlobal) - bodyRot - BASE_ROTATIONS[isRight ? PartName.RThigh : PartName.LThigh],
    calf: deg(cLocal) - BASE_ROTATIONS[isRight ? 'rCalf' : 'lCalf']
  };
};

export const calculateCenterOfMass = (joints: Record<string, Vector2D>): Vector2D => {
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  
  // Weights for different parts could be added here for a more accurate CoM,
  // but a simple average of key joints is often sufficient for visual purposes.
  const keyJoints = [
    'root', 'torso', 'collar', 'head',
    'rShoulder', 'rElbow', 'rWrist',
    'lShoulder', 'lElbow', 'lWrist',
    'rThigh', 'rAnkle',
    'lThigh', 'lAnkle'
  ];

  for (const key of keyJoints) {
    if (joints[key]) {
      sumX += joints[key].x;
      sumY += joints[key].y;
      count++;
    }
  }

  if (count === 0) return { x: 0, y: 0 };
  return { x: sumX / count, y: sumY / count };
};
