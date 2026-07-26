"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const OUTER_RADIUS = 1;
const INNER_RADIUS = 0.15;
const HUB_RADIUS = 0.36;
const DISC_THICKNESS = 0.028;

const CASE_W = 1.78;
const CASE_H = 1.58;
const CASE_D = 0.16;

type ViewMode = "jacket" | "disc";

type CdDiscProps = {
  onViewChange?: (view: ViewMode) => void;
};

function cssFont(cssVar: string, fallback: string) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function fontDisplay() {
  return cssFont("--font-zen", "Zen Kurenaido, serif");
}

function fontFigtree() {
  return cssFont("--font-figtree", "Figtree, sans-serif");
}

function createCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = 1024,
) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function softBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  color: string,
) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function paintWatercolorSky(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Base wash — airy sky blue to white
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#cfeaf8");
  sky.addColorStop(0.35, "#e7f5fc");
  sky.addColorStop(0.7, "#f7fbfe");
  sky.addColorStop(1, "#eef6e8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Soft watercolor blooms
  softBlob(ctx, w * 0.2, h * 0.18, w * 0.35, "rgba(170, 214, 240, 0.55)");
  softBlob(ctx, w * 0.75, h * 0.12, w * 0.32, "rgba(186, 224, 245, 0.5)");
  softBlob(ctx, w * 0.55, h * 0.3, w * 0.4, "rgba(255, 255, 255, 0.65)");
  softBlob(ctx, w * 0.15, h * 0.55, w * 0.28, "rgba(190, 230, 210, 0.28)");
  softBlob(ctx, w * 0.82, h * 0.62, w * 0.3, "rgba(255, 236, 180, 0.22)");
  softBlob(ctx, w * 0.5, h * 0.78, w * 0.45, "rgba(210, 232, 200, 0.35)");

  // Distant path toward the light
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.42, h * 0.92);
  ctx.quadraticCurveTo(w * 0.46, h * 0.62, w * 0.49, h * 0.42);
  ctx.quadraticCurveTo(w * 0.52, h * 0.62, w * 0.58, h * 0.92);
  ctx.closePath();
  const pathGrad = ctx.createLinearGradient(0, h * 0.4, 0, h);
  pathGrad.addColorStop(0, "rgba(255,255,255,0.15)");
  pathGrad.addColorStop(1, "rgba(210, 200, 170, 0.35)");
  ctx.fillStyle = pathGrad;
  ctx.fill();
  ctx.restore();

  // Bright horizon glow
  softBlob(ctx, w * 0.5, h * 0.38, w * 0.22, "rgba(255, 255, 255, 0.85)");
  softBlob(ctx, w * 0.5, h * 0.36, w * 0.1, "rgba(255, 250, 220, 0.55)");

  // Two tiny figures on the path
  ctx.fillStyle = "rgba(70, 90, 110, 0.45)";
  const drawFigure = (fx: number, fy: number, scale: number) => {
    ctx.beginPath();
    ctx.ellipse(fx, fy - scale * 7, scale * 2.2, scale * 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx, fy - scale * 4);
    ctx.quadraticCurveTo(fx - scale * 3, fy + scale * 4, fx - scale * 1.5, fy + scale * 10);
    ctx.quadraticCurveTo(fx, fy + scale * 6, fx + scale * 1.5, fy + scale * 10);
    ctx.quadraticCurveTo(fx + scale * 3, fy + scale * 4, fx, fy - scale * 4);
    ctx.fill();
  };
  drawFigure(w * 0.475, h * 0.7, w * 0.0045);
  drawFigure(w * 0.515, h * 0.695, w * 0.0048);
}

function paintAlbumArt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  paintWatercolorSky(ctx, w, h);

  // Thin white frame — like the reference jacket
  ctx.strokeStyle = "rgba(255,255,255,0.78)";
  ctx.lineWidth = Math.max(2, w * 0.006);
  const inset = w * 0.14;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  // Handwritten-style title block
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(55, 72, 92, 0.82)";
  ctx.font = `400 ${Math.round(w * 0.07)}px ${fontDisplay()}`;
  ctx.fillText("夏のボーイフレンド", w / 2, h * 0.5);

  ctx.fillStyle = "rgba(90, 115, 135, 0.7)";
  ctx.font = `400 ${Math.round(w * 0.022)}px ${fontFigtree()}`;
  ctx.fillText("NATSU NO BOYFRIEND  since 2009", w / 2, h * 0.57);

  ctx.fillStyle = "rgba(110, 140, 155, 0.55)";
  ctx.font = `500 ${Math.round(w * 0.018)}px ${fontFigtree()}`;
  ctx.fillText("A SONG WITH OWN", w / 2, h * 0.62);
}

