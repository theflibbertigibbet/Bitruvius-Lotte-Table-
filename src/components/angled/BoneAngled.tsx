import React from 'react';
import { BonePropsAngled, BoneVariant } from './typesAngled';

// 1. The Bone Geometry (SVG Path)
const getBonePath = (length: number, width: number, variant: BoneVariant = 'diamond', cutout: number = 0) => {
  switch (variant) {
    case 'wedge':
      if (cutout > 0) {
        const shoulderX = width / 2;
        const shoulderY = length - cutout;
        const neckX = width * 0.15; 
        const neckY = length;
        return `
          M 0 0 
          L ${shoulderX} ${shoulderY} 
          L ${neckX} ${neckY}
          L ${-neckX} ${neckY}
          L ${-shoulderX} ${shoulderY}
          Z
        `;
      }
      return `M 0 0 L ${width / 2} ${length} L ${-width / 2} ${length} Z`;
    
    case 'pelvis':
      return `M 0 0 L ${width * 0.3} ${length} L ${-width * 0.3} ${length} Z`;

    case 'taper':
      return `M ${width/2} 0 L 0 ${length} L ${-width/2} 0 Z`;
    
    case 'column':
      return `M ${width/2} 0 L ${width/2} ${length} L ${-width/2} ${length} L ${-width/2} 0 Z`;

    case 'arrowhead':
      const hBaseWidth = width * 0.4; 
      const hMaxWidth = width;
      const flareY = length * 0.2; 
      return `M ${-hBaseWidth / 2} 0 L ${hBaseWidth / 2} 0 L ${hMaxWidth / 2} ${flareY} L 0 ${length} L ${-hMaxWidth / 2} ${flareY} Z`;

    case 'limb-tapered':
      const endW = width * 0.4;
      return `M ${width / 2} 0 L ${endW / 2} ${length} L ${-endW / 2} ${length} L ${-width / 2} 0 Z`;

    case 'diamond':
    default:
      const split = length * 0.4;
      return `M 0 0 L ${width / 2} ${split} L 0 ${length} L ${-width / 2} ${split} Z`;
  }
};

export const BoneAngled: React.FC<BonePropsAngled> = ({ 
  rotation, 
  corrective = 0,
  length, 
  width = 15, 
  variant = 'diamond',
  rounded = false,
  cutout = 0,
  decorations,
  showOverlay = true,
  visible = true,
  offset = { x: 0, y: 0 },
  children 
}) => {
  const rad = corrective * (Math.PI / 180);
  const shiftX = length * Math.sin(rad);
  const shiftY = length * (1 - Math.cos(rad));
  
  const finalX = shiftX + offset.x;
  const finalY = shiftY + offset.y;

  const transform = corrective !== 0 || offset.x !== 0 || offset.y !== 0
    ? `translate(${finalX}, ${finalY}) rotate(${rotation + corrective})`
    : `rotate(${rotation})`;

  return (
    <g transform={transform}>
      {visible && (
          <>
            <path 
                d={getBonePath(length, width, variant as BoneVariant, cutout)} 
                fill="currentColor" 
                stroke={rounded ? "currentColor" : "none"}
                strokeWidth={rounded ? width * 0.15 : 0}
                strokeLinejoin={rounded ? "round" : "miter"}
                strokeLinecap={rounded ? "round" : "butt"}
            />
            {showOverlay && (
                <line 
                    x1={0} y1={0} 
                    x2={0} y2={length} 
                    stroke="#a855f7" 
                    strokeWidth={2} 
                    opacity={0.9}
                    strokeLinecap="round"
                />
            )}
            {decorations && decorations.map((d, i) => {
                const y = length * d.position;
                const size = d.size || 7;
                const r = size / 2;
                const fill = d.type === 'hole' ? '#fdf6e3' : 'currentColor';
                return (
                <g key={`deco-${i}`} transform={`translate(0, ${y})`}>
                    {d.shape === 'circle' && (
                    <circle cx={0} cy={0} r={r} fill={fill} />
                    )}
                    {d.shape === 'square' && (
                    <rect x={-r} y={-r} width={size} height={size} fill={fill} />
                    )}
                    {d.shape === 'triangle' && (
                    <polygon points={`0,${-r} ${-r},${r} ${r},${r}`} fill={fill} />
                    )}
                </g>
                );
            })}
          </>
      )}
      <g transform={`translate(0, ${length}) rotate(${-corrective})`}>
        {children}
      </g>
      {showOverlay && visible && (
        <circle cx="0" cy="0" r="5" fill="#15803d" />
      )}
    </g>
  );
};
