"use client";

import { useEffect, useRef } from "react";

const SIZE = 1024;

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

function paintCover(ctx: CanvasRenderingContext2D, w: number, h: number) {
  // Muted, frosted palette — low saturation like the reference
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, "#2a3340");
  sky.addColorStop(0.35, "#5c4a48");
  sky.addColorStop(0.65, "#c4b5a5");
  sky.addColorStop(1, "#e6ddd2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  softBlob(ctx, w * 0.3, h * 0.25, w * 0.45, "rgba(55, 70, 95, 0.55)");
  softBlob(ctx, w * 0.75, h * 0.2, w * 0.4, "rgba(140, 75, 70, 0.35)");
  softBlob(ctx, w * 0.55, h * 0.55, w * 0.5, "rgba(210, 195, 175, 0.45)");
  softBlob(ctx, w * 0.2, h * 0.7, w * 0.35, "rgba(90, 100, 115, 0.35)");
  softBlob(ctx, w * 0.8, h * 0.75, w * 0.3, "rgba(230, 220, 205, 0.4)");

  for (let i = 0; i < 60; i += 1) {
    softBlob(
      ctx,
      w * Math.random(),
      h * Math.random(),
      w * (0.02 + Math.random() * 0.06),
      Math.random() > 0.5
        ? `rgba(255,255,255,${0.04 + Math.random() * 0.08})`
        : `rgba(40,50,65,${0.05 + Math.random() * 0.1})`,
    );
  }

  // Heavy frosted / pebbled overlay
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] * 0.92 + n + 18));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 0.92 + n + 16));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 0.92 + n + 14));
  }
  ctx.putImageData(image, 0, 0);

  // Soft white sheen on top-left edge (sleeve lip)
  const sheen = ctx.createLinearGradient(0, 0, w * 0.45, h * 0.45);
  sheen.addColorStop(0, "rgba(255,255,255,0.55)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0.12)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, w, h);
}

type FrostedCoverProps = {
  onActivate?: () => void;
};

export function FrostedCover({ onActivate }: FrostedCoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    paintCover(ctx, SIZE, SIZE);
  }, []);

  return (
    <button
      type="button"
      className="diamond-wrap"
      onClick={onActivate}
      aria-label="Open album"
    >
      <span className="diamond-shadow" aria-hidden />
      <span className="diamond">
        <canvas ref={canvasRef} className="diamond-art" />
        <span className="diamond-frost" aria-hidden />
        <span className="diamond-edge" aria-hidden />
      </span>
    </button>
  );
}
