"use client";

import { useEffect, useRef } from "react";

// Same feature-dependency topology as the rest of the intro, but placed in
// real 3D space (x, y, z) and rendered with three.js so the graph can spin
// and actually show depth — mirrors the approach IntentWebViewer.tsx already
// uses for the product's real "Intent Web" view.
interface Node3D {
  id: string;
  label: string;
  x: number;
  y: number;
  z: number;
  r: number;
  delay: number;
  accent?: boolean;
}

interface Edge3D {
  from: string;
  to: string;
  primary: boolean;
  delay: number;
}

const NODES: Node3D[] = [
  { id: "root", label: "Sketch", x: 0, y: 0, z: 0, r: 2.4, delay: 0, accent: true },

  { id: "plane", label: "Plane", x: -13, y: -7, z: -8, r: 1.6, delay: 80 },
  { id: "revolve", label: "Revolve", x: -7, y: -7, z: 6, r: 1.8, delay: 160 },
  { id: "extrude", label: "Extrude", x: 0, y: -7, z: 0, r: 2, delay: 40 },
  { id: "loft", label: "Loft", x: 7, y: -7, z: 8, r: 1.8, delay: 220 },
  { id: "axis", label: "Axis", x: 13, y: -7, z: -6, r: 1.6, delay: 300 },

  { id: "constraint", label: "Constraint", x: -19, y: -14, z: 2, r: 1.3, delay: 520 },
  { id: "mirror", label: "Mirror", x: -11, y: -14, z: -10, r: 1.5, delay: 600 },
  { id: "fillet", label: "Fillet", x: -4, y: -14, z: 9, r: 1.6, delay: 560 },
  { id: "shell", label: "Shell", x: 4, y: -14, z: -9, r: 1.6, delay: 700 },
  { id: "sweep", label: "Sweep", x: 11, y: -14, z: 10, r: 1.5, delay: 780 },
  { id: "assembly", label: "Assembly", x: 19, y: -14, z: -3, r: 1.3, delay: 860 },

  { id: "draft", label: "Draft", x: -19, y: -21, z: -6, r: 1.25, delay: 1020 },
  { id: "rib", label: "Rib", x: -11, y: -21, z: 8, r: 1.35, delay: 1100 },
  { id: "chamfer", label: "Chamfer", x: -4, y: -21, z: -10, r: 1.4, delay: 1180 },
  { id: "hole", label: "Hole", x: 3, y: -21, z: 9, r: 1.45, delay: 1260 },
  { id: "boolean", label: "Boolean", x: 9, y: -21, z: -8, r: 1.35, delay: 1340 },
  { id: "thread", label: "Thread", x: 16, y: -21, z: 6, r: 1.25, delay: 1420 },

  { id: "pattern", label: "Pattern", x: 3, y: -28, z: 9, r: 1.8, delay: 1900, accent: true },
];

const EDGES: Edge3D[] = [
  { from: "root", to: "plane", primary: true, delay: 80 },
  { from: "root", to: "revolve", primary: true, delay: 160 },
  { from: "root", to: "extrude", primary: true, delay: 40 },
  { from: "root", to: "loft", primary: true, delay: 220 },
  { from: "root", to: "axis", primary: true, delay: 300 },

  { from: "plane", to: "constraint", primary: true, delay: 520 },
  { from: "revolve", to: "mirror", primary: true, delay: 600 },
  { from: "extrude", to: "fillet", primary: true, delay: 560 },
  { from: "extrude", to: "shell", primary: true, delay: 700 },
  { from: "loft", to: "sweep", primary: true, delay: 780 },
  { from: "axis", to: "assembly", primary: true, delay: 860 },

  { from: "constraint", to: "draft", primary: true, delay: 1020 },
  { from: "mirror", to: "rib", primary: true, delay: 1100 },
  { from: "fillet", to: "chamfer", primary: true, delay: 1180 },
  { from: "shell", to: "hole", primary: true, delay: 1260 },
  { from: "shell", to: "boolean", primary: true, delay: 1340 },
  { from: "sweep", to: "thread", primary: true, delay: 1420 },

  { from: "hole", to: "pattern", primary: true, delay: 1900 },

  // Secondary cross-links — real graph density, not a plain tree.
  { from: "constraint", to: "axis", primary: false, delay: 720 },
  { from: "mirror", to: "extrude", primary: false, delay: 800 },
  { from: "fillet", to: "shell", primary: false, delay: 900 },
  { from: "sweep", to: "shell", primary: false, delay: 980 },
  { from: "assembly", to: "constraint", primary: false, delay: 1060 },
  { from: "draft", to: "rib", primary: false, delay: 1220 },
  { from: "hole", to: "chamfer", primary: false, delay: 1460 },
  { from: "boolean", to: "assembly", primary: false, delay: 1540 },
  { from: "thread", to: "hole", primary: false, delay: 1620 },
  { from: "pattern", to: "mirror", primary: false, delay: 2100 },
  { from: "pattern", to: "boolean", primary: false, delay: 2100 },
];