function createJacketTexture() {
  return createCanvasTexture((ctx, size) => {
    paintAlbumArt(ctx, size, size);
  });
}

function createBackCoverTexture() {
  return createCanvasTexture((ctx, size) => {
    paintWatercolorSky(ctx, size, size);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "rgba(55, 72, 92, 0.85)";
    ctx.textAlign = "left";
    ctx.font = `400 ${Math.round(size * 0.048)}px ${fontDisplay()}`;
    ctx.fillText("夏のボーイフレンド", size * 0.1, size * 0.16);
    ctx.font = `400 ${Math.round(size * 0.02)}px ${fontFigtree()}`;
    ctx.fillStyle = "rgba(90, 115, 135, 0.7)";
    ctx.fillText("NATSU NO BOYFRIEND  ·  OWN", size * 0.1, size * 0.22);

    const tracks = [
      "01  朝の窓辺",
      "02  自転車の影",
      "03  汽水の匂い",
      "04  午後のバス",
      "05  帰り道",
      "06  夜のラジオ",
    ];
    tracks.forEach((track, index) => {
      const y = size * (0.38 + index * 0.075);
      ctx.fillStyle = "rgba(70, 95, 115, 0.72)";
      ctx.font = `400 ${Math.round(size * 0.028)}px ${fontDisplay()}`;
      ctx.fillText(track, size * 0.1, y);
    });
  });
}

function createSpineTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, "#cfeaf8");
    grad.addColorStop(0.5, "#e8f5fb");
    grad.addColorStop(1, "#dcefdc");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 1024);
    ctx.save();
    ctx.translate(128, 512);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(55, 72, 92, 0.8)";
    ctx.font = `400 36px ${fontDisplay()}`;
    ctx.textAlign = "center";
    ctx.fillText("夏のボーイフレンド  ·  OWN", 0, 12);
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture() {
  return createCanvasTexture((ctx, size) => {
    // Matching soft watercolor disc face — mostly image, little text
    paintWatercolorSky(ctx, size, size);

    const hub = INNER_RADIUS / OUTER_RADIUS;
    const labelOuter = HUB_RADIUS / OUTER_RADIUS;

    // Soft ring toward hub
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * labelOuter * 0.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * hub * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = "#f7fbfe";
    ctx.fill();
    ctx.strokeStyle = "rgba(170, 200, 220, 0.5)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(55, 72, 92, 0.55)";
    ctx.font = `400 ${Math.round(size * 0.032)}px ${fontDisplay()}`;
    ctx.fillText("夏のボーイフレンド", size / 2, size * 0.36);
    ctx.fillStyle = "rgba(90, 115, 135, 0.4)";
    ctx.font = `400 ${Math.round(size * 0.018)}px ${fontFigtree()}`;
    ctx.fillText("OWN", size / 2, size * 0.64);
  });
}

