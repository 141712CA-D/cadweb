"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const IntentWebViewer = dynamic(() => import("./IntentWebViewer"), { ssr: false });

const DIRECT_MAP: [string, string][] = [
  ["Sketch1 · Base Profile",   "BaseProfile"],
  ["Sketch2 · Mid Profile",    "MidProfile"],
  ["Sketch3 · Top Profile",    "TopProfile"],
  ["Sketch4 · Handle Outline", "HandleOuter"],
  ["Revolve1 · Body",          "MugBody"],
  ["Shell1 · Hollow",          "MugHollow"],
  ["Extrude1 · Handle",        "Handle"],
];

const DERIVED_MAP: [string, string, string][] = [
  ["Inline sketch plane (Mid)",    "MidPlane",    "Fusion embeds the sketch plane inline — Onshape requires a standalone Plane feature, created automatically."],
  ["Inline sketch plane (Top)",    "TopPlane",    "Same inline-plane pattern — re-derived as a standalone Onshape Plane."],
  ["Inline sketch plane (Handle)", "HandlePlane", "Same inline-plane pattern — re-derived as a standalone Onshape Plane."],
  ["Fillet · implicit edge loop (Base)", "BaseRim", "Fusion's fillet references an implicit continuity set — re-derived from the solid's explicit edge topology."],
  ["Fillet · implicit edge loop (Top)",  "TopRim",  "Same implicit-edge pattern, re-derived from the solid's edge topology."],
  ["Appearance · Ceramic Gloss",   "MugBody (Appearance)", "Fusion attaches appearance directly to the body — Onshape stores it as a separate part property, reapplied post-transfer."],
];

export default function InterCadPanel() {
  const [openDirect, setOpenDirect]   = useState(true);
  const [openDerived, setOpenDerived] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <p className="font-mono text-[8px] text-[#202020] uppercase tracking-[0.2em] mb-2">
          Inter-CAD Transfer
        </p>
        <p className="text-sm text-[#777]">Daily Mug</p>
        <p className="font-mono text-[9px] text-[#333] mt-0.5">from Fusion 360 → Onshape</p>
      </div>

      {/* A — Direct feature map */}
      <div className="border border-[#141414] bg-[#070707]">
        <button
          onClick={() => setOpenDirect(v => !v)}
          className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#0c0c0c] transition-colors"
        >
          <span
            className="font-mono text-[8px] text-[#2e2e2e] flex-shrink-0 transition-transform duration-150"
            style={{ display: "inline-block", transform: openDirect ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
          <span className="font-mono text-[9px] text-[#484848] uppercase tracking-widest">
            Direct Feature Map
          </span>
          <span className="ml-auto font-mono text-[8px] text-[#222]">{DIRECT_MAP.length}</span>
        </button>
        {openDirect && (
          <div className="px-3 pb-2.5 space-y-1.5 border-t border-[#0e0e0e] pt-2">
            {DIRECT_MAP.map(([fusion, onshape]) => (
              <div key={fusion} className="flex items-center gap-1.5 py-0.5">
                <span className="font-mono text-[9px] text-[#4a9eff] truncate">{fusion}</span>
                <span className="font-mono text-[9px] text-[#242424] flex-shrink-0">→</span>
                <span className="font-mono text-[9px] text-[#00ff41] truncate">{onshape}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* B — Non-direct / derived feature map */}
      <div className="border border-[#141414] bg-[#070707]">
        <button
          onClick={() => setOpenDerived(v => !v)}
          className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#0c0c0c] transition-colors"
        >
          <span
            className="font-mono text-[8px] text-[#2e2e2e] flex-shrink-0 transition-transform duration-150"
            style={{ display: "inline-block", transform: openDerived ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
          <span className="font-mono text-[9px] text-[#484848] uppercase tracking-widest">
            Derived / Non-Direct Map
          </span>
          <span className="ml-auto font-mono text-[8px] text-[#222]">{DERIVED_MAP.length}</span>
        </button>
        {openDerived && (
          <div className="px-3 pb-2.5 space-y-2.5 border-t border-[#0e0e0e] pt-2">
            {DERIVED_MAP.map(([fusion, onshape, note]) => (
              <div key={fusion} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[9px] text-[#4a9eff] truncate">{fusion}</span>
                  <span className="font-mono text-[9px] text-[#242424] flex-shrink-0">⇢</span>
                  <span className="font-mono text-[9px] text-[#f5a623] truncate">{onshape}</span>
                </div>
                <p className="font-mono text-[8px] text-[#333] leading-4">{note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* C — Interactive intent web */}
      <div className="border border-[#141414] bg-[#070707]">
        <p className="px-3 pt-2.5 pb-1.5 font-mono text-[8px] text-[#222] uppercase tracking-[0.2em] border-b border-[#111]">
          Intent Web
        </p>
        <div className="overflow-hidden" style={{ height: 260 }}>
          <IntentWebViewer />
        </div>
        <p className="px-3 py-1.5 font-mono text-[8px] text-[#222]">
          drag a node to move it · drag background to rotate · scroll to zoom
        </p>
      </div>
    </div>
  );
}
