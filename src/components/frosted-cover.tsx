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
  // Higher chroma wash under the frost
  const sky = ctx.createLinearGradient(0, 0, w, h);
  sky.addColorStop(0, "#1f6fb8");
  sky.addColorStop(0.28, "#d4554a");
  sky.addColorStop(0.58, "#f0c56a");
  sky.addColorStop(1, "#f3e7d4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  softBlob(ctx, w * 0.28, h * 0.22, w * 0.48, "rgba(30, 120, 210, 0.55)");
  softBlob(ctx, w * 0.78, h * 0.18, w * 0.42, "rgba(230, 70, 65, 0.45)");
  softBlob(ctx, w * 0.55, h * 0.52, w * 0.5, "rgba(255, 200, 90, 0.4)");
  softBlob(ctx, w * 0.18, h * 0.7, w * 0.36, "rgba(50, 150, 200, 0.35)");
  softBlob(ctx, w * 0.82, h * 0.78, w * 0.32, "rgba(255, 230, 180, 0.45)");
  softBlob(ctx, w * 0.45, h * 0.35, w * 0.28, "rgba(255, 120, 90, 0.28)");

  for (let i = 0; i < 60; i += 1) {
    const pick = Math.random();
    softBlob(
      ctx,
      w * Math.random(),
      h * Math.random(),
      w * (0.02 + Math.random() * 0.06),
      pick > 0.66
        ? `rgba(255,255,255,${0.06 + Math.random() * 0.1})`
        : pick > 0.33
          ? `rgba(40, 140, 230,${0.08 + Math.random() * 0.14})`
          : `rgba(230, 80, 70,${0.08 + Math.random() * 0.12})`,
    );
  }

  // Light frost grain — keep color, don't wash it out
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 16;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(image, 0, 0);

  const sheen = ctx.createLinearGradient(0, 0, w * 0.45, h * 0.45);
  sheen.addColorStop(0, "rgba(255,255,255,0.45)");
  sheen.addColorStop(0.4, "rgba(255,255,255,0.1)");
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
