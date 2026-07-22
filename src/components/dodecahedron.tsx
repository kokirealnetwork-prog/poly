"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Dodecahedron() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    const geometry = new THREE.DodecahedronGeometry(2, 0);
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xf2a7bd,
      roughness: 0.82,
      metalness: 0,
      clearcoat: 0,
      flatShading: true,
    });
    const solid = new THREE.Mesh(geometry, material);

    const edgeGeometry = new THREE.EdgesGeometry(geometry, 12);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0x4e2834,
      transparent: true,
      opacity: 0.3,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

    const shape = new THREE.Group();
    shape.add(solid, edges);
    shape.rotation.set(-0.28, 0.5, 0.08);
    scene.add(shape);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x5b674b, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffffff, 4.2);
    keyLight.position.set(-4, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x95aaff, 2.2);
    rimLight.position.set(5, -2, -3);
    scene.add(rimLight);

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let velocityX = 0;
    let velocityY = 0;

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;

      velocityX = event.clientX - previousX;
      velocityY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;

      const horizontal = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        velocityX * 0.009,
      );
      const vertical = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        velocityY * 0.009,
      );
      shape.quaternion.premultiply(horizontal).premultiply(vertical);
    };

    const stopDragging = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) {
        renderer.domElement.releasePointerCapture(event.pointerId);
      }
      renderer.domElement.classList.remove("is-dragging");
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", stopDragging);
    renderer.domElement.addEventListener("pointercancel", stopDragging);

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let animationFrame = 0;
    const animate = () => {
      if (!dragging && Math.abs(velocityX) + Math.abs(velocityY) > 0.02) {
        const horizontal = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0),
          velocityX * 0.009,
        );
        const vertical = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(1, 0, 0),
          velocityY * 0.009,
        );
        shape.quaternion.premultiply(horizontal).premultiply(vertical);
        velocityX *= 0.94;
        velocityY *= 0.94;
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", stopDragging);
      renderer.domElement.removeEventListener("pointercancel", stopDragging);
      geometry.dispose();
      edgeGeometry.dispose();
      material.dispose();
      edgeMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="dodecahedron"
      role="img"
      aria-label="ドラッグして360度回転できる正十二面体"
    />
  );
}
