import React, { useRef, useState, useEffect, useCallback } from 'react';
import { PartName, RotationMode, PART_ABBREVIATIONS } from '../types';

interface ClickWheelProps {
  onRotate: (delta: number) => void;
  selectedPartName: string | null;
  anchor: string;
  onCycleRotationMode: () => void;
  onDoubleClickRotationMode?: () => void;
  rotationMode: RotationMode;
  onToggleAnchorMenu: () => void;
  useInertia: boolean;
  onToggleInertia: () => void;
  onSelectNextPart: () => void;
  onSelectPrevPart: () => void;
  partRotationModes: Record<PartName, RotationMode>;
}

// 0 is right, 90 up, 180 left, 270 down
const PART_ICON_ANGLES: Record<PartName, number> = {
    [PartName.Head]: 90,
    [PartName.Collar]: 75,
    [PartName.Torso]: 105,
    [PartName.Waist]: 270,
    [PartName.RShoulder]: 45,
    [PartName.RElbow]: 25,
    [PartName.RWrist]: 5,
    [PartName.RThigh]: 315,
    [PartName.RSkin]: 335,
    [PartName.RAnkle]: 350,
    [PartName.LThigh]: 225,
    [PartName.LSkin]: 205,
    [PartName.LAnkle]: 190,
    [PartName.LShoulder]: 135,
    [PartName.LElbow]: 155,
    [PartName.LWrist]: 175,
};

