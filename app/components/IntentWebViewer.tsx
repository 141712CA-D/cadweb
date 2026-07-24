"use client";

import { useEffect, useRef } from "react";

interface WebNode {
  id: string;
  label: string;
  side: "fusion" | "onshape";
  x: number;
  y: number;
  z: number;
}

interface WebEdge {
  a: string;
  b: string;
  kind: "direct" | "derived" | "flow";
}

// Fusion 360 source features (left sheet) mapped onto Onshape features (right sheet).
// Positions are hand-placed across two z-depth sheets so the graph reads as a "web" in 3D.
const NODES: WebNode[] = [
  { id: "ff1", label: "Sketch1 · Base Profile",   side: "fusion",  x: -22, y: 16,  z: -34 },
  { id: "ff2", label: "Sketch2 · Mid Profile",    side: "fusion",  x: -26, y: 4,   z: -30 },
  { id: "ff3", label: "Sketch3 · Top Profile",    side: "fusion",  x: -22, y: -8,  z: -36 },
  { id: "ff4", label: "Sketch4 · Handle Outline", side: "fusion",  x: -30, y: -20, z: -28 },
  { id: "ff5", label: "Revolve1 · Body",          side: "fusion",  x: -14, y: 8,   z: -20 },
  { id: "ff6", label: "Shell1 · Hollow",          side: "fusion",  x: -16, y: -4,  z: -22 },
  { id: "ff7", label: "Extrude1 · Handle",        side: "fusion",  x: -18, y: -18, z: -18 },
  { id: "ff8", label: "Fillets · Implicit Edges", side: "fusion",  x: -10, y: -10, z: -30 },
  { id: "ff9", label: "Appearance · Ceramic",     side: "fusion",  x: -8,  y: 18,  z: -26 },

  { id: "f1",  label: "BaseProfile",  side: "onshape", x: 18, y: 18,  z: 30 },
  { id: "f2",  label: "MidPlane",     side: "onshape", x: 24, y: 6,   z: 34 },
  { id: "f3",  label: "MidProfile",   side: "onshape", x: 14, y: -2,  z: 26 },
  { id: "f4",  label: "TopPlane",     side: "onshape", x: 26, y: -10, z: 36 },
  { id: "f5",  label: "TopProfile",   side: "onshape", x: 16, y: -16, z: 22 },
  { id: "f6",  label: "MugBody",      side: "onshape", x: 8,  y: 6,   z: 18 },
  { id: "f7",  label: "MugHollow",    side: "onshape", x: 10, y: -6,  z: 20 },
  { id: "f8",  label: "BaseRim",      side: "onshape", x: 6,  y: 16,  z: 28 },
  { id: "f9",  label: "TopRim",       side: "onshape", x: 6,  y: -18, z: 28 },
  { id: "f10", label: "HandlePlane",  side: "onshape", x: 20, y: -22, z: 32 },
  { id: "f11", label: "HandleOuter",  side: "onshape", x: 12, y: -24, z: 24 },
  { id: "f12", label: "Handle",       side: "onshape", x: 4,  y: -14, z: 16 },
];

const EDGES: WebEdge[] = [
  // direct 1:1 feature translations
  { a: "ff1", b: "f1",  kind: "direct" },
  { a: "ff2", b: "f3",  kind: "direct" },
  { a: "ff3", b: "f5",  kind: "direct" },
  { a: "ff4", b: "f11", kind: "direct" },
  { a: "ff5", b: "f6",  kind: "direct" },
  { a: "ff6", b: "f7",  kind: "direct" },
  { a: "ff7", b: "f12", kind: "direct" },

  // derived / non-direct translations
  { a: "ff2", b: "f2",  kind: "derived" },
  { a: "ff3", b: "f4",  kind: "derived" },
  { a: "ff4", b: "f10", kind: "derived" },
  { a: "ff8", b: "f8",  kind: "derived" },
  { a: "ff8", b: "f9",  kind: "derived" },
  { a: "ff9", b: "f6",  kind: "derived" },

  // intra-Onshape feature dependency flow
  { a: "f1",  b: "f6",  kind: "flow" },
  { a: "f3",  b: "f6",  kind: "flow" },
  { a: "f5",  b: "f6",  kind: "flow" },
  { a: "f6",  b: "f7",  kind: "flow" },
  { a: "f7",  b: "f8",  kind: "flow" },
  { a: "f7",  b: "f9",  kind: "flow" },
  { a: "f10", b: "f11", kind: "flow" },
  { a: "f11", b: "f12", kind: "flow" },
];

const COLOR_FUSION  = "#06b6d4";
const COLOR_ONSHAPE = "#3b82f6";
const COLOR_DERIVED = "#d97706";
const COLOR_FLOW    = "#94a3b8";

