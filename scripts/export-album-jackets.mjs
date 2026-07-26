import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const SIZE = 2048;
const OUT_DIR = "/workspace/public/album-art";
const ARTIFACT_DIR = "/opt/cursor/artifacts/album-jackets";
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(ARTIFACT_DIR, { recursive: true });

// Prefer system fonts that approximate Figtree / Caveat
const SCRIPT = "DejaVu Sans, Liberation Sans, sans-serif";
const SANS = "DejaVu Sans, Liberation Sans, sans-serif";

function softBlob(ctx, x, y, r, color) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function paintGrain(ctx, w, h) {
  const image = ctx.getImageData(0, 0, w, h);
  const data = image.data;
  for (let i = 0; i < data.length; i += 16) {
    const n = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(image, 0, 0);
}

function paintWatercolorSky(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#6ec4ef");
  sky.addColorStop(0.22, "#9ed7f5");
  sky.addColorStop(0.5, "#d8f0fb");
  sky.addColorStop(0.78, "#eef8e6");
  sky.addColorStop(1, "#d4ecc8");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  softBlob(ctx, w * 0.18, h * 0.14, w * 0.4, "rgba(56, 168, 230, 0.55)");
  softBlob(ctx, w * 0.74, h * 0.08, w * 0.36, "rgba(70, 185, 240, 0.5)");
  softBlob(ctx, w * 0.48, h * 0.2, w * 0.4, "rgba(255, 255, 255, 0.45)");
  softBlob(ctx, w * 0.28, h * 0.32, w * 0.28, "rgba(90, 195, 245, 0.4)");
  softBlob(ctx, w * 0.8, h * 0.38, w * 0.26, "rgba(255, 220, 110, 0.35)");
  softBlob(ctx, w * 0.1, h * 0.55, w * 0.32, "rgba(110, 210, 150, 0.4)");
  softBlob(ctx, w * 0.88, h * 0.64, w * 0.3, "rgba(255, 196, 90, 0.28)");
  softBlob(ctx, w * 0.5, h * 0.82, w * 0.5, "rgba(130, 205, 120, 0.42)");
  softBlob(ctx, w * 0.62, h * 0.48, w * 0.22, "rgba(255,255,255,0.35)");
  softBlob(ctx, w * 0.35, h * 0.6, w * 0.2, "rgba(80, 190, 220, 0.28)");

  for (let i = 0; i < 48; i += 1) {
    const x = w * (0.08 + Math.random() * 0.84);
    const y = h * (0.05 + Math.random() * 0.72);
    const r = w * (0.03 + Math.random() * 0.08);
    const pick = Math.random();
    const tone =
      pick > 0.66
        ? `rgba(255,255,255,${0.1 + Math.random() * 0.14})`
        : pick > 0.33
          ? `rgba(40, 160, 230,${0.12 + Math.random() * 0.16})`
          : `rgba(90, 200, 130,${0.1 + Math.random() * 0.14})`;
    softBlob(ctx, x, y, r, tone);
  }

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.4, h * 0.94);
  ctx.quadraticCurveTo(w * 0.455, h * 0.6, w * 0.492, h * 0.4);
  ctx.quadraticCurveTo(w * 0.53, h * 0.6, w * 0.6, h * 0.94);
  ctx.closePath();
  const pathGrad = ctx.createLinearGradient(0, h * 0.38, 0, h);
  pathGrad.addColorStop(0, "rgba(255,255,255,0.18)");
  pathGrad.addColorStop(1, "rgba(220, 185, 110, 0.4)");
  ctx.fillStyle = pathGrad;
  ctx.fill();
  ctx.restore();

  softBlob(ctx, w * 0.5, h * 0.34, w * 0.26, "rgba(255, 255, 255, 0.9)");
  softBlob(ctx, w * 0.5, h * 0.32, w * 0.11, "rgba(255, 236, 140, 0.65)");

  ctx.fillStyle = "rgba(45, 85, 120, 0.5)";
  const drawFigure = (fx, fy, scale) => {
    ctx.beginPath();
    ctx.ellipse(fx, fy - scale * 7, scale * 2.1, scale * 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx, fy - scale * 4);
    ctx.quadraticCurveTo(fx - scale * 3, fy + scale * 4, fx - scale * 1.4, fy + scale * 10);
    ctx.quadraticCurveTo(fx, fy + scale * 6, fx + scale * 1.4, fy + scale * 10);
    ctx.quadraticCurveTo(fx + scale * 3, fy + scale * 4, fx, fy - scale * 4);
    ctx.fill();
  };
  drawFigure(w * 0.47, h * 0.72, w * 0.0048);
  drawFigure(w * 0.52, h * 0.715, w * 0.005);

  paintGrain(ctx, w, h);
}

