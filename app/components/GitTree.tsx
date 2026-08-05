/**
 * Hero git tree — the same subway-map branch style as the Parametra app's
 * "Pulling from Onshape" loading screen, promoted to the hero. The blue line
 * is the software-neutral main branch; every colored branch is one CAD tool
 * forked off main and running PARALLEL to it forever — branches never merge
 * back, because each tool's copy keeps persisting alongside main. All lines
 * fade off the right edge to read as "continues indefinitely".
 *
 * Paths set pathLength={1} so the `.tree-draw` dash animation (globals.css)
 * can draw each branch in with unit-length dash math.
 */

const MAIN = "#3b82f6";
const NODE_FILL = "#ffffff";

interface Branch {
  color: string;
  label: string;
  /** Fork x on the main line; laneY is the branch's parallel lane. */
  fork: number;
  laneY: number;
  /** Commit x positions along the lane. */
  commits: number[];
  delay: number;
}

const MAIN_Y = 200;
const EDGE = 672;

const BRANCHES: Branch[] = [
  { color: "#f59e0b", label: "Onshape",    fork: 96,  laneY: 96,  commits: [216, 320, 428], delay: 150 },
  { color: "#a78bfa", label: "SolidWorks", fork: 152, laneY: 252, commits: [280, 392, 490], delay: 250 },
  { color: "#2dd4bf", label: "Fusion 360", fork: 210, laneY: 148, commits: [330, 440, 528], delay: 350 },
  { color: "#f472b6", label: "CATIA",      fork: 268, laneY: 304, commits: [376, 470],      delay: 450 },
];

function branchPath({ fork, laneY }: Branch) {
  return [
    `M${fork} ${MAIN_Y}`,
    `C${fork + 30} ${MAIN_Y} ${fork + 30} ${laneY} ${fork + 60} ${laneY}`,
    `H${EDGE}`,
  ].join(" ");
}

function Node({ x, y, color, r = 5.5 }: { x: number; y: number; color: string; r?: number }) {
  return <circle cx={x} cy={y} r={r} fill={NODE_FILL} stroke={color} strokeWidth="2.5" />;
}

const ANNOTATION_LINES = [
  "Each branch represents a tooling change,",
  "consistently persisted, no matter",
  "where you're editing",
];

export default function GitTree({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 56 680 324"
      className={className}
      role="img"
      aria-label="Git tree: a software-neutral main branch with Onshape, Fusion 360, SolidWorks, and CATIA branches forked off it, each persisting in parallel"
    >
      <defs>
        {/* Every line runs off the right edge and fades out — the branches
            never end (and never merge back into main). */}
        <linearGradient id="tree-fade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0.8" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="tree-edge-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="680" height="400">
          <rect x="0" y="0" width="680" height="400" fill="url(#tree-fade)" />
        </mask>
      </defs>

      <g mask="url(#tree-edge-mask)">
        {BRANCHES.map(b => (
          <path
            key={b.label}
            d={branchPath(b)}
            pathLength={1}
            className="tree-draw"
            style={{ animationDelay: `${b.delay}ms` }}
            stroke={b.color}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        ))}

        {/* Software-neutral main — drawn last in DOM so it sits on top at forks */}
        <path
          d={`M16 ${MAIN_Y} H${EDGE}`}
          pathLength={1}
          className="tree-draw"
          stroke={MAIN}
          strokeWidth="4.5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Branch commits + labels */}
      {BRANCHES.map(b => (
        <g key={b.label} className="animate-fade-in" style={{ animationDelay: `${b.delay + 550}ms` }}>
          {b.commits.map(x => (
            <Node key={x} x={x} y={b.laneY} color={b.color} />
          ))}
          <text
            x={b.fork + 60}
            y={b.laneY < MAIN_Y ? b.laneY - 14 : b.laneY + 24}
            fill="#64748b"
            fontSize="15"
            fontFamily="var(--font-geist-mono), monospace"
          >
            {b.label}
          </text>
        </g>
      ))}

      {/* Main-line commits: a first commit plus each fork point */}
      <g className="animate-fade-in" style={{ animationDelay: "500ms" }}>
        <Node x={40} y={MAIN_Y} color={MAIN} r={6} />
        {BRANCHES.map(b => (
          <Node key={b.label} x={b.fork} y={MAIN_Y} color={MAIN} r={6} />
        ))}
        <Node x={380} y={MAIN_Y} color={MAIN} r={6} />
        <Node x={480} y={MAIN_Y} color={MAIN} r={6} />
        <text
          x={16}
          y={MAIN_Y + 30}
          fill={MAIN}
          fontSize="15"
          fontWeight="600"
          fontFamily="var(--font-geist-mono), monospace"
        >
          <tspan x={16}>software-neutral</tspan>
          <tspan x={16} dy={18}>main</tspan>
        </text>
      </g>

      {/* Lower-left annotation (sm+ only — too small to read at phone widths,
          where the HTML caption below stands in). The arrow draws in on the
          same choreography as the branches, then the note fades up. */}
      <g className="hidden sm:block">
        <path
          d="M255 344 C320 354 390 342 420 315"
          pathLength={1}
          className="tree-draw"
          style={{ animationDelay: "900ms" }}
          stroke="#475569"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
        <g className="animate-fade-in" style={{ animationDelay: "1150ms" }}>
          <path
            d="M420 315 l-4.1 11.3 M420 315 l-11.6 2.9"
            stroke="#475569"
            strokeWidth="1.8"
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
          <text
            x={16}
            y={322}
            fill="#475569"
            fontSize="14"
            fontStyle="italic"
            fontFamily="var(--font-lato), sans-serif"
          >
            {ANNOTATION_LINES.map((line, i) => (
              <tspan key={line} x={16} dy={i === 0 ? 0 : 18}>
                {line}
              </tspan>
            ))}
          </text>
        </g>
      </g>

    </svg>
  );
}
