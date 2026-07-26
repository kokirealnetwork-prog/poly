"use client";

import { useEffect, useRef } from "react";
import { paintAlbumArt } from "@/lib/album-art";

const SIZE = 2048;

type JacketCoverProps = {
  className?: string;
};

export function JacketCover({ className }: JacketCoverProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;

    const draw = async () => {
      try {
        await document.fonts.ready;
      } catch {
        // Fallbacks are fine if fonts are slow.
      }
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      paintAlbumArt(ctx, SIZE, SIZE);
    };

    void draw();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={className ?? "diamond-wrap"} aria-label="Album jacket">
      <span className="diamond-shadow" aria-hidden />
      <span className="diamond">
        <canvas ref={canvasRef} className="diamond-art" />
        <span className="diamond-frost" aria-hidden />
        <span className="diamond-edge" aria-hidden />
      </span>
    </div>
  );
}
