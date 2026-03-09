import React from 'react';
import { Bone, type BoneProps } from './Bone'; 
import { ANATOMY, RIGGING, COLORS } from '../constants';
import { getJointPositions, getTotalRotation, getPartGlobalAngles, calculateCenterOfMass } from '../utils/kinematics';
import { PartName, PartSelection, PartVisibility, AnchorName, Pose, JointConstraint, RenderMode, Vector2D, partNameToPoseKey } from '../types';

interface KnightProps {
  pose: Pose;
  showOverlay?: boolean;
  selectedParts: PartSelection;
  visibility: PartVisibility;
  pin: AnchorName;
  className?: string;
  onMouseDownOnPart?: (part: PartName, event: React.MouseEvent<SVGGElement>) => void;
  onHoverOnPart?: (part: PartName | null) => void; 
  onMouseDownOnRoot?: (event: React.MouseEvent<SVGCircleElement>) => void;
  isAirMode?: boolean;
  showHighlights?: boolean;
  onToggleCrane?: () => void;
  isCraneActive?: boolean;
  jointModes: Record<PartName, JointConstraint>; 
  renderMode?: RenderMode; 
  bodyRotation?: number; 
  hoveredPart?: PartName | null; 
  tennisBallMode?: boolean;
  velocities?: Record<string, number>;
  jointTrails?: Record<string, Vector2D[]>;
  kineticsMode?: string;
  showCoM?: boolean;
  strainedParts?: Record<string, boolean>; 
}

export const getPartCategory = (part: PartName): string => { 
  switch (part) {
    case PartName.RWrist:
    case PartName.LWrist: return 'hand';
    case PartName.RElbow: return 'forearm'; 
    case PartName.LElbow: return 'forearm'; 
    case PartName.RShoulder: return 'bicep';
    case PartName.LShoulder: return 'bicep';
    case PartName.Collar: return 'collar';
    case PartName.Torso: return 'torso';
    case PartName.Waist: return 'waist';
    case PartName.RThigh: return 'thigh'; 
    case PartName.LThigh: return 'thigh';   
    case PartName.RSkin: return 'shin';  
    case PartName.LSkin: return 'shin';    
    case PartName.RAnkle: return 'foot'; 
    case PartName.LAnkle: return 'foot';   
    case PartName.Head: return 'head';
    default: return 'default';
  }
};