const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// Slight overshoot for node arrivals — they land with a springy settle
// instead of a flat stop.
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// How long a spawned node takes to travel from its parent to its own spot.
const TRAVEL_MS = 750;
// Camera pull-back from the root close-up to the full-graph framing.
const INTRO_MS = 2600;

// The graph's world-space bounding box (x spans roughly ±19, y spans 0 to
// -28), with a little margin for sphere radii and labels.
const VERTICAL_FOV_DEG = 42;
const GRAPH_X_HALF = 24;
const GRAPH_Y_HALF = 17;
const GRAPH_Y_CENTER = -14;
const ROOT_R = 2.4;

// Picks a camera distance that fits the whole graph's bounding box for
// *whatever* aspect ratio the container has — a fixed distance looked fine
// on a landscape-ish box, but clipped hard on a tall/narrow mobile viewport
// once the scene went full-bleed. Recomputed on resize (see ResizeObserver).
function fitCameraDistance(aspect: number) {
  const halfV = (VERTICAL_FOV_DEG * Math.PI) / 360;
  const distanceForHeight = GRAPH_Y_HALF / Math.tan(halfV);
  const distanceForWidth = GRAPH_X_HALF / (Math.tan(halfV) * aspect);
  return Math.max(distanceForHeight, distanceForWidth) * 1.15;
}

// Camera distance at which the root sphere's projected diameter equals the 2D
// intro node's on-screen diameter — this is what makes the DOM node → 3D root
// handoff pixel-continuous, so the graph reads as growing OUT of the clicked
// node rather than replacing it.
function matchCameraDistance(canvasHeightPx: number, nodeDiameterPx: number) {
  const halfV = (VERTICAL_FOV_DEG * Math.PI) / 360;
  return (ROOT_R * canvasHeightPx) / (Math.tan(halfV) * nodeDiameterPx);
}

interface NodeGraph3DProps {
  zoom: boolean;
  onZoomDone?: () => void;
  // Fires after the first painted frame — the intro uses this to fade the 2D
  // DOM node only once its 3D twin is actually on screen underneath it.
  onReady?: () => void;
  // Fires if the scene can't come up at all — e.g. the three.js chunk 404s
  // because the tab holds HTML from a previous (preview) deployment, or WebGL
  // is unavailable. The intro uses this to skip ahead instead of hanging.
  onError?: () => void;
}

