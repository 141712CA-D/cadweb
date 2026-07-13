"use client";

import { useEffect, useRef } from "react";

export default function MugModelViewer() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { STLLoader } = await import("three/examples/jsm/loaders/STLLoader.js" as any);

      // Use actual container size (guaranteed non-zero via ResizeObserver below)
      const w = mount.offsetWidth  || 300;
      const h = mount.offsetHeight || 220;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070707);

      const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 2000);
      camera.position.set(0, 0, 200);
      camera.lookAt(0, 0, 0);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(w, h);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      // Make canvas fill container, not overflow it
      renderer.domElement.style.display = "block";
      renderer.domElement.style.width  = "100%";
      renderer.domElement.style.height = "100%";
      mount.appendChild(renderer.domElement);

      scene.add(new THREE.AmbientLight(0xffffff, 0.45));
      const d1 = new THREE.DirectionalLight(0xffffff, 1.1);
      d1.position.set(120, 150, 100);
      scene.add(d1);
      const d2 = new THREE.DirectionalLight(0x44ff88, 0.25);
      d2.position.set(-100, -80, -60);
      scene.add(d2);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let meshObj: any = null;
      // CAD exports are Z-up; Three.js is Y-up — start upright, facing front
      let rotX = -Math.PI / 2, rotY = 0;
      let dragging = false, px = 0, py = 0;
      // Zoom: camera Z clamped between 80 and 450
      let camZ = 200;

      const addGeometry = (geo: import("three").BufferGeometry) => {
        geo.computeVertexNormals();
        geo.center();
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf0f0f0,
          roughness: 0.35,
          metalness: 0.08,
        });
        meshObj = new THREE.Mesh(geo, mat);
        const box = new THREE.Box3().setFromObject(meshObj);
        const size = box.getSize(new THREE.Vector3());
        const maxS = Math.max(size.x, size.y, size.z);
        if (maxS > 0) meshObj.scale.setScalar(110 / maxS);
        meshObj.rotation.set(rotX, rotY, 0);
        scene.add(meshObj);
      };

      const loader = new STLLoader();
      loader.load(
        "/mug_v1.stl",
        addGeometry,
        undefined,
        () => {
          const geo = new THREE.CylinderGeometry(40, 35, 95, 48);
          addGeometry(geo);
        }
      );

      // Drag to rotate
      const onDown = (e: MouseEvent) => { dragging = true; px = e.clientX; py = e.clientY; };
      const onMove = (e: MouseEvent) => {
        if (!dragging || !meshObj) return;
        rotY += (e.clientX - px) * 0.007;
        // Clamp tilt around the upright start angle
        rotX = Math.max(-Math.PI / 2 - 1.0, Math.min(-Math.PI / 2 + 1.0, rotX + (e.clientY - py) * 0.007));
        meshObj.rotation.set(rotX, rotY, 0);
        px = e.clientX;
        py = e.clientY;
      };
      const onUp = () => { dragging = false; };

      // Scroll to zoom
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        camZ = Math.max(80, Math.min(450, camZ + e.deltaY * 0.3));
        camera.position.setZ(camZ);
      };

      renderer.domElement.addEventListener("mousedown", onDown);
      renderer.domElement.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);

      // Resize observer keeps renderer in sync with container
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

  return <div ref={mountRef} className="w-full h-full" />;
}
