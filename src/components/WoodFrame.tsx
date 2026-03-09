import React, { ReactNode } from "react";

interface WoodFrameProps {
  children: ReactNode;
}

export default function WoodFrame({ children }: WoodFrameProps) {
  const frameV = "linear-gradient(180deg, #4a4a4a 0%, #666 8%, #3a3a3a 15%, #5a5a5a 25%, #666 38%, #4a4a4a 50%, #5a5a5a 62%, #3a3a3a 72%, #666 82%, #4a4a4a 92%, #5a5a5a 100%)";
  const frameH = "linear-gradient(90deg, #4a4a4a 0%, #666 8%, #3a3a3a 15%, #5a5a5a 25%, #666 38%, #4a4a4a 50%, #5a5a5a 62%, #3a3a3a 72%, #666 82%, #4a4a4a 92%, #5a5a5a 100%)";
  const corner = "linear-gradient(135deg, #5a5a5a, #3a3a3a)";

  return (
    <div className="relative inline-block" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)" }}>

      {/* Top bar */}
      <div className="relative h-8" style={{ background: frameH, boxShadow: "inset 0 2px 3px rgba(255,255,255,0.12), inset 0 -1px 2px rgba(0,0,0,0.3)" }}>
        <div className="absolute left-0 top-0 w-8 h-8" style={{ background: corner }} />
        <div className="absolute right-0 top-0 w-8 h-8" style={{ background: "linear-gradient(-135deg, #5a5a5a, #3a3a3a)" }} />
        <FrameScrew className="left-2 top-2" />
        <FrameScrew className="right-2 top-2" />
      </div>

      <div className="flex">
        {/* Left bar */}
        <div className="w-8 flex-shrink-0 relative" style={{ background: frameV, boxShadow: "inset 2px 0 3px rgba(255,255,255,0.08), inset -1px 0 2px rgba(0,0,0,0.3)" }}>
          <FrameScrew className="left-2 top-3" />
          <FrameScrew className="left-2 bottom-3" />
        </div>

        {/* Canvas */}
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 z-10 pointer-events-none" style={{ boxShadow: "inset 0 0 10px rgba(0,0,0,0.4)" }} />
          {children}
        </div>

        {/* Right bar */}
        <div className="w-8 flex-shrink-0 relative" style={{ background: frameV, boxShadow: "inset -2px 0 3px rgba(255,255,255,0.08), inset 1px 0 2px rgba(0,0,0,0.3)" }}>
          <FrameScrew className="right-2 top-3" />
          <FrameScrew className="right-2 bottom-3" />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative h-8" style={{ background: frameH, boxShadow: "inset 0 -2px 3px rgba(255,255,255,0.08), inset 0 1px 2px rgba(0,0,0,0.3)" }}>
        <div className="absolute left-0 bottom-0 w-8 h-8" style={{ background: "linear-gradient(45deg, #5a5a5a, #3a3a3a)" }} />
        <div className="absolute right-0 bottom-0 w-8 h-8" style={{ background: "linear-gradient(-45deg, #5a5a5a, #3a3a3a)" }} />
        <FrameScrew className="left-2 bottom-2" />
        <FrameScrew className="right-2 bottom-2" />
      </div>
    </div>
  );
}

function FrameScrew({ className }: { className: string }) {
  return (
    <div
      className={`absolute w-3.5 h-3.5 rounded-full ${className}`}
      style={{
        background: "radial-gradient(circle at 35% 35%, #d0d0d0, #808080 60%, #606060)",
        boxShadow: "inset 0 1px 2px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.5)",
      }}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-[1px]" style={{ background: "#404040" }} />
    </div>
  );
}