export const Knight: React.FC<KnightProps> = ({
  pose,
  showOverlay = true,
  selectedParts,
  visibility,
  pin,
  className = "text-ink",
  onMouseDownOnPart,
  onHoverOnPart,
  onMouseDownOnRoot,
  showHighlights = true,
  onToggleCrane,
  isCraneActive = false,
  jointModes, 
  renderMode = 'default', 
  bodyRotation = 0, 
  hoveredPart = null, 
  tennisBallMode = false,
  velocities = {},
  jointTrails = {},
  kineticsMode = 'clay',
  showCoM = false,
  strainedParts = {},
}) => {
  const joints = getJointPositions(pose, pin);
  const angles = getPartGlobalAngles(pose);
  const offsets = pose.offsets || {};
  const isRightLimb = (part: PartName) => ['rShoulder', 'rElbow', 'rWrist', 'rThigh', 'rSkin', 'rAnkle'].includes(part);
  const isLeftLimb = (part: PartName) => ['lShoulder', 'lElbow', 'lWrist', 'lThigh', 'lSkin', 'lAnkle'].includes(part);

  // Z-depth logic based on body rotation
  const isRightNear = bodyRotation >= 0;

  // Added `key?: React.Key` to the props definition to resolve TypeScript assignment error
  const PartWrapper = ({ part, children, transform }: { part: PartName; children?: React.ReactNode, transform?: string, key?: React.Key }) => {
    const isSelected = selectedParts[part];
    const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => { 
      e.stopPropagation(); 
      onMouseDownOnPart?.(part, e); 
    };
    
    let darken20Percent = false;
    if (bodyRotation > 0 && isRightLimb(part)) darken20Percent = false; 
    else if (bodyRotation > 0 && isLeftLimb(part)) darken20Percent = true; 
    else if (bodyRotation <= 0 && isRightLimb(part)) darken20Percent = true; 
    else if (bodyRotation <= 0 && isLeftLimb(part)) darken20Percent = false; 

    const isSupportLimb = (pin.toString().includes('Foot') || pin.toString().includes('Ankle')) && 
                          ((pin.toString().startsWith('l') && part.startsWith('l')) || (pin.toString().startsWith('r') && part.startsWith('r')));
    const isBracing = isSupportLimb && ['rThigh', 'lThigh', 'rCalf', 'lCalf', 'rAnkle', 'lAnkle'].includes(part);

    return (
      <g 
        transform={transform}
        className={`cursor-pointer ${isSelected && showHighlights && !tennisBallMode ? 'text-selection' : ''}`} 
        onMouseDown={handleMouseDown} 
        onMouseEnter={() => onHoverOnPart?.(part)} 
        onMouseLeave={() => onHoverOnPart?.(null)}
      >
        {React.Children.map(children, child =>
          React.isValidElement(child) && child.type === Bone
            ? React.cloneElement(child as React.ReactElement<BoneProps>, { 
                darken20Percent, 
                partCategory: getPartCategory(part),
                tennisBallMode,
                velocity: velocities[part] || 0,
                partName: part,
                jointTrails: jointTrails[part] || [],
                kineticsMode,
                globalRotation: angles[part] || 0,
                isBracing,
                isStrained: strainedParts[part], 
              })
            : child
        )}
      </g>
    );
  };

  const renderArm = (isRight: boolean) => {
    const sKey = isRight ? PartName.RShoulder : PartName.LShoulder;
    const eKey = isRight ? PartName.RElbow : PartName.LElbow;
    const wKey = isRight ? PartName.RWrist : PartName.LWrist;
    const pivot = isRight ? joints.rShoulder : joints.lShoulder;
    // Calculate local rotation relative to the Collar's global world angle
    const localRotation = (angles[sKey] || 0) - angles[PartName.Collar];

    return (
      <PartWrapper key={sKey} part={sKey} transform={`translate(${pivot.x}, ${pivot.y})`}>
        <Bone isSelected={selectedParts[sKey]} constraint={jointModes[sKey]} rotation={localRotation} length={ANATOMY.UPPER_ARM} width={ANATOMY.LIMB_WIDTH_ARM} variant="deltoid-shape" showOverlay={showOverlay} visible={visibility[sKey]} renderMode={renderMode}>
          <PartWrapper part={eKey}>
            <Bone isSelected={selectedParts[eKey]} constraint={jointModes[eKey]} rotation={(pose as any)[partNameToPoseKey[eKey]] || 0} length={ANATOMY.LOWER_ARM} width={ANATOMY.LIMB_WIDTH_FOREARM} variant="limb-tapered" showOverlay={showOverlay} visible={visibility[eKey]} renderMode={renderMode}>
              <PartWrapper part={wKey}>
                <Bone isSelected={selectedParts[wKey]} constraint={jointModes[wKey]} rotation={(pose as any)[partNameToPoseKey[wKey]] || 0} length={ANATOMY.HAND} width={ANATOMY.HAND_WIDTH} variant="hand-foot-arrowhead-shape" showOverlay={showOverlay} visible={visibility[wKey]} renderMode={renderMode}/>
              </PartWrapper>
            </Bone>
          </PartWrapper>
        </Bone>
      </PartWrapper>
    );
  };

  const renderLeg = (isRight: boolean) => {
    const tKey = isRight ? PartName.RThigh : PartName.LThigh;
    const sKey = isRight ? PartName.RSkin : PartName.LSkin;
    const aKey = isRight ? PartName.RAnkle : PartName.LAnkle;
    const pivot = joints.root;
    const localRotation = (angles[tKey] || 0); // Legs originate from Root
    
    const upperLegLen = ANATOMY.LEG_UPPER;
    const lowerLegLen = ANATOMY.LEG_LOWER;

    return (
      <PartWrapper key={tKey} part={tKey} transform={`translate(${pivot.x}, ${pivot.y})`}>
        <Bone isSelected={selectedParts[tKey]} rotation={localRotation} length={upperLegLen} width={ANATOMY.LIMB_WIDTH_THIGH} variant="limb-tapered" showOverlay={showOverlay} visible={visibility[tKey]} renderMode={renderMode}>
          <PartWrapper part={sKey}>
            <Bone isSelected={selectedParts[sKey]} rotation={(pose as any)[partNameToPoseKey[sKey]] || 0} length={lowerLegLen} width={ANATOMY.LIMB_WIDTH_CALF} variant="limb-tapered" showOverlay={showOverlay} visible={visibility[sKey]} renderMode={renderMode}>
              <PartWrapper part={aKey}>
                <Bone isSelected={selectedParts[aKey]} rotation={(pose as any)[partNameToPoseKey[aKey]] || 0} length={ANATOMY.FOOT} width={ANATOMY.FOOT_WIDTH} variant="hand-foot-arrowhead-shape" showOverlay={showOverlay} visible={visibility[aKey]} renderMode={renderMode}/>
              </PartWrapper>
            </Bone>
          </PartWrapper>
        </Bone>
      </PartWrapper>
    );
  };

  const coreLayer = (
    <PartWrapper part={PartName.Waist} transform={`translate(${joints.root.x}, ${joints.root.y})`}>
      <Bone isSelected={selectedParts[PartName.Waist]} rotation={getTotalRotation(PartName.Waist, pose) + bodyRotation} length={ANATOMY.WAIST} width={ANATOMY.WAIST_WIDTH} variant="waist-teardrop-pointy-up" drawsUpwards showOverlay={showOverlay} offset={offsets[PartName.Waist]} visible={visibility[PartName.Waist]} renderMode={renderMode}>
        <PartWrapper part={PartName.Torso}>
          <Bone isSelected={selectedParts[PartName.Torso]} rotation={getTotalRotation(PartName.Torso, pose)} length={ANATOMY.TORSO} width={ANATOMY.TORSO_WIDTH} variant="torso-teardrop-pointy-down" drawsUpwards showOverlay={showOverlay} offset={offsets[PartName.Torso]} visible={visibility[PartName.Torso]} renderMode={renderMode}>
            <PartWrapper part={PartName.Collar}>
              <Bone isSelected={selectedParts[PartName.Collar]} rotation={getTotalRotation(PartName.Collar, pose)} length={ANATOMY.COLLAR} width={ANATOMY.COLLAR_WIDTH} variant="collar-yoke" drawsUpwards showOverlay={showOverlay} offset={offsets[PartName.Collar]} visible={visibility[PartName.Collar]} renderMode={renderMode}>
                <PartWrapper part={PartName.Head}>
                  <Bone isSelected={selectedParts[PartName.Head]} rotation={getTotalRotation(PartName.Head, pose)} length={ANATOMY.HEAD} width={ANATOMY.HEAD_BASE_WIDTH * 2} variant="head-tall-oval" drawsUpwards showOverlay={showOverlay} visible={visibility[PartName.Head]} renderMode={renderMode}/>
                </PartWrapper>
              </Bone>
            </PartWrapper>
          </Bone>
        </PartWrapper>
      </Bone>
    </PartWrapper>
  );

  const com = showCoM ? calculateCenterOfMass(joints) : null;

  return (
    <g className={`mannequin-root ${className}`}>
      {/* Background Limbs */}
      {!isRightNear && renderArm(true)}
      {!isRightNear && renderLeg(true)}
      {isRightNear && renderArm(false)}
      {isRightNear && renderLeg(false)}

      {/* Core Body */}
      {coreLayer}

      {/* Foreground Limbs */}
      {isRightNear && renderArm(true)}
      {isRightNear && renderLeg(true)}
      {!isRightNear && renderArm(false)}
      {!isRightNear && renderLeg(false)}

      {showCoM && com && (
        <g transform={`translate(${com.x}, ${com.y})`}>
          <circle r="12" fill="rgba(0, 191, 255, 0.1)" />
          <path d="M-8,0 L8,0 M0,-8 L0,8" stroke="#00BFFF" strokeWidth="1.5" />
        </g>
      )}

      {/* World Root Pin */}
      <g transform={`translate(${joints.root.x}, ${joints.root.y})`} onMouseDown={onMouseDownOnRoot} className="cursor-pointer">
        <circle 
          cx="0" cy="0" 
          r={pin === 'root' ? 10 : 8} 
          fill={pin === 'root' ? COLORS.SELECTION : COLORS.ANCHOR_RED} 
          stroke="rgba(0,0,0,0.5)"
          strokeWidth="2"
          className="drop-shadow-sm opacity-90 transition-all duration-200"
        />
      </g>
    </g>
  );
};
