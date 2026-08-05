/**
 * Platform git graph — hero zone 3.
 *
 * The claim this has to make visually: a change made in ONE tool is already in
 * every other tool. So the graph is column-based — every change lands on the
 * same column across all four lanes. The lane where the work was done gets the
 * open node; every other lane gets a FILLED node at the same column, because
 * the change is already there. Adding a tool back-fills its whole lane, which
 * is the model's history arriving with it.
 *
 * Branches fan out of the root and run parallel forever. Nothing ever merges
 * back — not even Onshape. There is no pull request in this picture.
 *
 * One graph, two orientations: horizontal on laptop and up, vertical on phones
 * (lanes down the left, messages in a column on the right). Content, stage
 * gating and node semantics are shared; only the coordinates differ, so the
 * two layouts cannot drift apart.
 */

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

const COLOR = {
  main: "#3b82f6",
  onshape: "#10b981",
  fusion: "#06b6d4",
  solidworks: "#8b5cf6",
} as const;

type LaneId = keyof typeof COLOR;
type Axis = "h" | "v";

const LANES: LaneId[] = ["onshape", "main", "fusion", "solidworks"];

/** The stage each lane exists from — Fusion at stage 1, SolidWorks at stage 2. */
const LANE_FROM: Record<LaneId, number> = { main: 0, onshape: 0, fusion: 1, solidworks: 2 };

const LANE_NAME: Record<LaneId, string> = {
  main: "main · software-neutral",
  onshape: "onshape",
  fusion: "fusion 360",
  solidworks: "solidworks",
};

/** Shorter names for the vertical layout, where the lanes are 48 units apart. */
const LANE_NAME_SHORT: Record<LaneId, string> = {
  main: "main",
  onshape: "onshape",
  fusion: "fusion",
  solidworks: "solidworks",
};

interface Change {
  id: string;
  /** The lane the work was done on. Every other lane gets it too. */
  author: LaneId;
  stage: number;
  label: string;
  /** Which side of the author's lane the message sits on (horizontal only). */
  side: "a" | "b";
}

// One entry per column. Fusion and SolidWorks work interleaves so that each
// lane's messages are two columns apart — room to read, and it is also what
// parallel work actually looks like.
const CHANGES: Change[] = [
  { id: "c0",  author: "onshape",    stage: 0, side: "a", label: "sketch + constraints" },
  { id: "c1",  author: "onshape",    stage: 0, side: "b", label: "base plate · 8mm" },
  { id: "c2",  author: "onshape",    stage: 0, side: "a", label: "6 holes · 4 M6 mounts" },
  { id: "c3",  author: "fusion",     stage: 3, side: "a", label: "CAM toolpaths" },
  { id: "c4",  author: "solidworks", stage: 4, side: "a", label: "configurations & variants" },
  { id: "c5",  author: "fusion",     stage: 3, side: "b", label: "generative design" },
  { id: "c6",  author: "solidworks", stage: 4, side: "b", label: "static & fatigue" },
  { id: "c7",  author: "fusion",     stage: 3, side: "a", label: "static stress / FEA" },
  { id: "c8",  author: "solidworks", stage: 4, side: "a", label: "CFD flow simulation" },
  { id: "c9",  author: "fusion",     stage: 3, side: "b", label: "thermal simulation" },
  { id: "c10", author: "solidworks", stage: 4, side: "b", label: "drop test" },
  { id: "c11", author: "fusion",     stage: 3, side: "a", label: "event simulation" },
  { id: "c12", author: "solidworks", stage: 4, side: "a", label: "motion study" },
  { id: "c13", author: "main",       stage: 5, side: "a", label: "one model · every tool" },
];

