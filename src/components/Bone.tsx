import React, { useMemo } from 'react';
import { Vector2D, JointConstraint, RenderMode, PartName } from '../types';
import { ANATOMY, COLORS, TIPTOE } from '../constants';
import { adjustBrightness } from '../utils/color-utils';

export interface BoneProps { 
  rotation: number;
  length: number;
  width?: number;
  variant?: 'diamond' | 'waist-teardrop-pointy-up' | 'torso-teardrop-pointy-down' | 'collar-yoke' | 'deltoid-shape' | 'limb-tapered' | 'head-tall-oval' | 'hand-foot-arrowhead-shape';
  showOverlay?: boolean;
  visible?: boolean;
  offset?: Vector2D;
  className?: string;
  children?: React.ReactNode;
  drawsUpwards?: boolean;
  fillOverride?: string; 
  isSelected?: boolean;
  constraint?: JointConstraint;
  renderMode?: RenderMode;
  partCategory?: string; 
  darken20Percent?: boolean; 
  tennisBallMode?: boolean; 
  velocity?: number; 
  partName?: PartName;
  jointTrails?: Vector2D[];
  kineticsMode?: string;
  globalRotation?: number; 
  isBracing?: boolean; 
  isStrained?: boolean;
}

export const COLORS_BY_CATEGORY: { [category: string]: string } = { 
  head: COLORS.EXTREMITY_WHITE,
  hand: COLORS.EXTREMITY_WHITE,
  foot: COLORS.EXTREMITY_WHITE,
  bicep: COLORS.MEDIUM_GRAY_BICEP,
  forearm: COLORS.DARKER_GRAY_FOREARM,
  collar: COLORS.OLIVE_COLLAR,
  torso: COLORS.CORE_MEDIUM_GRAY_TORSO,
  waist: COLORS.CORE_LIGHT_GRAY_WAIST,
  thigh: COLORS.DARK_GRAY_THIGH, 
  shin: COLORS.VERY_DARK_GRAY_SHIN,
  default: COLORS.DEFAULT_FILL,
};

const getPartCategoryColor = (category?: string) => {
  if (category && COLORS_BY_CATEGORY[category]) return COLORS_BY_CATEGORY[category];
  return COLORS.DEFAULT_FILL;
};

