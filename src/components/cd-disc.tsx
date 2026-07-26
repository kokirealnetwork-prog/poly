"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { AlbumId } from "@/lib/album-art";
import {
  TEXTURE_SIZE,
  paintAlbumBack,
  paintAlbumFront,
  paintAlbumLabel,
  paintAlbumSpine,
} from "@/lib/album-art";

const OUTER_RADIUS = 1;
const INNER_RADIUS = 0.15;
const HUB_RADIUS = 0.36;
const DISC_THICKNESS = 0.028;

const CASE_W = 1.7;
const CASE_H = 1.7;
const CASE_D = 0.14;

type ViewMode = "jacket" | "disc";

type CdDiscProps = {
  albumId?: AlbumId;
  onViewChange?: (view: ViewMode) => void;
  initialView?: ViewMode;
  /** Keep the jewel-case jacket only — drag to rotate, no view switch. */
  jacketOnly?: boolean;
};

function createCanvasTexture(
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  size = TEXTURE_SIZE,
) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    draw(ctx, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return texture;
}

function createJacketTexture(albumId: AlbumId) {
  return createCanvasTexture((ctx, size) => {
    paintAlbumFront(ctx, size, size, albumId);
  });
}

function createBackCoverTexture(albumId: AlbumId) {
  return createCanvasTexture((ctx, size) => {
    paintAlbumBack(ctx, size, size, albumId);
  });
}

function createSpineTexture(albumId: AlbumId) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    paintAlbumSpine(ctx, 512, TEXTURE_SIZE, albumId);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  return texture;
}

function createLabelTexture(albumId: AlbumId) {
  return createCanvasTexture((ctx, size) => {
    paintAlbumLabel(ctx, size, size, albumId);
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
    base.addColorStop(0, "#c5e8f8");
    base.addColorStop(0.45, "#6eb4d4");
    base.addColorStop(1, "#3d7a98");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    for (let r = 90; r < size * 0.48; r += 2) {
      const t = (r - 90) / (size * 0.48 - 90);
      const hue = 190 + t * 25;
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 28%, ${55 + (r % 5)}%, ${0.05 + (r % 4) * 0.01})`;
      ctx.lineWidth = 1.2;
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

export function CdDisc({
  albumId = "slow-bright",
  onViewChange,
  initialView = "jacket",
  jacketOnly = false,
}: CdDiscProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onViewChangeRef = useRef(onViewChange);
  const initialViewRef = useRef(initialView);
  const jacketOnlyRef = useRef(jacketOnly);
  const albumIdRef = useRef(albumId);

  useEffect(() => {
    onViewChangeRef.current = onViewChange;
  }, [onViewChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let cleanupScene: (() => void) | undefined;
    albumIdRef.current = albumId;

    const start = async () => {
      try {
        await Promise.race([
          document.fonts.ready,
          new Promise<void>((resolve) => setTimeout(resolve, 800)),
        ]);
      } catch {
        // Fonts are optional for first paint; proceed with fallbacks.
      }
      if (disposed || !containerRef.current) return;

      try {
        cleanupScene = mountScene(
          containerRef.current,
          onViewChangeRef,
          initialViewRef.current,
          jacketOnlyRef.current,
          albumIdRef.current,
        );
      } catch (error) {
        console.error("[CdDisc] failed to mount scene", error);
        return;
      }
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
  }, [albumId]);

  return (
    <div
      ref={containerRef}
      className="cd-disc"
      role="img"
      aria-label="Drag to rotate. Tap to switch between jacket and disc."
    />
  );
}

function mountScene(
  container: HTMLDivElement,
  onViewChangeRef: { current?: (view: ViewMode) => void },
  initialView: ViewMode = "jacket",
  jacketOnly = false,
  albumId: AlbumId = "slow-bright",
) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf2f2f4);

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 0.15, 5.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: "default",
      failIfMajorPerformanceCaveat: false,
    });
    renderer.setClearColor(0xf2f2f4, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    // Keep pure white — filmic tone mapping can muddy the clear color.
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);

    const jacketTexture = createJacketTexture(albumId);
    const backTexture = createBackCoverTexture(albumId);
    const spineTexture = createSpineTexture(albumId);
    const labelTexture = createLabelTexture(albumId);
    const dataTexture = createDataSideTexture();

    const root = new THREE.Group();
    root.rotation.set(-0.18, 0.55, 0.08);
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
    if (initialView === "disc") {
      caseRoot.visible = false;
      held.discGroup.visible = true;
      held.discGroup.scale.setScalar(1);
    } else {
      held.discGroup.visible = false;
      held.discGroup.scale.setScalar(0.01);
    }
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

    let view: ViewMode = initialView;
    let transition = initialView === "disc" ? 1 : 0;
    let transitionFrom = 0;
    let transitionTo = 0;
    let transitioning = false;
    let transitionStart = 0;
    const TRANSITION_MS = 480;

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
      if (transitioning || next === view || jacketOnly) return;
      transitioning = true;
      transitionStart = performance.now();
      transitionFrom = transition;
      transitionTo = next === "disc" ? 1 : 0;
      view = next;
      onViewChangeRef.current?.(next);
      ensureAudio();
      playPlasticTick();
      navigator.vibrate?.(12);

      lid.rotation.y = 0;
      if (next === "disc") {
        caseRoot.visible = true;
        caseRoot.scale.setScalar(1);
        held.discGroup.visible = false;
        held.discGroup.scale.setScalar(0.92);
        held.discGroup.position.set(0, 0, 0);
        held.discGroup.rotation.x = 0;
        resetSeatedDisc();
      } else {
        held.discGroup.visible = true;
        held.discGroup.scale.setScalar(1);
        caseRoot.visible = false;
        caseRoot.scale.setScalar(0.92);
        resetSeatedDisc();
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

      if (isTap && !transitioning && !jacketOnly) {
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
        // Slight grow → settle pulse while swapping jacket ↔ disc
        const pulse = 1 + Math.sin(t * Math.PI) * 0.07;

        lid.rotation.y = 0;
        caseRoot.position.set(0, 0, 0);
        held.discGroup.position.set(0, 0, 0);
        held.discGroup.rotation.x = 0;

        if (opening) {
          if (t < 0.5) {
            caseRoot.visible = true;
            caseRoot.scale.setScalar(pulse);
            held.discGroup.visible = false;
            resetSeatedDisc();
          } else {
            caseRoot.visible = false;
            caseRoot.scale.setScalar(1);
            held.discGroup.visible = true;
            held.discGroup.scale.setScalar(
              0.92 + (t - 0.5) * 0.16 + Math.sin((t - 0.5) * 2 * Math.PI) * 0.03,
            );
          }
        } else if (t > 0.5) {
          // Still mostly on the way back — show jacket settling in
          const local = (1 - t) / 0.5;
          held.discGroup.visible = false;
          caseRoot.visible = true;
          caseRoot.scale.setScalar(0.93 + Math.sin((1 - local) * Math.PI) * 0.07);
          resetSeatedDisc();
        } else {
          held.discGroup.visible = true;
          held.discGroup.scale.setScalar(pulse);
          caseRoot.visible = false;
        }

        if (raw >= 1) {
          transitioning = false;
          transition = transitionTo;
          if (transitionTo === 1) {
            caseRoot.visible = false;
            caseRoot.scale.setScalar(1);
            held.discGroup.visible = true;
            held.discGroup.scale.setScalar(1);
            held.discGroup.position.set(0, 0, 0);
            held.discGroup.rotation.x = 0;
          } else {
            held.discGroup.visible = false;
            held.discGroup.scale.setScalar(0.92);
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