const LAYOUT = {
  h: {
    viewBox: "0 0 1850 560",
    lane: { onshape: 90, main: 220, fusion: 350, solidworks: 470 } as Record<LaneId, number>,
    /** Lane names live in a gutter, clear of every line — nothing crosses text. */
    nameEdge: 250,
    root: 290,
    /** Where the fan out of the root settles onto each lane. */
    settle: { onshape: 410, main: 410, fusion: 410, solidworks: 440 } as Record<LaneId, number>,
    first: 480,
    step: 95,
    end: 1850,
    fade: 0.95,
    font: 14,
    nameFont: 15,
    above: -26,
    below: 34,
  },
  // Deliberately tight. The phone layout is pinned in its section like the
  // desktop one, so the whole graph has to survive inside one viewport minus
  // the caption above it — every row of slack here is a row that would push the
  // last commits off the bottom.
  v: {
    viewBox: "0 0 440 700",
    lane: { onshape: 30, main: 78, fusion: 126, solidworks: 174 } as Record<LaneId, number>,
    /** Names sit in a header band; anchors are staggered so they cannot touch. */
    name: {
      onshape:    { at: 52,  anchor: "end" },
      main:       { at: 78,  anchor: "middle" },
      fusion:     { at: 142, anchor: "end" },
      solidworks: { at: 152, anchor: "start" },
    } as Record<LaneId, { at: number; anchor: "start" | "middle" | "end" }>,
    nameFlow: 20,
    root: 62,
    settle: { onshape: 106, main: 106, fusion: 106, solidworks: 118 } as Record<LaneId, number>,
    first: 152,
    step: 38,
    end: 700,
    fade: 0.96,
    font: 12,
    nameFont: 12,
    /** Every message shares one column, clear of the last lane. */
    labelAt: 204,
  },
} as const;

/** Where a lane's own line starts: main from the top, the rest from the fan. */
function lanePath(axis: Axis, lane: LaneId) {
  const L = LAYOUT[axis];
  const at = L.lane[lane];

  if (lane === "main") {
    // A short lead-in before the root node, clear of the lane names above it.
    const from = L.root - (axis === "h" ? 40 : 26);
    return axis === "h" ? `M${from} ${at} H${L.end}` : `M${at} ${from} V${L.end}`;
  }

  const root = L.root;
  const main = L.lane.main;
  const settle = L.settle[lane];
  const mid = (root + settle) / 2;

  return axis === "h"
    ? `M${root} ${main} C${mid} ${main} ${mid} ${at} ${settle} ${at} H${L.end}`
    : `M${main} ${root} C${main} ${mid} ${at} ${mid} ${at} ${settle} V${L.end}`;
}

/** Messages keep the site's `[tag] text` motif; the tag takes its lane colour. */
function Message({ label, color }: { label: string; color: string }) {
  const tagged = /^(\[[^\]]+\])\s*(.*)$/.exec(label);
  if (!tagged) return <tspan fill="#64748b">{label}</tspan>;
  return (
    <>
      <tspan fill={color}>{tagged[1]}</tspan>
      <tspan fill="#64748b"> {tagged[2]}</tspan>
    </>
  );
}

