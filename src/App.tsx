import React, { useState, useEffect, useRef } from 'react';
import LightTable from './components/LightTable';
import { ClickWheel } from './components/ClickWheel';
import { PartName, RotationMode, Pose } from './types';
import { PoseAngled } from './components/angled/typesAngled';

export default function App() {
  const [lightHue, setLightHue] = useState('#ffffff');
  const [intensity, setIntensity] = useState(1);
  const [fadeSpeed, setFadeSpeed] = useState('0.2s');
  const [blendMode, setBlendMode] = useState('multiply');
  const [showGrid, setShowGrid] = useState(true);
  const [showObjects, setShowObjects] = useState(true);
  const [activeModel, setActiveModel] = useState<'knight' | 'mannequin'>('knight');

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // ClickWheel state
  const [selectedPart, setSelectedPart] = useState<PartName | null>(null);
  const [anchor, setAnchor] = useState<string>('root');
  const [rotationMode, setRotationMode] = useState<RotationMode>('none');
  const [useInertia, setUseInertia] = useState(false);
  const [partRotationModes, setPartRotationModes] = useState<Record<PartName, RotationMode>>(
    Object.values(PartName).reduce((acc, part) => {
      acc[part as PartName] = 'none';
      return acc;
    }, {} as Record<PartName, RotationMode>)
  );

  const W = 12 * 60; // 720
  const H = 9 * 60; // 540

  const [poseKnight, setPoseKnight] = useState<Pose>({
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
  });

    const [poseMannequin, setPoseMannequin] = useState<PoseAngled>({
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
    });

    const isDraggingPartRef = useRef(false);
    const lastMouseYRef = useRef<number | null>(null);

    useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (!isDraggingPartRef.current || lastMouseYRef.current === null || !selectedPart) return;
        
        const deltaY = e.clientY - lastMouseYRef.current;
        lastMouseYRef.current = e.clientY;
        
        // Adjust rotation speed here. Negative deltaY means moving mouse up -> positive rotation
        const rotationDelta = -deltaY * 0.5; 
        handleRotate(rotationDelta);
      };

      const handleMouseUp = () => {
        isDraggingPartRef.current = false;
        lastMouseYRef.current = null;
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [selectedPart, activeModel]);

    const handlePartMouseDown = (part: PartName, e: React.MouseEvent) => {
      setSelectedPart(part);
      isDraggingPartRef.current = true;
      lastMouseYRef.current = e.clientY;
    };

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const TABLE_WIDTH = 784;
        const TABLE_HEIGHT = 604; 
        const margin = 0;
        const scaleX = (clientWidth - margin) / TABLE_WIDTH;
        const scaleY = (clientHeight - margin) / TABLE_HEIGHT;
        setScale(Math.min(scaleX, scaleY));
      }
    };

    window.addEventListener('resize', updateScale);
    updateScale();
    const timeout = setTimeout(updateScale, 100);

    return () => {
      window.removeEventListener('resize', updateScale);
      clearTimeout(timeout);
    };
  }, []);

  const handleRotate = (delta: number) => {
    if (!selectedPart) return;

    if (activeModel === 'knight') {
      setPoseKnight(prev => {
        const newPose = { ...prev };
        // Map PartName to Pose key
        const key = selectedPart as keyof Pose;
        if (typeof newPose[key] === 'number') {
          (newPose[key] as number) += delta;
        }
        return newPose;
      });
    } else {
      setPoseMannequin(prev => {
        const newPose = { ...prev };
        // Map PartName to PoseAngled key
        let key = selectedPart as string;
        if (key === PartName.Collar) key = 'neck';
        if (key === PartName.Waist) key = 'hips';
        if (key === PartName.RSkin) key = 'rCalf';
        if (key === PartName.LSkin) key = 'lCalf';
        
        if (key in newPose && typeof (newPose as any)[key] === 'number') {
          (newPose as any)[key] += delta;
        }
        return newPose;
      });
    }
  };

  const handleCycleRotationMode = () => {
    setRotationMode(prev => prev === 'none' ? 'offset' : prev === 'offset' ? 'match' : 'none');
  };

  const handleSelectNextPart = () => {
    const parts = Object.values(PartName);
    if (!selectedPart) {
      setSelectedPart(parts[0]);
    } else {
      const idx = parts.indexOf(selectedPart);
      setSelectedPart(parts[(idx + 1) % parts.length]);
    }
  };

  const handleSelectPrevPart = () => {
    const parts = Object.values(PartName);
    if (!selectedPart) {
      setSelectedPart(parts[parts.length - 1]);
    } else {
      const idx = parts.indexOf(selectedPart);
      setSelectedPart(parts[(idx - 1 + parts.length) % parts.length]);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] text-[#e5e5e5] overflow-hidden font-mono">
      {/* Mechanical Control Deck */}
      <header className="bg-black/90 backdrop-blur-md border-b-2 border-[#333] p-4 z-50 grid grid-cols-1 md:grid-cols-5 gap-6 items-center shadow-2xl shrink-0">
        <div className="space-y-1">
          <h1 className="text-xs font-bold text-blue-400 tracking-widest uppercase">Trick-Table Engine</h1>
          <div className="flex gap-2 items-center mt-2">
            <input 
              type="color" 
              value={lightHue} 
              onChange={(e) => setLightHue(e.target.value)}
              className="w-8 h-8 rounded border-2 border-zinc-600 cursor-pointer bg-transparent"
            />
            <select 
              value={lightHue}
              onChange={(e) => setLightHue(e.target.value)}
              className="bg-zinc-800 text-[10px] p-1 border border-zinc-700 rounded"
            >
              <option value="#ffffff">Daylight (Clean)</option>
              <option value="#fff4e5">Incandescent (Warm)</option>
              <option value="#e5f4ff">Arc-Light (Cool)</option>
              <option value="#ffdfdf">Soft Rose</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-zinc-500 font-bold">
            Luminous Intensity: <span>{Math.round(intensity * 100)}</span>%
          </label>
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={intensity}
            onChange={(e) => setIntensity(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex items-center gap-2">
            <input 
              type="checkbox" 
              onChange={(e) => setFadeSpeed(e.target.checked ? '3.0s' : '0.2s')}
              className="accent-blue-500"
            />
            <span className="text-[10px] text-zinc-400">Mechanical Fade (Lag)</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-zinc-500 font-bold">Lens/Filter Effect</label>
          <select 
            value={blendMode}
            onChange={(e) => setBlendMode(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded p-1 text-xs text-zinc-300"
          >
            <option value="multiply">Shadow Mode (Multiply)</option>
            <option value="screen">Projection Mode (Screen)</option>
            <option value="overlay">Contrast Mode (Overlay)</option>
            <option value="normal">Transparent (Normal)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-zinc-500 font-bold">Canvas Grid (12x9)</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowGrid(!showGrid)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 py-1 rounded text-[10px]"
            >
              Toggle Grids
            </button>
            <button 
              onClick={() => setShowObjects(!showObjects)}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 py-1 rounded text-[10px]"
            >
              Clear Table
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] uppercase text-zinc-500 font-bold">Active Model</label>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveModel(prev => prev === 'knight' ? 'mannequin' : 'knight')}
              className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 py-1 rounded text-[10px] font-bold"
            >
              {activeModel === 'knight' ? 'Knight (Active)' : 'Mannequin (Active)'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-grow flex items-center justify-center bg-black overflow-hidden relative">
        <div ref={containerRef} className="flex-1 h-full flex items-center justify-center relative">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
            <LightTable 
                lightHue={lightHue}
                intensity={intensity}
                fadeSpeed={fadeSpeed}
                showGrid={showGrid}
                showObjects={showObjects}
                blendMode={blendMode}
                activeModel={activeModel}
                poseKnight={poseKnight}
                poseMannequin={poseMannequin}
                onMouseDownOnPart={handlePartMouseDown}
                selectedPart={selectedPart}
            />
            </div>
        </div>
        
        {/* ClickWheel Sidebar */}
        <div className="w-80 h-full bg-zinc-900 border-l border-zinc-800 flex flex-col items-center justify-center shrink-0 z-10 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
            <div className="mb-8 text-center">
                <h2 className="text-zinc-400 font-bold tracking-widest uppercase text-sm">FK Controls</h2>
                <p className="text-zinc-600 text-xs mt-1">Select part and drag wheel</p>
            </div>
            <ClickWheel 
                onRotate={handleRotate}
                selectedPartName={selectedPart}
                anchor={anchor}
                onCycleRotationMode={handleCycleRotationMode}
                rotationMode={rotationMode}
                onToggleAnchorMenu={() => setAnchor(prev => prev === 'root' ? 'torso' : 'root')}
                useInertia={useInertia}
                onToggleInertia={() => setUseInertia(!useInertia)}
                onSelectNextPart={handleSelectNextPart}
                onSelectPrevPart={handleSelectPrevPart}
                partRotationModes={partRotationModes}
            />
        </div>
      </main>

      <footer className="p-2 text-[9px] text-zinc-600 text-center bg-black/90 backdrop-blur-md border-t-2 border-[#333] tracking-widest uppercase shrink-0">
        Instructional Shadow Film Apparatus — 12x9 Precision Grid
      </footer>
    </div>
  );
}
