import React from 'react';
import { BoneAngled as Bone } from './BoneAngled';
import { PoseAngled } from './typesAngled';
import { ANATOMY, RIGGING } from './constantsAngled';

type FocusMode = 'all' | 'core' | 'upper' | 'lower';

interface MannequinProps {
  pose: PoseAngled;
  showOverlay?: boolean;
  visibility?: Record<string, boolean>;
  focusMode?: FocusMode;
  wormMode?: boolean;
  hoveredPart?: string | null;
  selectedPart?: string | null;
  pinnedJoints?: Map<string, {x: number, y: number}>;
  skeletonMode?: boolean;
  onMouseDownOnPart?: (part: string, e: React.MouseEvent) => void;
}

export const Mannequin: React.FC<MannequinProps> = ({ 
    pose, 
    showOverlay = true, 
    visibility = {}, 
    focusMode = 'all',
    wormMode = false,
    hoveredPart,
    selectedPart,
    pinnedJoints,
    skeletonMode = false,
    onMouseDownOnPart
}) => {
  const shoulderInset = RIGGING.SHOULDER_INSET; 
  const shoulderLift = RIGGING.SHOULDER_LIFT;
  const clavicleExtension = RIGGING.CLAVICLE_EXTENSION;
  const neckSink = RIGGING.NECK_SINK;
  
  const offsets = pose.offsets || {};
  const shoulderSize = ANATOMY.LIMB_WIDTH_ARM; 
  
  const navelY_Torso = -ANATOMY.TORSO;
  const rShoulderX = -(ANATOMY.SHOULDER_WIDTH/2 - shoulderInset + clavicleExtension);
  const lShoulderX = (ANATOMY.SHOULDER_WIDTH/2 - shoulderInset + clavicleExtension);
  const shoulderY = shoulderLift;
  
  const rOff = offsets.rShoulder || {x: 0, y: 0};
  const lOff = offsets.lShoulder || {x: 0, y: 0};
  
  const rShoulderX_Adj = rShoulderX + rOff.x;
  const rShoulderY_Adj = shoulderY + rOff.y;
  const lShoulderX_Adj = lShoulderX + lOff.x;
  const lShoulderY_Adj = shoulderY + lOff.y;
  
  const navelY_Pelvis = -ANATOMY.PELVIS;
  const rHipX = ANATOMY.HIP_WIDTH/4;
  const lHipX = -ANATOMY.HIP_WIDTH/4;
  const hipY = 0;

  const getStyle = (group: 'core' | 'upper' | 'lower' | 'l_arm' | 'r_arm' | 'l_leg' | 'r_leg') => {
      if (wormMode) {
          if (group === 'l_arm' || group === 'r_arm' || group === 'l_leg') {
              return { display: 'none' };
          }
          return { opacity: 1 };
      }
      let opacity = 1;
      let pointerEvents: 'auto' | 'none' = 'auto';
      if (focusMode === 'core') {
          if (group !== 'core') { opacity = 0.1; pointerEvents = 'none'; }
      } else if (focusMode === 'upper') {
          if (group !== 'upper' && group !== 'l_arm' && group !== 'r_arm' && group !== 'core') { opacity = 0.1; pointerEvents = 'none'; }
      } else if (focusMode === 'lower') {
          if (group !== 'lower' && group !== 'l_leg' && group !== 'r_leg' && group !== 'core') { opacity = 0.1; pointerEvents = 'none'; }
      }
      return { opacity, pointerEvents };
  };

  const isVisible = (key: string) => visibility[key] !== false;

  const renderTargetIndicator = (partName: string, radius: number = 10) => {
      if (!showOverlay) return null;
      const isHovered = hoveredPart === partName;
      const isSelected = selectedPart === partName;
      const isPinned = pinnedJoints?.has(partName);
      
      if (!isHovered && !isSelected && !isPinned) return null;

      const color = isPinned ? '#3b82f6' : (isSelected ? '#3b82f6' : (isHovered ? '#06b6d4' : 'transparent'));
      const isDashed = isSelected && !isPinned; 
      
      return (
          <g className="pointer-events-none">
             <circle r={radius + 4} fill={isPinned ? color : "none"} stroke={color} strokeWidth="2" strokeDasharray={isDashed ? "2 2" : "none"} opacity={isPinned ? "1" : "0.8"}>
                {isSelected && !isPinned && <animate attributeName="r" values={`${radius+4};${radius+8};${radius+4}`} dur="1.5s" repeatCount="indefinite" />}
             </circle>
             {isPinned && <circle r={4} fill="white" />}
          </g>
      );
  }

  const renderRangeArc = (partName: string, chainLength: number) => {
      if (selectedPart !== partName || !showOverlay) return null;
      return (
          <circle r={chainLength} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" className="pointer-events-none" />
      );
  };

  const getWidth = (w: number) => skeletonMode ? 7.5 : w;

  const headBW = getWidth(ANATOMY.HEAD_WIDTH) * 0.6;
  const headTW = getWidth(ANATOMY.HEAD_WIDTH) * 1.4;

  const PartWrapper = ({ part, children }: { part: string; children?: React.ReactNode }) => {
    const isSelected = selectedPart === part;

    const handleMouseDown = (e: React.MouseEvent<SVGGElement>) => { 
      e.stopPropagation(); 
      onMouseDownOnPart?.(part, e); 
    };

    return (
      <g 
        className="cursor-pointer" 
        onMouseDown={handleMouseDown}
        role="button"
        aria-label={`Select ${part}`}
        aria-pressed={isSelected}
      >
        {children}
      </g>
    );
  };

  return (
    <g 
      className="mannequin-root text-ink"
      transform={`translate(${pose.root.x}, ${pose.root.y}) rotate(${pose.rootRotation || 0})`}
    >
      <g style={getStyle('core')}>
        <PartWrapper part="torso">
          <Bone 
            rotation={pose.torso} 
            length={ANATOMY.TORSO} 
            width={getWidth(ANATOMY.TORSO_WIDTH)} 
            variant="wedge"
            rounded={!skeletonMode}
            cutout={skeletonMode ? 0 : 12} 
            showOverlay={showOverlay}
            visible={isVisible('torso')}
            offset={offsets.torso}
            decorations={skeletonMode ? [] : [
              { position: 0.65, shape: 'square', type: 'filled', size: 8 },
              { position: 0.85, shape: 'circle', type: 'filled', size: 10 }
            ]}
          >
            {showOverlay && isVisible('torso') && (
                <>
                    <line x1={0} y1={navelY_Torso} x2={rShoulderX_Adj} y2={rShoulderY_Adj} stroke="#a855f7" strokeWidth={2} opacity={0.9} strokeLinecap="round" />
                    <line x1={0} y1={navelY_Torso} x2={lShoulderX_Adj} y2={lShoulderY_Adj} stroke="#a855f7" strokeWidth={2} opacity={0.9} strokeLinecap="round" />
                    <line x1={rShoulderX_Adj} y1={rShoulderY_Adj} x2={0} y2={neckSink} stroke="#a855f7" strokeWidth={1.5} opacity={0.75} strokeLinecap="round" />
                    <line x1={lShoulderX_Adj} y1={lShoulderY_Adj} x2={0} y2={neckSink} stroke="#a855f7" strokeWidth={1.5} opacity={0.75} strokeLinecap="round" />
                </>
            )}
            <g transform={`translate(0, ${neckSink})`}>
              <PartWrapper part="neck">
              <Bone 
                  rotation={pose.neck} 
                  length={ANATOMY.NECK} 
                  width={getWidth(ANATOMY.NECK_BASE)} 
                  variant="column"
                  showOverlay={showOverlay}
                  visible={isVisible('neck')}
                  offset={offsets.neck}
              >
                   {isVisible('neck') && (
                       <g transform={`translate(0, ${0})`}> 
                          <polygon points={`${-headBW/2},0 ${headBW/2},0 ${headTW/2},${ANATOMY.HEAD} ${-headTW/2},${ANATOMY.HEAD}`} fill="currentColor" />
                          {renderTargetIndicator('head', ANATOMY.HEAD/2)}
                          {showOverlay && (
                            <>
                                <line x1={0} y1={-ANATOMY.NECK} x2={0} y2={ANATOMY.HEAD/2} stroke="#a855f7" strokeWidth={2} opacity={0.9} strokeLinecap="round" />
                                <circle cx="0" cy={ANATOMY.HEAD/2} r={3} fill="#a855f7" />
                            </>
                          )}
                       </g>
                   )}
              </Bone>
              </PartWrapper>
            </g>
            <g transform={`translate(${rShoulderX}, ${shoulderY})`} style={getStyle('r_arm')}> 
              {renderRangeArc('rHand', ANATOMY.UPPER_ARM + ANATOMY.LOWER_ARM + ANATOMY.HAND)}
              <PartWrapper part="rShoulder">
              <Bone 
                rotation={90 + pose.rShoulder} 
                corrective={pose.rBicepCorrective}
                length={ANATOMY.UPPER_ARM} 
                width={getWidth(ANATOMY.LIMB_WIDTH_ARM * 0.6)} 
                variant="limb-tapered" 
                showOverlay={showOverlay}
                visible={isVisible('rShoulder')}
                offset={offsets.rShoulder}
                decorations={skeletonMode ? [] : [{ position: 0, shape: 'circle', type: 'filled', size: shoulderSize }]}
              >
                <PartWrapper part="rForearm">
                <Bone 
                    rotation={pose.rForearm} 
                    length={ANATOMY.LOWER_ARM} 
                    width={getWidth(ANATOMY.LIMB_WIDTH_FOREARM * 0.6)}
                    variant="limb-tapered"
                    showOverlay={showOverlay}
                    visible={isVisible('rForearm')}
                    offset={offsets.rForearm}
                >
                  <PartWrapper part="rWrist">
                  <Bone 
                    rotation={pose.rWrist} 
                    length={ANATOMY.HAND} 
                    width={getWidth(ANATOMY.EFFECTOR_WIDTH)} 
                    variant="arrowhead" 
                    showOverlay={showOverlay}
                    visible={isVisible('rWrist')}
                    offset={offsets.rWrist}
                   >
                     <g transform={`translate(0, ${ANATOMY.HAND})`}>
                        {renderTargetIndicator('rHand')}
                     </g>
                   </Bone>
                   </PartWrapper>
                </Bone>
                </PartWrapper>
              </Bone>
              </PartWrapper>
            </g>
            <g transform={`translate(${lShoulderX}, ${shoulderY})`} style={getStyle('l_arm')}>
              {renderRangeArc('lHand', ANATOMY.UPPER_ARM + ANATOMY.LOWER_ARM + ANATOMY.HAND)}
              <PartWrapper part="lShoulder">
              <Bone 
                rotation={-(90 + pose.lShoulder)} 
                corrective={pose.lBicepCorrective}
                length={ANATOMY.UPPER_ARM} 
                width={getWidth(ANATOMY.LIMB_WIDTH_ARM * 0.6)}
                variant="limb-tapered"
                showOverlay={showOverlay}
                visible={isVisible('lShoulder')}
                offset={offsets.lShoulder}
                decorations={skeletonMode ? [] : [{ position: 0, shape: 'circle', type: 'filled', size: shoulderSize }]}
              >
                 <PartWrapper part="lForearm">
                 <Bone 
                    rotation={pose.lForearm} 
                    length={ANATOMY.LOWER_ARM} 
                    width={getWidth(ANATOMY.LIMB_WIDTH_FOREARM * 0.6)}
                    variant="limb-tapered"
                    showOverlay={showOverlay}
                    visible={isVisible('lForearm')}
                    offset={offsets.lForearm}
                >
                    <PartWrapper part="lWrist">
                    <Bone 
                        rotation={pose.lWrist} 
                        length={ANATOMY.HAND} 
                        width={getWidth(ANATOMY.EFFECTOR_WIDTH)} 
                        variant="arrowhead" 
                        showOverlay={showOverlay}
                        visible={isVisible('lWrist')}
                        offset={offsets.lWrist}
                    >
                        <g transform={`translate(0, ${ANATOMY.HAND})`}>
                            {renderTargetIndicator('lHand')}
                        </g>
                    </Bone>
                    </PartWrapper>
                 </Bone>
                 </PartWrapper>
              </Bone>
              </PartWrapper>
            </g>
          </Bone>
        </PartWrapper>
      </g>
      <g style={getStyle('core')}>
          <PartWrapper part="hips">
          <Bone 
            rotation={pose.hips} 
            length={ANATOMY.PELVIS} 
            width={getWidth(ANATOMY.HIP_WIDTH * 0.65)} 
            variant="pelvis"
            rounded={!skeletonMode}
            showOverlay={showOverlay}
            visible={isVisible('hips')}
            offset={offsets.hips}
            decorations={[]}
          >
            {showOverlay && isVisible('hips') && (
                <>
                    <line x1={0} y1={navelY_Pelvis} x2={rHipX} y2={hipY} stroke="#a855f7" strokeWidth={2} opacity={0.9} strokeLinecap="round" />
                    <line x1={0} y1={navelY_Pelvis} x2={lHipX} y2={hipY} stroke="#a855f7" strokeWidth={2} opacity={0.9} strokeLinecap="round" />
                </>
            )}
            <g transform={`translate(${rHipX}, ${hipY})`} style={getStyle('r_leg')}>
              {renderRangeArc('rFoot', ANATOMY.LEG_UPPER + ANATOMY.LEG_LOWER + ANATOMY.FOOT)}
              <PartWrapper part="rThigh">
              <Bone 
                rotation={pose.rThigh} 
                corrective={pose.rThighCorrective}
                length={ANATOMY.LEG_UPPER} 
                width={getWidth(ANATOMY.LIMB_WIDTH_THIGH * 0.6)}
                variant="limb-tapered"
                showOverlay={showOverlay}
                visible={isVisible('rThigh')}
                offset={offsets.rThigh}
              >
                   <PartWrapper part="rCalf">
                   <Bone 
                    rotation={pose.rCalf} 
                    length={ANATOMY.LEG_LOWER} 
                    width={getWidth(ANATOMY.LIMB_WIDTH_CALF * 0.6)}
                    variant="limb-tapered"
                    showOverlay={showOverlay}
                    visible={isVisible('rCalf')}
                    offset={offsets.rCalf}
                   >
                        <PartWrapper part="rAnkle">
                        <Bone 
                            rotation={-90 + pose.rAnkle} 
                            length={ANATOMY.FOOT} 
                            width={getWidth(ANATOMY.EFFECTOR_WIDTH)} 
                            variant="arrowhead" 
                            showOverlay={showOverlay}
                            visible={isVisible('rAnkle')}
                            offset={offsets.rAnkle}
                        >
                            <g transform={`translate(0, ${ANATOMY.FOOT})`}>
                                {renderTargetIndicator('rFoot')}
                            </g>
                        </Bone>
                        </PartWrapper>
                   </Bone>
                   </PartWrapper>
              </Bone>
              </PartWrapper>
            </g>
             <g transform={`translate(${lHipX}, ${hipY})`} style={getStyle('l_leg')}>
              {renderRangeArc('lFoot', ANATOMY.LEG_UPPER + ANATOMY.LEG_LOWER + ANATOMY.FOOT)}
              <PartWrapper part="lThigh">
              <Bone 
                rotation={pose.lThigh} 
                corrective={pose.lThighCorrective}
                length={ANATOMY.LEG_UPPER} 
                width={getWidth(ANATOMY.LIMB_WIDTH_THIGH * 0.6)}
                variant="limb-tapered"
                showOverlay={showOverlay}
                visible={isVisible('lThigh')}
                offset={offsets.lThigh}
              >
                   <PartWrapper part="lCalf">
                   <Bone 
                    rotation={pose.lCalf} 
                    length={ANATOMY.LEG_LOWER} 
                    width={getWidth(ANATOMY.LIMB_WIDTH_CALF * 0.6)}
                    variant="limb-tapered"
                    showOverlay={showOverlay}
                    visible={isVisible('lThigh')}
                    offset={offsets.lThigh}
                   >
                        <PartWrapper part="lAnkle">
                        <Bone 
                            rotation={90 + pose.lAnkle} 
                            length={ANATOMY.FOOT} 
                            width={getWidth(ANATOMY.EFFECTOR_WIDTH)} 
                            variant="arrowhead" 
                            showOverlay={showOverlay}
                            visible={isVisible('lAnkle')}
                            offset={offsets.lAnkle}
                        >
                            <g transform={`translate(0, ${ANATOMY.FOOT})`}>
                                {renderTargetIndicator('lFoot')}
                            </g>
                        </Bone>
                        </PartWrapper>
                   </Bone>
                   </PartWrapper>
              </Bone>
              </PartWrapper>
            </g>
          </Bone>
          </PartWrapper>
      </g>
    </g>
  );
};