export default function PlatformGitTree({
  activeIndex,
  axis,
  className,
}: {
  activeIndex: number;
  axis: Axis;
  className?: string;
}) {
  const L = LAYOUT[axis];
  const maskId = `platform-fade-${axis}`;
  const flowOf = (index: number) => L.first + index * L.step;

  return (
    <svg
      viewBox={L.viewBox}
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Git graph: a software-neutral main branch with Onshape, Fusion 360 and SolidWorks branches fanning out of it and running in parallel. Every change is committed on all four branches at once — the branch where the work was done is marked with an open node, the branches it persisted to with filled nodes. No branch ever merges back."
    >
      <defs>
        <linearGradient
          id={`${maskId}-gradient`}
          x1="0"
          y1="0"
          x2={axis === "h" ? "1" : "0"}
          y2={axis === "h" ? "0" : "1"}
        >
          <stop offset={L.fade} stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* The mask has to be exactly this layout's own frame: the gradient
            stops are fractions of it, so a shared oversized rect would put the
            fade off-canvas in the shorter of the two. */}
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={axis === "h" ? 1850 : 440}
          height={axis === "h" ? 560 : 700}
        >
          <rect
            x="0"
            y="0"
            width={axis === "h" ? 1850 : 440}
            height={axis === "h" ? 560 : 700}
            fill={`url(#${maskId}-gradient)`}
          />
        </mask>
      </defs>

      {/* Lanes. Main is drawn last so it sits on top where the fan leaves it. */}
      <g mask={`url(#${maskId})`} fill="none" strokeLinecap="round">
        {[...LANES].reverse().map(lane => {
          const on = activeIndex >= LANE_FROM[lane];
          return (
            <path
              key={lane}
              d={lanePath(axis, lane)}
              pathLength={1}
              stroke={COLOR[lane]}
              strokeWidth={lane === "main" ? 4 : 3.2}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: on ? 0 : 1,
                transition: `stroke-dashoffset 1100ms ${EASE} ${on ? 80 : 0}ms`,
              }}
            />
          );
        })}
      </g>

      {/* Lane names */}
      {LANES.map(lane => {
        const on = activeIndex >= LANE_FROM[lane];
        const name = axis === "h" ? LANE_NAME[lane] : LANE_NAME_SHORT[lane];
        const spot =
          axis === "h"
            ? { x: LAYOUT.h.nameEdge, y: LAYOUT.h.lane[lane] + 5, anchor: "end" as const }
            : {
                x: LAYOUT.v.name[lane].at,
                y: LAYOUT.v.nameFlow,
                anchor: LAYOUT.v.name[lane].anchor,
              };
        return (
          <text
            key={`name-${lane}`}
            x={spot.x}
            y={spot.y}
            textAnchor={spot.anchor}
            fontSize={L.nameFont}
            fontWeight={600}
            fontFamily="var(--font-geist-mono), monospace"
            fill={COLOR[lane]}
            style={{
              opacity: on ? 1 : 0,
              transition: `opacity 500ms ${EASE} ${on ? 200 : 0}ms`,
            }}
          >
            {name}
          </text>
        );
      })}

      {/* The root every branch fans out of */}
      <circle
        cx={axis === "h" ? LAYOUT.h.root : LAYOUT.v.lane.main}
        cy={axis === "h" ? LAYOUT.h.lane.main : LAYOUT.v.root}
        r={6}
        fill="#ffffff"
        stroke={COLOR.main}
        strokeWidth={2.5}
      />

      {/* Every change, on every lane that exists to hold it */}
      {CHANGES.map((change, index) => {
        const flow = flowOf(index);
        const stagePosition = CHANGES.filter(c => c.stage === change.stage).indexOf(change);
        const labelOn = activeIndex >= change.stage;
        const authorColor = COLOR[change.author];

        return (
          <g key={change.id}>
            {LANES.map(lane => {
              const author = lane === change.author;
              // A lane cannot hold a change from before it existed — but the
              // moment it does exist, it holds all of them.
              const from = Math.max(change.stage, LANE_FROM[lane]);
              const on = activeIndex >= from;
              const x = axis === "h" ? flow : L.lane[lane];
              const y = axis === "h" ? L.lane[lane] : flow;
              const delay = on ? 240 + stagePosition * 80 + (author ? 0 : 90) : 0;
              const origin = `${x}px ${y}px`;

              return (
                <g key={lane}>
                  {author && activeIndex === change.stage && (
                    <circle
                      cx={x}
                      cy={y}
                      r={6}
                      fill={authorColor}
                      className="commit-pulse"
                      style={{ transformOrigin: origin }}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={author ? 6 : 4.5}
                    // Open where the work was done; filled everywhere it landed.
                    fill={author ? "#ffffff" : COLOR[lane]}
                    stroke={COLOR[lane]}
                    strokeWidth={author ? 2.5 : 0}
                    style={{
                      transformBox: "view-box",
                      transformOrigin: origin,
                      transform: on ? "scale(1)" : "scale(0)",
                      transition: `transform 520ms ${EASE} ${delay}ms`,
                    }}
                  />
                </g>
              );
            })}

            <text
              x={axis === "h" ? flow : LAYOUT.v.labelAt}
              y={
                axis === "h"
                  ? L.lane[change.author] + (change.side === "a" ? LAYOUT.h.above : LAYOUT.h.below)
                  : flow + 4
              }
              textAnchor={axis === "h" ? "middle" : "start"}
              fontSize={L.font}
              fontFamily="var(--font-geist-mono), monospace"
              style={{
                transformBox: "view-box",
                opacity: labelOn ? 1 : 0,
                transform: labelOn ? "translate(0, 0)" : "translate(0, 6px)",
                transition: `opacity 460ms ${EASE} ${labelOn ? 340 + stagePosition * 80 : 0}ms, transform 460ms ${EASE} ${labelOn ? 340 + stagePosition * 80 : 0}ms`,
              }}
            >
              <Message label={change.label} color={authorColor} />
            </text>
          </g>
        );
      })}
    </svg>
  );
}
