"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const OUTER_RADIUS = 2;
const INNER_RADIUS = 0.3;
const HUB_RADIUS = 0.72;
const DISC_THICKNESS = 0.055;

const CASE_W = 3.55;
const CASE_H = 3.15;
const CASE_D = 0.32;

type ViewMode = "jacket" | "disc";

type CdDiscProps = {
  onViewChange?: (view: ViewMode) => void;
};

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

function paintAlbumArt(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createRadialGradient(
    w * 0.42,
    h * 0.35,
    w * 0.05,
    w * 0.5,
    h * 0.5,
    w * 0.72,
  );
  gradient.addColorStop(0, "#f4e4c8");
  gradient.addColorStop(0.35, "#c47a4a");
  gradient.addColorStop(0.7, "#2f4f5a");
  gradient.addColorStop(1, "#121820");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 18; i += 1) {
    const y = h * (0.18 + i * 0.04);
    ctx.fillStyle = i % 3 === 0 ? "#ffd9a0" : "#8ec8d8";
    ctx.fillRect(w * 0.08, y, w * 0.84, 2 + (i % 2));
  }
  ctx.restore();

  ctx.fillStyle = "rgba(255,245,230,0.94)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `500 ${Math.round(w * 0.055)}px 'Cormorant Garamond', Georgia, serif`;
  ctx.fillText("MIDNIGHT COMMUTE", w / 2, h * 0.42);
  ctx.font = `400 ${Math.round(w * 0.032)}px 'Figtree', sans-serif`;
  ctx.fillStyle = "rgba(255,245,230,0.7)";
  ctx.fillText("OWN · 所持盤 001", w / 2, h * 0.5);
}

function createJacketTexture() {
  return createCanvasTexture((ctx, size) => {
    paintAlbumArt(ctx, size, size);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, size - 36, size - 36);
  });
}

function createBackCoverTexture() {
  return createCanvasTexture((ctx, size) => {
    ctx.fillStyle = "#1a222a";
    ctx.fillRect(0, 0, size, size);
    paintAlbumArt(ctx, size, size);
    ctx.fillStyle = "rgba(10,12,16,0.72)";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "rgba(243,235,224,0.88)";
    ctx.textAlign = "left";
    ctx.font = "500 36px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText("MIDNIGHT COMMUTE", size * 0.12, size * 0.18);
    ctx.font = "400 22px 'Figtree', sans-serif";
    ctx.fillStyle = "rgba(243,235,224,0.55)";
    ctx.fillText("OWN · 所持盤 001", size * 0.12, size * 0.24);

    const tracks = [
      "01  Platform Light",
      "02  Last Train Home",
      "03  Sodium Glow",
      "04  Underpass",
      "05  Quiet Carriage",
      "06  Arrival",
    ];
    ctx.font = "400 26px 'Figtree', sans-serif";
    tracks.forEach((track, index) => {
      ctx.fillStyle = "rgba(243,235,224,0.72)";
      ctx.fillText(track, size * 0.12, size * (0.38 + index * 0.07));
    });
  });
}

function createSpineTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 1024);
    gradient.addColorStop(0, "#2f4f5a");
    gradient.addColorStop(0.5, "#c47a4a");
    gradient.addColorStop(1, "#121820");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 1024);
    ctx.save();
    ctx.translate(128, 512);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = "rgba(255,245,230,0.9)";
    ctx.font = "500 42px 'Cormorant Garamond', Georgia, serif";
    ctx.textAlign = "center";
    ctx.fillText("MIDNIGHT COMMUTE  ·  OWN", 0, 12);
    ctx.restore();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createLabelTexture() {
  return createCanvasTexture((ctx, size) => {
    paintAlbumArt(ctx, size, size);

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
    new THREE.MeshPhysicalMaterial({
      color: 0xd8e2ea,
      metalness: 0.05,
      roughness: 0.12,
      transmission: 0.55,
      thickness: 0.35,
      transparent: true,
      opacity: 0.55,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });

  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  const backGeo = new THREE.BoxGeometry(CASE_W, CASE_H, CASE_D * 0.45);
  const backMat = makePlastic();
  const backShell = new THREE.Mesh(backGeo, backMat);
  backShell.position.z = -CASE_D * 0.28;
  shell.add(backShell);
  disposables.push(backGeo, backMat);

  const backArtGeo = new THREE.PlaneGeometry(CASE_W * 0.94, CASE_H * 0.94);
  const backArtMat = new THREE.MeshPhysicalMaterial({
    map: backTexture,
    roughness: 0.45,
    metalness: 0.05,
  });
  const backArt = new THREE.Mesh(backArtGeo, backArtMat);
  backArt.position.z = -CASE_D * 0.5 - 0.002;
  backArt.rotation.y = Math.PI;
  shell.add(backArt);
  disposables.push(backArtGeo, backArtMat);

  const spineGeo = new THREE.BoxGeometry(CASE_D * 0.9, CASE_H, CASE_D * 0.9);
  const spineMat = new THREE.MeshPhysicalMaterial({
    map: spineTexture,
    roughness: 0.4,
    metalness: 0.05,
  });
  const spine = new THREE.Mesh(spineGeo, spineMat);
  spine.position.set(-CASE_W / 2 + CASE_D * 0.2, 0, -CASE_D * 0.05);
  shell.add(spine);
  disposables.push(spineGeo, spineMat);

  const trayGeo = new THREE.BoxGeometry(CASE_W * 0.88, CASE_H * 0.88, 0.08);
  const trayMat = new THREE.MeshPhysicalMaterial({
    color: 0x1c2228,
    roughness: 0.55,
    metalness: 0.1,
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
  const jacketMat = new THREE.MeshPhysicalMaterial({
    map: jacketTexture,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.35,
    clearcoatRoughness: 0.3,
  });
  const jacket = new THREE.Mesh(jacketGeo, jacketMat);
  jacket.position.z = 0.075;
  lidPanel.add(jacket);
  disposables.push(jacketGeo, jacketMat);

  const bookletGeo = new THREE.PlaneGeometry(CASE_W * 0.9, CASE_H * 0.9);
  const bookletMat = new THREE.MeshPhysicalMaterial({
    map: jacketTexture,
    roughness: 0.5,
    metalness: 0.04,
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

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.85, 7.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0xffffff, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const jacketTexture = createJacketTexture();
    const backTexture = createBackCoverTexture();
    const spineTexture = createSpineTexture();
    const labelTexture = createLabelTexture();
    const dataTexture = createDataSideTexture();

    const root = new THREE.Group();
    root.rotation.set(-0.28, 0.42, 0.06);
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
    seated.discGroup.position.set(0.06, 0, -0.015);
    caseRoot.add(seated.discGroup);

    const held = createDiscGroup(labelTexture, dataTexture);
    held.discGroup.visible = false;
    held.discGroup.scale.setScalar(0.01);
    root.add(held.discGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 1.05));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(-3.5, 5.5, 4.5);
    key.castShadow = false;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 1.35);
    fill.position.set(4, 2.5, 3);
    fill.castShadow = false;
    scene.add(fill);
    const bounce = new THREE.DirectionalLight(0xffffff, 1.2);
    bounce.position.set(0, -4, 2);
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
      seated.discGroup.position.set(0.06, 0, -0.015);
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