export const Bone: React.FC<BoneProps> = ({
  rotation,
  length,
  width = 15,
  variant = 'diamond',
  showOverlay = true,
  visible = true,
  offset = { x: 0, y: 0 },
  className,
  children,
  drawsUpwards = false,
  fillOverride,
  isSelected = false,
  constraint = 'fk',
  renderMode = 'default', 
  partCategory, 
  darken20Percent = false, 
  tennisBallMode = false,
  velocity = 0,
  partName,
  jointTrails = [],
  kineticsMode = 'clay',
  globalRotation = 0,
  isBracing = false,
  isStrained = false,
}) => {
  const isVisualStrain = useMemo(() => {
    if (isStrained) return true;
    if (partName === PartName.RAnkle || partName === PartName.LAnkle) {
      return Math.abs(globalRotation) > TIPTOE.TENSION_THRESHOLD;
    }
    return false;
  }, [globalRotation, partName, isStrained]);

  const getBonePath = (length: number, width: number, variant: string, drawsUpwards: boolean): string => {
    const effectiveLength = drawsUpwards ? -length : length;

    switch (variant) {
      case 'head-tall-oval':
        const hH = ANATOMY.HEAD;
        const bW = ANATOMY.HEAD_BASE_WIDTH;
        const tW = ANATOMY.HEAD_TOP_WIDTH;
        return `M ${-bW / 2},0 L ${bW / 2},0 L ${tW / 2},${-hH} L ${-tW / 2},${-hH} Z`;
      case 'collar-yoke':
        const cHeight = ANATOMY.COLLAR;
        const cWidth = ANATOMY.COLLAR_WIDTH;
        // Concave Triangle (Reuleaux variant) with "inverted rounded edges"
        // Starting at Bottom Pivot (0,0) (neck base)
        return `M 0,0
                Q ${-cWidth * 0.1},${-cHeight * 0.3} ${-cWidth / 2},${-cHeight}
                Q 0,${-cHeight * 0.85} ${cWidth / 2},${-cHeight}
                Q ${cWidth * 0.1},${-cHeight * 0.3} 0,0 Z`;
      case 'waist-teardrop-pointy-up':
        const wHeight = ANATOMY.WAIST;
        const wWidth = ANATOMY.WAIST_WIDTH;
        return `M ${wWidth / 2},0 L ${wWidth * 0.4},${-wHeight} L ${-wWidth * 0.4},${-wHeight} L ${-wWidth / 2},0 Z`;
      case 'torso-teardrop-pointy-down':
        const tHeight = ANATOMY.TORSO;
        const tWidth = ANATOMY.TORSO_WIDTH;
        return `M ${tWidth * 0.4},0 L ${tWidth / 2},${-tHeight} L ${-tWidth / 2},${-tHeight} L ${-tWidth * 0.4},0 Z`;
      case 'hand-foot-arrowhead-shape':
        const hBaseWidth = width * 0.3; 
        const hMaxWidth = width;
        const flareY = effectiveLength * 0.25; 
        const archBias = isVisualStrain ? TIPTOE.ARCH_SCALE_MAX : 1.0;
        return `M ${-hBaseWidth / 2},0 L ${hBaseWidth / 2},0 L ${hMaxWidth / 2 * archBias},${flareY} L 0,${effectiveLength} L ${-hMaxWidth / 2 * archBias},${flareY} Z`;
      default:
        const halfWidth = width / 2;
        return `M 0 0 L ${halfWidth} ${effectiveLength * 0.4} L 0 ${effectiveLength} L ${-halfWidth} ${effectiveLength * 0.4} Z`;
    }
  };

  const partCategoryColor = getPartCategoryColor(partCategory);
  const pathFill = useMemo(() => {
    if (tennisBallMode) return "#800080";
    if (renderMode === 'wireframe') return 'none';
    if (renderMode === 'silhouette') return COLORS.DEFAULT_FILL;
    let finalFill = fillOverride || partCategoryColor;
    if (darken20Percent) finalFill = adjustBrightness(finalFill, 0.8);
    if (isVisualStrain) return COLORS.TENSION_PINK;
    if (constraint === 'curl') return COLORS.GREEN_CURL;
    if (constraint === 'stretch') return COLORS.PURPLE_STRETCH;
    return finalFill;
  }, [renderMode, constraint, fillOverride, partCategoryColor, darken20Percent, tennisBallMode, isVisualStrain]);

  const shadowOffset = useMemo(() => {
    const worldDX = 4;
    const worldDY = 4;
    const angleRad = -(globalRotation * Math.PI) / 180;
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: worldDX * cos - worldDY * sin,
      y: worldDX * sin + worldDY * cos
    };
  }, [globalRotation]);

  const visualEndPoint = drawsUpwards ? -length : length;
  const transform = `rotate(${rotation})`;
  const bonePath = getBonePath(length, width, variant, drawsUpwards);

  return (
    <g transform={transform} className={className}>
      {visible && (
        <React.Fragment>
          {!tennisBallMode && renderMode !== 'wireframe' && (
            <path
              d={bonePath}
              fill={COLORS.SHADOW}
              transform={`translate(${shadowOffset.x}, ${shadowOffset.y})`}
              className="pointer-events-none"
            />
          )}
          <path
            d={bonePath}
            fill={pathFill}
            stroke={isSelected ? COLORS.SELECTION : (isBracing ? COLORS.SELECTION : (isVisualStrain ? COLORS.TENSION_PINK : 'rgba(0,0,0,0.15)'))}
            strokeWidth={isSelected ? 3 : (isBracing ? 2.5 : (isVisualStrain ? 4 : 1.5))}
            strokeDasharray={isBracing ? "4 2" : "none"}
            className={`${isVisualStrain ? "animate-pulse" : ""} transition-all duration-300`}
          />
        </React.Fragment>
      )}
      <g transform={`translate(0, ${visualEndPoint})`}>{children}</g>
      {showOverlay && visible && (
        <g className="anchor-dot pointer-events-none">
          <circle cx="0" cy="0" r={isSelected ? 9 : 7} fill="rgba(0,0,0,0.3)" />
          <circle 
            cx="0" cy="0" 
            r={isSelected ? 7 : 5} 
            fill={isBracing ? COLORS.SELECTION : (isVisualStrain ? COLORS.TENSION_PINK : COLORS.ANCHOR_RED)} 
            stroke="rgba(0,0,0,0.4)"
            strokeWidth="1.5"
            className="drop-shadow-sm transition-colors duration-200" 
          />
        </g>
      )}
    </g>
  );
};