export default function NodeGraph3D({ zoom, onZoomDone, onReady, onError }: NodeGraph3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const onZoomDoneRef = useRef(onZoomDone);
  onZoomDoneRef.current = onZoomDone;
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // React Strict Mode (dev only) synchronously mounts → cleans up → mounts
    // again. Because the three.js setup below is async (it awaits the
    // dynamic `import("three")`), that first cleanup can run *before* the
    // import resolves — at which point `cleanup` is still the no-op default,
    // so the stale async callback would go on to build a second scene and
    // append a second <canvas>. Guard with `cancelled` so it aborts instead.
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      try {
      // On a preview deployment, a tab holding HTML from an older build can
      // 404 this hashed chunk (deployment skew) — the catch below turns that
      // into onError instead of a silent hang.
      const THREE = await import("three");
      if (cancelled) return;

      const w = mount.offsetWidth || 400;
      const h = mount.offsetHeight || 400;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(VERTICAL_FOV_DEG, w / h, 0.1, 500);
      let startZ = fitCameraDistance(w / h);
      // Match the 2D intro node: h-14 (56px) below sm, h-16 (64px) at sm+.
      const nodePx = window.innerWidth < 640 ? 56 : 64;
      const closeZ = matchCameraDistance(h, nodePx);
      camera.position.set(0, 0, closeZ);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 1));

      const world = new THREE.Group();
      scene.add(world);

      const mountTime = performance.now();
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Primary-edge tree parentage — every node spawns from its parent's
      // live position and flies outward to its own spot.
      const parentOf = new Map<string, string>();
      EDGES.forEach((e) => {
        if (e.primary && !parentOf.has(e.to)) parentOf.set(e.to, e.from);
      });

      interface NodeState {
        mesh: import("three").Mesh;
        mat: import("three").MeshBasicMaterial;
        finalPos: import("three").Vector3;
        spawnPos: import("three").Vector3 | null;
        parentId: string | null;
        revealAt: number;
        r: number;
        phase: number;
      }

      const nodeStates = new Map<string, NodeState>();

      const makeLabel = (text: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 260;
        canvas.height = 50;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "20px monospace";
        ctx.fillStyle = "#334155";
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false, opacity: 0 });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(9, 9 * (canvas.height / canvas.width), 1);
        return sprite;
      };

      const sprites: { sprite: import("three").Sprite; nodeId: string; revealAt: number }[] = [];

      NODES.forEach((n, i) => {
        const isRoot = n.id === "root";
        const geo = new THREE.SphereGeometry(n.r, 20, 20);
        const mat = new THREE.MeshBasicMaterial({
          color: n.accent ? 0x1d4ed8 : 0x3b82f6,
          transparent: true,
          opacity: isRoot ? 1 : 0,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(n.x, n.y, n.z);
        mesh.scale.setScalar(isRoot ? 1 : 0.001);
        world.add(mesh);

        nodeStates.set(n.id, {
          mesh,
          mat,
          finalPos: new THREE.Vector3(n.x, n.y, n.z),
          spawnPos: isRoot ? new THREE.Vector3(n.x, n.y, n.z) : null,
          parentId: parentOf.get(n.id) ?? null,
          // The root is fully present the moment the scene appears — it IS the
          // clicked 2D node, so it must never re-animate in.
          revealAt: isRoot ? mountTime - 1000 : mountTime + n.delay,
          r: n.r,
          phase: i * 2.399,
        });

        const label = makeLabel(n.label);
        label.position.set(n.x, n.y + n.r + 1.6, n.z);
        world.add(label);
        // Labels trail their node's arrival slightly; the root's fades in
        // during the first beat of the pull-back.
        sprites.push({ sprite: label, nodeId: n.id, revealAt: mountTime + (isRoot ? 400 : n.delay + 350) });
      });

      const edgeLines: {
        line: import("three").Line;
        mat: import("three").LineBasicMaterial;
        from: string;
        to: string;
        revealAt: number;
        target: number;
      }[] = [];
      EDGES.forEach((e) => {
        const from = nodeStates.get(e.from);
        const to = nodeStates.get(e.to);
        if (!from || !to) return;
        const geometry = new THREE.BufferGeometry().setFromPoints([from.mesh.position, to.mesh.position]);
        const mat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const line = new THREE.Line(geometry, mat);
        world.add(line);
        edgeLines.push({ line, mat, from: e.from, to: e.to, revealAt: mountTime + e.delay, target: e.primary ? 0.6 : 0.32 });
      });

      let raf: number;
      let zooming = false;
      let zoomStart = 0;
      let doneCalled = false;
      let readyCalled = false;

      const animate = () => {
        raf = requestAnimationFrame(animate);
        const now = performance.now();

        if (!zoomRef.current) {
          world.rotation.y += 0.0032;
        } else if (!zooming) {
          zooming = true;
          zoomStart = now;
        }

        // ── Camera: glide from the root close-up out to the full-graph frame.
        // The look target descends with the camera, so the root drifts toward
        // the top of the screen exactly as the tree grows downward out of it.
        if (!zooming) {
          const it = reduceMotion ? 1 : Math.min(1, (now - mountTime) / INTRO_MS);
          const e = easeInOut(it);
          const cy = GRAPH_Y_CENTER * e;
          camera.position.set(0, cy, closeZ + (startZ - closeZ) * e);
          camera.lookAt(0, cy, 0);
        }

        // ── Nodes: spawn at the parent's live position, fly out to their own,
        // land with a springy overshoot, then float gently in place.
        nodeStates.forEach((s) => {
          if (now < s.revealAt) return;
          if (!s.spawnPos) {
            const parent = s.parentId ? nodeStates.get(s.parentId) : null;
            s.spawnPos = (parent ? parent.mesh.position : s.finalPos).clone();
          }

          const tt = Math.min(1, (now - s.revealAt) / TRAVEL_MS);
          s.mesh.position.lerpVectors(s.spawnPos, s.finalPos, ease(tt));

          if (!reduceMotion && tt >= 1) {
            const settle = Math.min(1, (now - s.revealAt - TRAVEL_MS) / 1200);
            const t = now * 0.001;
            s.mesh.position.x += Math.sin(t * 0.7 + s.phase) * 0.28 * settle;
            s.mesh.position.y += Math.sin(t * 0.9 + s.phase * 1.7) * 0.34 * settle;
          }

          const st = Math.min(1, (now - s.revealAt) / 420);
          s.mesh.scale.setScalar(Math.max(0.001, easeOutBack(st)));
          s.mat.opacity = ease(Math.min(1, (now - s.revealAt) / 300));
        });

        // ── Labels ride their node.
        sprites.forEach(({ sprite, nodeId, revealAt }) => {
          const s = nodeStates.get(nodeId);
          if (!s) return;
          sprite.position.set(s.mesh.position.x, s.mesh.position.y + s.r + 1.6, s.mesh.position.z);
          const t = Math.max(0, Math.min(1, (now - revealAt) / 380));
          (sprite.material as import("three").SpriteMaterial).opacity = ease(t);
        });

        // ── Edges: endpoints track live node positions every frame, so each
        // line visibly stretches out with the child it carries.
        edgeLines.forEach(({ line, mat, from, to, revealAt, target }) => {
          const a = nodeStates.get(from);
          const b = nodeStates.get(to);
          if (!a || !b) return;
          const positions = line.geometry.attributes.position;
          positions.setXYZ(0, a.mesh.position.x, a.mesh.position.y, a.mesh.position.z);
          positions.setXYZ(1, b.mesh.position.x, b.mesh.position.y, b.mesh.position.z);
          positions.needsUpdate = true;
          const t = Math.max(0, Math.min(1, (now - revealAt) / 380));
          mat.opacity = ease(t) * target;
        });

        if (zooming) {
          const t = Math.min(1, (now - zoomStart) / 700);
          camera.position.z = startZ - ease(t) * (startZ - 6);
          renderer.domElement.style.opacity = String(1 - ease(t));
          if (t >= 1 && !doneCalled) {
            doneCalled = true;
            onZoomDoneRef.current?.();
          }
        }

        renderer.render(scene, camera);

        if (!readyCalled) {
          readyCalled = true;
          onReadyRef.current?.();
        }
      };
      animate();

      const ro = new ResizeObserver(() => {
        const rw = mount.offsetWidth;
        const rh = mount.offsetHeight;
        if (rw > 0 && rh > 0) {
          renderer.setSize(rw, rh);
          camera.aspect = rw / rh;
          camera.updateProjectionMatrix();
          // Re-fit the "at rest" distance for the new aspect ratio — the
          // per-frame camera glide picks it up automatically. Never mid-zoom,
          // since that phase animates camera.position.z itself.
          if (!zooming) startZ = fitCameraDistance(rw / rh);
        }
      });
      ro.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      };
      } catch {
        // Chunk failed to load or WebGL refused to initialize — report up so
        // the intro can skip the 3D beat rather than stall on a locked screen.
        if (!cancelled) onErrorRef.current?.();
      }
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
