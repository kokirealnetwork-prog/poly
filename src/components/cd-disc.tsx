"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const OUTER_RADIUS = 2;
const INNER_RADIUS = 0.3;
const HUB_RADIUS = 0.72;
const DISC_THICKNESS = 0.055;

function createDiscGeometry() {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, OUTER_RADIUS, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, INNER_RADIUS, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: DISC_THICKNESS,
    bevelEnabled: false,
    curveSegments: 96,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
}

function createLabelTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const gradient = ctx.createRadialGradient(
    size * 0.42,
    size * 0.35,
    size * 0.05,
    size * 0.5,
    size * 0.5,
    size * 0.72,
  );
  gradient.addColorStop(0, "#f4e4c8");
  gradient.addColorStop(0.35, "#c47a4a");
  gradient.addColorStop(0.7, "#2f4f5a");
  gradient.addColorStop(1, "#121820");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 18; i += 1) {
    const y = size * (0.18 + i * 0.04);
    ctx.fillStyle = i % 3 === 0 ? "#ffd9a0" : "#8ec8d8";
    ctx.fillRect(size * 0.12, y, size * 0.76, 2 + (i % 2));
  }
  ctx.restore();

  const hub = INNER_RADIUS / OUTER_RADIUS;
  const labelOuter = HUB_RADIUS / OUTER_RADIUS;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * hub * 0.5, 0, Math.PI * 2);
  ctx.fillStyle = "#1a1e24";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * labelOuter * 0.5, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,245,230,0.92)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = "500 42px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("MIDNIGHT COMMUTE", size / 2, size * 0.38);

  ctx.font = "400 28px 'Figtree', sans-serif";
  ctx.fillStyle = "rgba(255,245,230,0.72)";
  ctx.fillText("OWN · 所持盤 001", size / 2, size * 0.46);

  ctx.font = "600 22px 'Figtree', sans-serif";
  ctx.fillStyle = "rgba(255,245,230,0.55)";
  ctx.fillText("SIDE A", size / 2, size * 0.62);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createDataSideTexture() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  const base = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.5,
  );
  base.addColorStop(0, "#2a3038");
  base.addColorStop(1, "#0c0e12");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  for (let r = 80; r < size * 0.48; r += 3) {
    const t = (r - 80) / (size * 0.48 - 80);
    const hue = 180 + t * 140;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.strokeStyle = `hsla(${hue}, 55%, ${42 + (r % 7)}%, ${0.08 + (r % 5) * 0.015})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.14, 0, Math.PI * 2);
  ctx.fillStyle = "#15181d";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function CdDisc() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 1.35, 7.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const discGroup = new THREE.Group();
    discGroup.rotation.set(-0.55, 0.35, 0.12);
    scene.add(discGroup);

    const geometry = createDiscGeometry();
    const labelTexture = createLabelTexture();
    const dataTexture = createDataSideTexture();

    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xb8c2cc,
      metalness: 0.9,
      roughness: 0.18,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
      reflectivity: 1,
    });
    const body = new THREE.Mesh(geometry, bodyMaterial);
    discGroup.add(body);

    const labelGeo = new THREE.RingGeometry(HUB_RADIUS, OUTER_RADIUS - 0.02, 96);
    labelGeo.rotateX(-Math.PI / 2);
    const labelMat = new THREE.MeshPhysicalMaterial({
      map: labelTexture,
      roughness: 0.55,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      side: THREE.FrontSide,
    });
    const label = new THREE.Mesh(labelGeo, labelMat);
    label.position.y = DISC_THICKNESS / 2 + 0.001;
    discGroup.add(label);

    const hubGeo = new THREE.RingGeometry(INNER_RADIUS + 0.01, HUB_RADIUS, 64);
    hubGeo.rotateX(-Math.PI / 2);
    const hubMat = new THREE.MeshPhysicalMaterial({
      color: 0xd8dee6,
      metalness: 0.15,
      roughness: 0.08,
      transmission: 0.35,
      thickness: 0.4,
      transparent: true,
      opacity: 0.85,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
    });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.y = DISC_THICKNESS / 2 + 0.0015;
    discGroup.add(hub);

    const dataGeo = new THREE.RingGeometry(INNER_RADIUS + 0.02, OUTER_RADIUS - 0.015, 96);
    dataGeo.rotateX(Math.PI / 2);
    const dataMat = new THREE.MeshPhysicalMaterial({
      map: dataTexture,
      metalness: 0.95,
      roughness: 0.12,
      clearcoat: 1,
      clearcoatRoughness: 0.05,
      iridescence: 1,
      iridescenceIOR: 1.3,
      iridescenceThicknessRange: [120, 420],
      side: THREE.FrontSide,
    });
    const dataSide = new THREE.Mesh(dataGeo, dataMat);
    dataSide.position.y = -DISC_THICKNESS / 2 - 0.001;
    discGroup.add(dataSide);

    const shadowGeo = new THREE.CircleGeometry(OUTER_RADIUS * 0.92, 64);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x0a0c10,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, -1.55, 0);
    shadow.scale.set(1.05, 1, 0.72);
    scene.add(shadow);

    scene.add(new THREE.AmbientLight(0xfff4e8, 0.55));
    const key = new THREE.DirectionalLight(0xfff7ef, 2.8);
    key.position.set(-3.5, 5.5, 4.5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x9eb8c8, 1.2);
    fill.position.set(4, 1.5, 2);
    scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffc9a0, 1.4);
    rim.position.set(2, -1, -4);
    scene.add(rim);

    let audioContext: AudioContext | null = null;
    const ensureAudio = () => {
      if (!audioContext) {
        const AudioCtor =
          window.AudioContext ??
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtor) audioContext = new AudioCtor();
      }
      if (audioContext?.state === "suspended") void audioContext.resume();
    };

    const playPlasticTick = () => {
      if (!audioContext) return;
      const start = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(880, start);
      osc.frequency.exponentialRampToValueAtTime(220, start + 0.08);
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.1);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + 0.11);
    };

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let idlePhase = 0;

    const applyRotation = (dx: number, dy: number) => {
      const horizontal = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        dx * 0.01,
      );
      const vertical = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        dy * 0.01,
      );
      discGroup.quaternion.premultiply(horizontal).premultiply(vertical);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      ensureAudio();
      playPlasticTick();
      navigator.vibrate?.(10);
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      velocityX = event.clientX - previousX;
      velocityY = event.clientY - previousY;
      previousX = event.clientX;
      previousY = event.clientY;
      applyRotation(velocityX, velocityY);
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
      if (!dragging) {
        if (Math.abs(velocityX) + Math.abs(velocityY) > 0.02) {
          applyRotation(velocityX, velocityY);
          velocityX *= 0.955;
          velocityY *= 0.955;
        } else {
          idlePhase += 0.008;
          discGroup.rotation.z += Math.sin(idlePhase) * 0.00035;
          discGroup.rotation.y += 0.0012;
        }
      }

      shadowMat.opacity =
        0.16 + Math.min(0.12, (Math.abs(velocityX) + Math.abs(velocityY)) * 0.002);
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
      labelGeo.dispose();
      hubGeo.dispose();
      dataGeo.dispose();
      shadowGeo.dispose();
      bodyMaterial.dispose();
      labelMat.dispose();
      hubMat.dispose();
      dataMat.dispose();
      shadowMat.dispose();
      labelTexture.dispose();
      dataTexture.dispose();
      void audioContext?.close();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cd-disc"
      role="img"
      aria-label="ドラッグやスワイプで回転できるCD"
    />
  );
}