function paintSlowBrightFront(ctx, w, h) {
  paintWatercolorSky(ctx, w, h);
  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = Math.max(3, w * 0.005);
  const inset = w * 0.145;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(55, 74, 96, 0.84)";
  ctx.font = `500 ${Math.round(w * 0.088)}px ${SCRIPT}`;
  ctx.fillText("Slow Bright", w / 2, h * 0.48);

  ctx.fillStyle = "rgba(95, 120, 140, 0.72)";
  ctx.font = `400 ${Math.round(w * 0.02)}px ${SANS}`;
  ctx.fillText("songs for open windows  ·  2026", w / 2, h * 0.56);

  ctx.fillStyle = "rgba(115, 145, 160, 0.55)";
  ctx.font = `500 ${Math.round(w * 0.016)}px ${SANS}`;
  ctx.fillText("OWN", w / 2, h * 0.615);
}

function paintFormCutFront(ctx, w, h) {
  ctx.fillStyle = "#101114";
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = "#efeae2";
  ctx.beginPath();
  ctx.moveTo(w * 0.08, h * 0.12);
  ctx.lineTo(w * 0.72, h * 0.08);
  ctx.lineTo(w * 0.78, h * 0.62);
  ctx.lineTo(w * 0.14, h * 0.7);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#ff5a3c";
  ctx.beginPath();
  ctx.arc(w * 0.68, h * 0.34, w * 0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#5ec4e0";
  ctx.lineWidth = w * 0.018;
  ctx.beginPath();
  ctx.arc(w * 0.38, h * 0.48, w * 0.22, -0.4, Math.PI * 1.2);
  ctx.stroke();

  ctx.fillStyle = "#101114";
  ctx.save();
  ctx.translate(w * 0.52, h * 0.42);
  ctx.rotate(-0.55);
  ctx.fillRect(-w * 0.02, -h * 0.35, w * 0.035, h * 0.7);
  ctx.restore();

  ctx.strokeStyle = "rgba(16,17,20,0.18)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const x = w * (0.18 + i * 0.08);
    ctx.beginPath();
    ctx.moveTo(x, h * 0.16);
    ctx.lineTo(x, h * 0.58);
    ctx.stroke();
  }

  ctx.fillStyle = "#5ec4e0";
  ctx.fillRect(w * 0.18, h * 0.78, w * 0.045, w * 0.045);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#efeae2";
  ctx.font = `700 ${Math.round(w * 0.11)}px ${SANS}`;
  ctx.fillText("FORM", w * 0.18, h * 0.84);
  ctx.fillText("CUT", w * 0.18, h * 0.94);

  ctx.fillStyle = "rgba(239,234,226,0.55)";
  ctx.font = `500 ${Math.round(w * 0.02)}px ${SANS}`;
  ctx.fillText("OWN  ·  HARD EDGE SERIES", w * 0.3, h * 0.805);
}

function exportPng(name, paint) {
  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  // Seed-ish: re-run watercolor with fixed Math.random for Slow Bright consistency
  paint(ctx, SIZE, SIZE);
  const buf = canvas.toBuffer("image/png");
  const a = join(OUT_DIR, name);
  const b = join(ARTIFACT_DIR, name);
  writeFileSync(a, buf);
  writeFileSync(b, buf);
  console.log(`Wrote ${a} (${buf.length} bytes)`);
}

// Fix grain randomness for Slow Bright so output is reproducible
Math.random = (() => {
  let s = 20260726;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
})();

exportPng("slow-bright-front.png", paintSlowBrightFront);
exportPng("form-cut-front.png", paintFormCutFront);
console.log("Done");