export const ClickWheel: React.FC<ClickWheelProps> = ({ 
    onRotate, 
    selectedPartName, 
    anchor, 
    onCycleRotationMode, 
    onDoubleClickRotationMode, 
    rotationMode, 
    onToggleAnchorMenu,
    useInertia,
    onToggleInertia,
    onSelectNextPart,
    onSelectPrevPart,
    partRotationModes,
}) => {
  const wheelRef = useRef<HTMLDivElement>(null);
  const lastAngleRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [visualRotation, setVisualRotation] = useState(0);
  const ROTATION_DAMPENING = 0.5;
  
  const activeModeParts = Object.entries(partRotationModes)
      .filter(([, mode]) => mode !== 'none')
      .map(([part, mode]) => ({ part: part as PartName, mode }));

  const handleInteractionMove = useCallback((clientX: number, clientY: number) => {
    if (!wheelRef.current || lastAngleRef.current === null) return;
    
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    let deltaAngle = angle - lastAngleRef.current;

    // Handle wrapping around -PI to PI
    if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI;
    if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI;

    lastAngleRef.current = angle;
    
    const rotationDegrees = deltaAngle * (180 / Math.PI) * ROTATION_DAMPENING;

    onRotate(rotationDegrees);
    setVisualRotation(prev => prev + rotationDegrees);
    
  }, [onRotate]);

  const handleInteractionEnd = useCallback(() => {
    setIsDragging(false);
    lastAngleRef.current = null;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientX, e.touches[0].clientY);
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleInteractionEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);
  
  const handleInteractionStart = (clientX: number, clientY: number) => {
    if (!wheelRef.current) return;
    setIsDragging(true);
    const rect = wheelRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - centerY, clientX - centerX);
    lastAngleRef.current = angle;
  };

  return (
    <div
      ref={wheelRef}
      style={{ transform: `rotate(${visualRotation}deg)` }}
      className="relative w-72 h-72 rounded-full bg-zinc-800 flex items-center justify-center cursor-grab active:cursor-grabbing shadow-inner"
      onMouseDown={(e) => handleInteractionStart(e.clientX, e.clientY)}
      onTouchStart={(e) => handleInteractionStart(e.touches[0].clientX, e.touches[0].clientY)}
    >
      {/* Rotation Mode Indicators */}
      {activeModeParts.map(({ part, mode }) => {
        const angleRad = (PART_ICON_ANGLES[part]) * Math.PI / 180;
        const radius = 128; // pixels, radius of the icon circle
        const x = radius * Math.cos(angleRad);
        const y = -radius * Math.sin(angleRad); // Negative because screen Y is inverted
        const color = mode === 'offset' ? 'text-red-500' : 'text-green-500';

        return (
          <div
            key={part}
            className={`absolute top-1/2 left-1/2 w-7 h-7 -mt-3.5 -ml-3.5 flex items-center justify-center font-mono font-bold text-xs ${color} pointer-events-none`}
            style={{ transform: `translate(${x}px, ${y}px) rotate(${-visualRotation}deg)` }}
          >
            <span>{PART_ABBREVIATIONS[part]}</span>
          </div>
        );
      })}

      {/* Inner Screen */}
      <div 
        style={{ transform: `rotate(${-visualRotation}deg)` }}
        className="w-56 h-56 rounded-full bg-zinc-900 flex flex-col items-center justify-center text-center p-2 border-4 border-zinc-700 overflow-hidden">
        
        {/* Top Section: Anchor */}
        <button onClick={onToggleAnchorMenu} className="flex-1 w-full flex items-center justify-center hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-600 border-b border-zinc-800">
            <div className="text-center">
                <div className="text-[10px] font-mono text-zinc-500 uppercase">Anchor</div>
                <div className="font-mono text-base text-zinc-300 uppercase">
                    {anchor || 'NONE'}
                </div>
            </div>
        </button>
        
        {/* Middle Section: Part Name and Offset buttons */}
        <div className="flex-1 w-full flex items-center justify-around px-1">
            <button onClick={onSelectPrevPart} className="px-1 text-zinc-500 hover:text-zinc-300 text-lg">‹</button>
            <div className="flex-grow flex flex-col items-center justify-center">
                <div className="font-mono text-sm text-zinc-300 uppercase tracking-widest truncate">
                    {selectedPartName || '--'}
                </div>
                {selectedPartName && (
                    <div className="flex items-center gap-1 mt-1">
                        <button
                            onClick={onCycleRotationMode}
                            onDoubleClick={onDoubleClickRotationMode}
                            className={`px-2 py-0.5 rounded text-xs font-mono uppercase transition-colors ${
                                rotationMode !== 'none'
                                    ? 'bg-zinc-300 text-zinc-900 font-bold'
                                    : 'bg-transparent border border-zinc-500 text-zinc-500'
                            }`}
                            title="Cycle Link Mode (Offset/Match, Double-click for chain)"
                        >
                            {rotationMode === 'none' ? 'LINK' : rotationMode.toUpperCase()}
                        </button>
                        {rotationMode !== 'none' && (
                            <button
                              onClick={onToggleInertia}
                              className={`px-2 py-0.5 rounded text-xs font-mono uppercase transition-colors ${
                                useInertia ? 'bg-zinc-300 text-zinc-900 font-bold' : 'bg-transparent border border-zinc-500 text-zinc-500'
                              }`}
                              title="Toggle Inertia"
                            >
                              Inertia
                            </button>
                        )}
                    </div>
                )}
            </div>
             <button onClick={onSelectNextPart} className="px-1 text-zinc-500 hover:text-zinc-300 text-lg">›</button>
        </div>

        {/* Bottom Section */}
        <div className="flex-1 w-full flex items-center justify-center gap-2 border-t border-zinc-800">
            <button onClick={() => onRotate(-10)} className="w-12 text-center text-xs font-mono font-bold text-zinc-500 hover:text-zinc-300 transition-colors">-10</button>
            <button onClick={() => onRotate(-1)} className="w-12 text-center text-xs font-mono font-bold text-zinc-500 hover:text-zinc-300 transition-colors">-1</button>
            <button onClick={() => onRotate(1)} className="w-12 text-center text-xs font-mono font-bold text-zinc-500 hover:text-zinc-300 transition-colors">+1</button>
            <button onClick={() => onRotate(10)} className="w-12 text-center text-xs font-mono font-bold text-zinc-500 hover:text-zinc-300 transition-colors">+10</button>
        </div>
      </div>
    </div>
  );
}