function createDataSideTexture() {
  return createCanvasTexture((ctx, size) => {
    const base = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.5,
    );
    base.addColorStop(0, "#d8e8f2");
    base.addColorStop(0.5, "#9bb8c8");
    base.addColorStop(1, "#6a8494");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    for (let r = 70; r < size * 0.48; r += 2.5) {
      const t = (r - 70) / (size * 0.48 - 70);
      const hue = 190 + t * 25;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 28%, ${55 + (r % 5)}%, ${0.06 + (r % 4) * 0.01})`;
      ctx.lineWidth = 1.1;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.14, 0, Math.PI * 2);
    ctx.fillStyle = "#eef6fa";
    ctx.fill();
  });
}

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

function createDiscGroup(
  labelTexture: THREE.Texture,
  dataTexture: THREE.Texture,
) {
  const discGroup = new THREE.Group();
  const geometry = createDiscGeometry();

  const bodyMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb8c2cc,
    metalness: 0.9,
    roughness: 0.18,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
    reflectivity: 1,
  });
  discGroup.add(new THREE.Mesh(geometry, bodyMaterial));

  const labelGeo = new THREE.RingGeometry(HUB_RADIUS, OUTER_RADIUS - 0.02, 96);
  labelGeo.rotateX(-Math.PI / 2);
  const labelMat = new THREE.MeshPhysicalMaterial({
    map: labelTexture,
    roughness: 0.55,
    metalness: 0.05,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
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
  });
  const dataSide = new THREE.Mesh(dataGeo, dataMat);
  dataSide.position.y = -DISC_THICKNESS / 2 - 0.001;
  discGroup.add(dataSide);

  return {
    discGroup,
    disposables: [
      geometry,
      labelGeo,
      hubGeo,
      dataGeo,
      bodyMaterial,
      labelMat,
      hubMat,
      dataMat,
    ] as (THREE.BufferGeometry | THREE.Material)[],
  };
}

function createJewelCase(
  jacketTexture: THREE.Texture,
  backTexture: THREE.Texture,
  spineTexture: THREE.Texture,
) {
  const caseRoot = new THREE.Group();
  const shell = new THREE.Group();
  caseRoot.add(shell);

  const makePlastic = () =>
    new THREE.MeshStandardMaterial({
      color: 0xf2f4f6,
      metalness: 0.05,
      roughness: 0.35,
      transparent: true,
      opacity: 0.35,
    });

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  const backGeo = new THREE.BoxGeometry(CASE_W, CASE_H, CASE_D * 0.45);
  const backMat = makePlastic();
  const backShell = new THREE.Mesh(backGeo, backMat);
  backShell.position.z = -CASE_D * 0.28;
  shell.add(backShell);
  disposables.push(backGeo, backMat);

  const backArtGeo = new THREE.PlaneGeometry(CASE_W * 0.94, CASE_H * 0.94);
  const backArtMat = new THREE.MeshStandardMaterial({
    map: backTexture,
    roughness: 0.55,
    metalness: 0.02,
  });
  const backArt = new THREE.Mesh(backArtGeo, backArtMat);
  backArt.position.z = -CASE_D * 0.5 - 0.002;
  backArt.rotation.y = Math.PI;
  shell.add(backArt);
  disposables.push(backArtGeo, backArtMat);

  const spineGeo = new THREE.BoxGeometry(CASE_D * 0.9, CASE_H, CASE_D * 0.9);
  const spineMat = new THREE.MeshStandardMaterial({
    map: spineTexture,
    roughness: 0.5,
    metalness: 0.02,
  });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.set(-CASE_W / 2 + CASE_D * 0.2, 0, -CASE_D * 0.05);
  shell.add(spine);
  disposables.push(spineGeo, spineMat);

  // Light tray — a dark tray reads as a navy drop-shadow on white.
  const trayGeo = new THREE.BoxGeometry(CASE_W * 0.88, CASE_H * 0.88, 0.08);
  const trayMat = new THREE.MeshStandardMaterial({
    color: 0xe8ecf0,
    roughness: 0.7,
    metalness: 0,
  });
  const tray = new THREE.Mesh(trayGeo, trayMat);
  tray.position.z = -CASE_D * 0.08;
  shell.add(tray);
  disposables.push(trayGeo, trayMat);

  const lid = new THREE.Group();
  lid.position.set(-CASE_W / 2, 0, CASE_D * 0.12);
  shell.add(lid);

  const lidPanel = new THREE.Group();
  lidPanel.position.x = CASE_W / 2;
  lid.add(lidPanel);

  const frontGeo = new THREE.BoxGeometry(CASE_W, CASE_H, 0.06);
  const frontMat = makePlastic();
  const frontPlastic = new THREE.Mesh(frontGeo, frontMat);
  frontPlastic.position.z = 0.04;
  lidPanel.add(frontPlastic);
  disposables.push(frontGeo, frontMat);

  const jacketGeo = new THREE.PlaneGeometry(CASE_W * 0.92, CASE_H * 0.92);
  const jacketMat = new THREE.MeshStandardMaterial({
    map: jacketTexture,
    roughness: 0.5,
    metalness: 0.02,
  });
  const jacket = new THREE.Mesh(jacketGeo, jacketMat);
  jacket.position.z = 0.075;
  lidPanel.add(jacket);
  disposables.push(jacketGeo, jacketMat);

  const bookletGeo = new THREE.PlaneGeometry(CASE_W * 0.9, CASE_H * 0.9);
  const bookletMat = new THREE.MeshStandardMaterial({
    map: jacketTexture,
    roughness: 0.55,
    metalness: 0.02,
  });
  const booklet = new THREE.Mesh(bookletGeo, bookletMat);
  booklet.position.z = 0.01;
  lidPanel.add(booklet);
  disposables.push(bookletGeo, bookletMat);

  return { caseRoot, lid, disposables };
}

export function CdDisc({ onViewChange }: CdDiscProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onViewChangeRef = useRef(onViewChange);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanupScene: (() => void) | undefined;

    const start = async () => {
      try {
        await document.fonts.ready;
      } catch {
        // Fonts are optional for first paint; proceed with fallbacks.
      }
      if (disposed || !containerRef.current) return;

      cleanupScene = mountScene(containerRef.current, onViewChangeRef);
      if (disposed) {
        cleanupScene();
        cleanupScene = undefined;
      }
    };

    void start();

    return () => {
      disposed = true;
      cleanupScene?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="cd-disc"
      role="img"
      aria-label="ジャケットをタップすると中のCDに切り替わります。ドラッグで回転できます。"
    />
  );
}

function mountScene(
  container: HTMLDivElement,
  onViewChangeRef: { current?: (view: ViewMode) => void },
) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.2, 7.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Keep pure white — filmic tone mapping can muddy the clear color.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const jacketTexture = createJacketTexture();
    const backTexture = createBackCoverTexture();
    const spineTexture = createSpineTexture();
    const labelTexture = createLabelTexture();
    const dataTexture = createDataSideTexture();

    const root = new THREE.Group();
    root.rotation.set(-0.12, 0.28, 0.02);
    scene.add(root);

    const { caseRoot, lid, disposables: caseDisposables } = createJewelCase(
      jacketTexture,
      backTexture,
      spineTexture,
    );
    root.add(caseRoot);

    const seated = createDiscGroup(labelTexture, dataTexture);
    seated.discGroup.scale.setScalar(0.72);
    seated.discGroup.rotation.x = -Math.PI / 2;
    seated.discGroup.position.set(0.03, 0, -0.008);
    caseRoot.add(seated.discGroup);

    const held = createDiscGroup(labelTexture, dataTexture);
    held.discGroup.visible = false;
    held.discGroup.scale.setScalar(0.01);
    root.add(held.discGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const key = new THREE.DirectionalLight(0xffffff, 1.6);
    key.position.set(-2.5, 4, 5);
    key.castShadow = false;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1.4);
    fill.position.set(3, 3, 2);
    fill.castShadow = false;
    scene.add(fill);
    const bounce = new THREE.DirectionalLight(0xffffff, 1.5);
    bounce.position.set(0, -5, 3);
    bounce.castShadow = false;
    scene.add(bounce);

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
      osc.frequency.setValueAtTime(720, start);
      osc.frequency.exponentialRampToValueAtTime(180, start + 0.1);
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + 0.13);
    };

    const playCaseOpen = () => {
      if (!audioContext) return;
      const start = audioContext.currentTime;
      const osc = audioContext.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(240, start);
      osc.frequency.exponentialRampToValueAtTime(90, start + 0.22);
      const gain = audioContext.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.11, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    };

    let view: ViewMode = "jacket";
    let transition = 0;
    let transitionFrom = 0;
    let transitionTo = 0;
    let transitioning = false;
    let transitionStart = 0;
    const TRANSITION_MS = 620;
    // Lid opens only this far, then we cut to the disc view.
    const OPEN_CUT = 0.38;
    const LID_OPEN_ANGLE = 0.95;

    let dragging = false;
    let previousX = 0;
    let previousY = 0;
    let velocityX = 0;
    let velocityY = 0;
    let idlePhase = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let pointerDownTime = 0;
    const TAP_MAX_MOVEMENT = 8;
    const TAP_MAX_DURATION_MS = 320;

    const resetSeatedDisc = () => {
      seated.discGroup.scale.setScalar(0.72);
      seated.discGroup.rotation.x = -Math.PI / 2;
      seated.discGroup.position.set(0.03, 0, -0.008);
      seated.discGroup.visible = true;
    };

    const beginTransition = (next: ViewMode) => {
      if (transitioning || next === view) return;
      transitioning = true;
      transitionStart = performance.now();
      transitionFrom = transition;
      transitionTo = next === "disc" ? 1 : 0;
      view = next;
      onViewChangeRef.current?.(next);
      ensureAudio();
      playCaseOpen();
      navigator.vibrate?.(16);

      if (next === "disc") {
        // Keep disc view hidden until the mid-open cut.
        held.discGroup.visible = false;
        held.discGroup.scale.setScalar(0.01);
        caseRoot.visible = true;
        resetSeatedDisc();
        lid.rotation.y = 0;
      } else {
        caseRoot.visible = false;
        held.discGroup.visible = true;
      }
      velocityX = 0;
      velocityY = 0;
    };

    const applyRotation = (dx: number, dy: number) => {
      const horizontal = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(0, 1, 0),
        dx * 0.01,
      );
      const vertical = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        dy * 0.01,
      );
      root.quaternion.premultiply(horizontal).premultiply(vertical);
    };

    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
      pointerDownTime = performance.now();
      velocityX = 0;
      velocityY = 0;
      ensureAudio();
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging || transitioning) return;
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

      const movedDistance = Math.hypot(
        event.clientX - pointerDownX,
        event.clientY - pointerDownY,
      );
      const heldDuration = performance.now() - pointerDownTime;
      const isTap =
        movedDistance < TAP_MAX_MOVEMENT && heldDuration < TAP_MAX_DURATION_MS;

      if (isTap && !transitioning) {
        playPlasticTick();
        beginTransition(view === "jacket" ? "disc" : "jacket");
      }
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

    const easeInOut = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

    let animationFrame = 0;
    const animate = () => {
      if (transitioning) {
        const raw = Math.min(
          (performance.now() - transitionStart) / TRANSITION_MS,
          1,
        );
        const t = easeInOut(raw);
        transition = transitionFrom + (transitionTo - transitionFrom) * t;
        const opening = transitionTo > transitionFrom;

        if (opening) {
          // Phase 1: lid opens a little — disc stays seated, no piercing.
          if (transition < OPEN_CUT) {
            const openT = transition / OPEN_CUT;
            lid.rotation.y = -openT * LID_OPEN_ANGLE;
            caseRoot.visible = true;
            caseRoot.scale.setScalar(1);
            caseRoot.position.set(0, 0, 0);
            resetSeatedDisc();
            held.discGroup.visible = false;
            held.discGroup.scale.setScalar(0.01);
          } else {
            // Phase 2: cut short — hide jacket, reveal CD.
            caseRoot.visible = false;
            lid.rotation.y = 0;
            resetSeatedDisc();
            const reveal = (transition - OPEN_CUT) / (1 - OPEN_CUT);
            held.discGroup.visible = true;
            held.discGroup.scale.setScalar(0.82 + reveal * 0.18);
            held.discGroup.position.set(0, (1 - reveal) * 0.25, 0);
            held.discGroup.rotation.x = (1 - reveal) * -0.35;
          }
        } else {
          // Return: CD out, then jacket appears already closed.
          const closing = 1 - transition;
          if (closing < 0.45) {
            const outT = closing / 0.45;
            held.discGroup.visible = true;
            held.discGroup.scale.setScalar(1 - outT * 0.9);
            held.discGroup.position.set(0, outT * 0.2, 0);
            caseRoot.visible = false;
          } else {
            held.discGroup.visible = false;
            held.discGroup.scale.setScalar(0.01);
            caseRoot.visible = true;
            caseRoot.scale.setScalar(1);
            caseRoot.position.set(0, 0, 0);
            lid.rotation.y = 0;
            resetSeatedDisc();
          }
        }

        if (raw >= 1) {
          transitioning = false;
          transition = transitionTo;
          if (transitionTo === 1) {
            caseRoot.visible = false;
            held.discGroup.visible = true;
            held.discGroup.scale.setScalar(1);
            held.discGroup.position.set(0, 0, 0);
            held.discGroup.rotation.x = 0;
          } else {
            held.discGroup.visible = false;
            held.discGroup.scale.setScalar(0.01);
            held.discGroup.position.set(0, 0, 0);
            held.discGroup.rotation.x = 0;
            caseRoot.visible = true;
            caseRoot.scale.setScalar(1);
            caseRoot.position.set(0, 0, 0);
            lid.rotation.y = 0;
            resetSeatedDisc();
          }
        }
      } else if (!dragging) {
        if (Math.abs(velocityX) + Math.abs(velocityY) > 0.02) {
          applyRotation(velocityX, velocityY);
          velocityX *= 0.955;
          velocityY *= 0.955;
        } else {
          idlePhase += 0.008;
          root.rotation.z += Math.sin(idlePhase) * 0.0003;
          root.rotation.y += 0.0009;
        }
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
      caseDisposables.forEach((item) => item.dispose());
      seated.disposables.forEach((item) => item.dispose());
      held.disposables.forEach((item) => item.dispose());
      jacketTexture.dispose();
      backTexture.dispose();
      spineTexture.dispose();
      labelTexture.dispose();
      dataTexture.dispose();
      void audioContext?.close();
      renderer.dispose();
      renderer.domElement.remove();
    };
}
