const TEXTURE_SIZE = 2048;

function cssFont(cssVar: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(cssVar)
    .trim();
  return value ? `${value}, ${fallback}` : fallback;
}

function fontScript() {
  return cssFont("--font-script", "Caveat, cursive");
}

function fontFigtree() {
  return cssFont("--font-figtree", "Figtree, sans-serif");
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

function paintGrain(ctx: CanvasRenderingContext2D, w: number, h: number) {
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

export function paintWatercolorSky(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
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
  const drawFigure = (fx: number, fy: number, scale: number) => {
    ctx.beginPath();
    ctx.ellipse(fx, fy - scale * 7, scale * 2.1, scale * 2.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(fx, fy - scale * 4);
    ctx.quadraticCurveTo(
      fx - scale * 3,
      fy + scale * 4,
      fx - scale * 1.4,
      fy + scale * 10,
    );
    ctx.quadraticCurveTo(fx, fy + scale * 6, fx + scale * 1.4, fy + scale * 10);
    ctx.quadraticCurveTo(fx + scale * 3, fy + scale * 4, fx, fy - scale * 4);
    ctx.fill();
  };
  drawFigure(w * 0.47, h * 0.72, w * 0.0048);
  drawFigure(w * 0.52, h * 0.715, w * 0.005);

  paintGrain(ctx, w, h);
}

/** Slow Bright front jacket art */
export function paintAlbumArt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
) {
  paintWatercolorSky(ctx, w, h);

  ctx.strokeStyle = "rgba(255,255,255,0.82)";
  ctx.lineWidth = Math.max(3, w * 0.005);
  const inset = w * 0.145;
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(55, 74, 96, 0.84)";
  ctx.font = `500 ${Math.round(w * 0.088)}px ${fontScript()}`;
  ctx.fillText("Slow Bright", w / 2, h * 0.48);

  ctx.fillStyle = "rgba(95, 120, 140, 0.72)";
  ctx.font = `400 ${Math.round(w * 0.02)}px ${fontFigtree()}`;
  ctx.fillText("songs for open windows  ·  2026", w / 2, h * 0.56);

  ctx.fillStyle = "rgba(115, 145, 160, 0.55)";
  ctx.font = `500 ${Math.round(w * 0.016)}px ${fontFigtree()}`;
  ctx.fillText("OWN", w / 2, h * 0.615);
}

export { TEXTURE_SIZE, fontScript, fontFigtree };
