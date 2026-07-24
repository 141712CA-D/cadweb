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

//test for deployment.

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
        <p className="text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
          Inter-CAD Transfer
        </p>
        <p className="text-sm text-[#475569]">Daily Mug</p>
        <p className="text-[11px] sm:text-[10px] text-[#64748b] mt-0.5">from Fusion 360 → Onshape</p>
      </div>

      {/* A — Direct feature map */}
      <div className="rounded-md border border-[#dbe6f5] bg-[#eef2f9] overflow-hidden">
        <button
          onClick={() => setOpenDirect(v => !v)}
          className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#e2e8f0] transition-colors"
        >
          <span
            className="text-[10px] text-[#64748b] flex-shrink-0 transition-transform duration-150"
            style={{ display: "inline-block", transform: openDirect ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
          <span className="text-xs sm:text-[11px] font-medium text-[#475569]">
            Direct Feature Map
          </span>
          <span className="ml-auto font-mono text-[10px] sm:text-[8px] text-[#94a3b8]">{DIRECT_MAP.length}</span>
        </button>
        {openDirect && (
          <div className="px-3 pb-2.5 space-y-1.5 border-t border-[#dbe6f5] pt-2">
            {DIRECT_MAP.map(([fusion, onshape]) => (
              <div key={fusion} className="flex items-center gap-1.5 py-0.5">
                <span className="font-mono text-[11px] sm:text-[9px] text-[#06b6d4] truncate">{fusion}</span>
                <span className="font-mono text-[11px] sm:text-[9px] text-[#94a3b8] flex-shrink-0">→</span>
                <span className="font-mono text-[11px] sm:text-[9px] text-[#3b82f6] truncate">{onshape}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* B — Non-direct / derived feature map */}
      <div className="rounded-md border border-[#dbe6f5] bg-[#eef2f9] overflow-hidden">
        <button
          onClick={() => setOpenDerived(v => !v)}
          className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-[#e2e8f0] transition-colors"
        >
          <span
            className="text-[10px] text-[#64748b] flex-shrink-0 transition-transform duration-150"
            style={{ display: "inline-block", transform: openDerived ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
          <span className="text-xs sm:text-[11px] font-medium text-[#475569]">
            Derived / Non-Direct Map
          </span>
          <span className="ml-auto font-mono text-[10px] sm:text-[8px] text-[#94a3b8]">{DERIVED_MAP.length}</span>
        </button>
        {openDerived && (
          <div className="px-3 pb-2.5 space-y-2.5 border-t border-[#dbe6f5] pt-2">
            {DERIVED_MAP.map(([fusion, onshape, note]) => (
              <div key={fusion} className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[11px] sm:text-[9px] text-[#06b6d4] truncate">{fusion}</span>
                  <span className="font-mono text-[11px] sm:text-[9px] text-[#94a3b8] flex-shrink-0">⇢</span>
                  <span className="font-mono text-[11px] sm:text-[9px] text-[#d97706] truncate">{onshape}</span>
                </div>
                <p className="text-[11px] sm:text-[10px] text-[#64748b] leading-4">{note}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* C — Interactive intent web */}
      <div className="rounded-md border border-[#dbe6f5] bg-[#eef2f9] overflow-hidden">
        <p className="px-3 pt-2.5 pb-1.5 text-[11px] sm:text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide border-b border-[#dbe6f5]">
          Intent Web
        </p>
        <div className="overflow-hidden" style={{ height: 260 }}>
          <IntentWebViewer />
        </div>
        <p className="px-3 py-1.5 text-[11px] sm:text-[10px] text-[#94a3b8]">
          drag a node to move it · drag background to rotate · scroll to zoom
        </p>
      </div>
    </div>
  );
}
