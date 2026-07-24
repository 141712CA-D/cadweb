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

interface NodeGraph3DProps {
  zoom: boolean;
  onZoomDone?: () => void;
}

export default function NodeGraph3D({ zoom, onZoomDone }: NodeGraph3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const onZoomDoneRef = useRef(onZoomDone);
  onZoomDoneRef.current = onZoomDone;

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
      const THREE = await import("three");
      if (cancelled) return;

      const w = mount.offsetWidth || 400;
      const h = mount.offsetHeight || 400;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 500);
      const startZ = 52;
      camera.position.set(0, -13, startZ);
      camera.lookAt(0, -13, 0);

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
      const meshIndex = new Map<string, import("three").Mesh>();

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

      const sprites: { sprite: import("three").Sprite; revealAt: number }[] = [];

      NODES.forEach((n) => {
        const geo = new THREE.SphereGeometry(n.r, 20, 20);
        const mat = new THREE.MeshBasicMaterial({ color: n.accent ? 0x1d4ed8 : 0x3b82f6, transparent: true, opacity: 0 });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(n.x, n.y, n.z);
        mesh.scale.setScalar(0.001);
        mesh.userData.revealAt = mountTime + n.delay;
        world.add(mesh);
        meshIndex.set(n.id, mesh);

        const label = makeLabel(n.label);
        label.position.set(n.x, n.y + n.r + 1.6, n.z);
        world.add(label);
        sprites.push({ sprite: label, revealAt: mountTime + n.delay });
      });

      const edgeLines: { mat: import("three").LineBasicMaterial; revealAt: number; target: number }[] = [];
      EDGES.forEach((e) => {
        const from = meshIndex.get(e.from);
        const to = meshIndex.get(e.to);
        if (!from || !to) return;
        const geometry = new THREE.BufferGeometry().setFromPoints([from.position, to.position]);
        const mat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0 });
        const line = new THREE.Line(geometry, mat);
        world.add(line);
        edgeLines.push({ mat, revealAt: mountTime + e.delay, target: e.primary ? 0.6 : 0.32 });
      });

      let raf: number;
      let zooming = false;
      let zoomStart = 0;
      let doneCalled = false;

      const animate = () => {
        raf = requestAnimationFrame(animate);
        const now = performance.now();

        if (!zoomRef.current) {
          world.rotation.y += 0.0032;
        } else if (!zooming) {
          zooming = true;
          zoomStart = now;
        }

        meshIndex.forEach((mesh) => {
          const t = Math.max(0, Math.min(1, (now - mesh.userData.revealAt) / 380));
          const s = ease(t);
          mesh.scale.setScalar(Math.max(0.001, s));
          (mesh.material as import("three").MeshBasicMaterial).opacity = s;
        });
        sprites.forEach(({ sprite, revealAt }) => {
          const t = Math.max(0, Math.min(1, (now - revealAt) / 380));
          (sprite.material as import("three").SpriteMaterial).opacity = ease(t);
        });
        edgeLines.forEach(({ mat, revealAt, target }) => {
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
      };
      animate();

      const ro = new ResizeObserver(() => {
        const rw = mount.offsetWidth;
        const rh = mount.offsetHeight;
        if (rw > 0 && rh > 0) {
          renderer.setSize(rw, rh);
          camera.aspect = rw / rh;
          camera.updateProjectionMatrix();
        }
      });
      ro.observe(mount);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" />;
}