export default function IntentWebViewer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");

      const w = mount.offsetWidth  || 300;
      const h = mount.offsetHeight || 260;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf8fafc);

      const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
      camera.position.set(0, 0, 145);
      camera.lookAt(0, 0, 0);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width = "100%";
      renderer.domElement.style.height = "100%";
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.6));

      const world = new THREE.Group();
      scene.add(world);

      const makeLabel = (text: string, color: string) => {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 56;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "22px monospace";
        ctx.fillStyle = color;
        ctx.textBaseline = "middle";
        ctx.fillText(text, 0, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(11, 11 * (canvas.height / canvas.width), 1);
        return sprite;
      };

      const nodeMeshes: import("three").Mesh[] = [];
      const nodeIndex = new Map<string, { mesh: import("three").Mesh; label: import("three").Sprite }>();

      NODES.forEach(n => {
        const color = n.side === "fusion" ? COLOR_FUSION : COLOR_ONSHAPE;
        const geo = new THREE.SphereGeometry(1.6, 16, 16);
        const mat = new THREE.MeshBasicMaterial({ color });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(n.x, n.y, n.z);
        mesh.userData.id = n.id;
        world.add(mesh);
        nodeMeshes.push(mesh);

        const label = makeLabel(n.label, color);
        label.position.set(n.x, n.y + 4.2, n.z);
        world.add(label);

        nodeIndex.set(n.id, { mesh, label });
      });

      const edgeLines: { line: import("three").Line; a: string; b: string }[] = [];
      EDGES.forEach(e => {
        const from = nodeIndex.get(e.a);
        const to = nodeIndex.get(e.b);
        if (!from || !to) return;
        const color = e.kind === "direct" ? COLOR_ONSHAPE : e.kind === "derived" ? COLOR_DERIVED : COLOR_FLOW;
        const opacity = e.kind === "flow" ? 0.5 : 0.75;
        const geometry = new THREE.BufferGeometry().setFromPoints([from.mesh.position, to.mesh.position]);
        const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
        const line = new THREE.Line(geometry, material);
        world.add(line);
        edgeLines.push({ line, a: e.a, b: e.b });
      });

      // ── Interaction: drag empty space to orbit, drag a node to reposition it ──
      const raycaster = new THREE.Raycaster();
      const mouseNdc = new THREE.Vector2();
      let orbiting = false;
      let draggedId: string | null = null;
      let px = 0, py = 0;
      let camZ = 145;
      const dragPlane = new THREE.Plane();
      const dragPoint = new THREE.Vector3();

      const setNdc = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouseNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouseNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      };

      const onDown = (e: MouseEvent) => {
        setNdc(e);
        raycaster.setFromCamera(mouseNdc, camera);
        const hit = raycaster.intersectObjects(nodeMeshes, false)[0];
        if (hit) {
          draggedId = hit.object.userData.id as string;
          const camDir = new THREE.Vector3();
          camera.getWorldDirection(camDir);
          dragPlane.setFromNormalAndCoplanarPoint(camDir, hit.object.getWorldPosition(new THREE.Vector3()));
        } else {
          orbiting = true;
          px = e.clientX;
          py = e.clientY;
        }
      };

      const onMove = (e: MouseEvent) => {
        if (draggedId) {
          setNdc(e);
          raycaster.setFromCamera(mouseNdc, camera);
          if (raycaster.ray.intersectPlane(dragPlane, dragPoint)) {
            const local = world.worldToLocal(dragPoint.clone());
            const entry = nodeIndex.get(draggedId);
            if (entry) {
              entry.mesh.position.copy(local);
              entry.label.position.set(local.x, local.y + 4.2, local.z);
            }
          }
          return;
        }
        if (orbiting) {
          world.rotation.y += (e.clientX - px) * 0.006;
          world.rotation.x = Math.max(-1.1, Math.min(1.1, world.rotation.x + (e.clientY - py) * 0.006));
          px = e.clientX;
          py = e.clientY;
        }
      };

      const onUp = () => { orbiting = false; draggedId = null; };

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        camZ = Math.max(60, Math.min(320, camZ + e.deltaY * 0.25));
        camera.position.setZ(camZ);
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);

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

      let raf: number;
      const animate = () => {
        raf = requestAnimationFrame(animate);
        // Edges are re-drawn from live node positions every frame — topology (which
        // nodes connect) never changes, but the line itself must follow dragged nodes.
        edgeLines.forEach(({ line, a, b }) => {
          const from = nodeIndex.get(a);
          const to = nodeIndex.get(b);
          if (!from || !to) return;
          const positions = line.geometry.attributes.position;
          positions.setXYZ(0, from.mesh.position.x, from.mesh.position.y, from.mesh.position.z);
          positions.setXYZ(1, to.mesh.position.x, to.mesh.position.y, to.mesh.position.z);
          positions.needsUpdate = true;
        });
        renderer.render(scene, camera);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        renderer.domElement.removeEventListener("mousedown", onDown);
        renderer.domElement.removeEventListener("wheel", onWheel);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
        renderer.dispose();
        if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      };
    })();

    return () => cleanup();
  }, []);

  return <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />;
}
