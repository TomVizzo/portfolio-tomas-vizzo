"use client";

import { useEffect, useRef } from "react";

type NoiseProps = { patternSize?: number; patternScaleX?: number; patternScaleY?: number; patternRefreshInterval?: number; patternAlpha?: number };

export default function Noise({ patternSize = 250, patternScaleX = 1, patternScaleY = 1, patternRefreshInterval = 2, patternAlpha = 15 }: NoiseProps) {
  const grainRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    const size = Math.max(64, Math.min(512, patternSize));
    canvas.width = size;
    canvas.height = size;
    canvas.style.transform = `scale(${patternScaleX}, ${patternScaleY})`;
    let frame = 0;
    let animationId = 0;
    const drawGrain = () => {
      const image = context.createImageData(size, size);
      for (let index = 0; index < image.data.length; index += 4) {
        const value = Math.random() * 255;
        image.data[index] = value;
        image.data[index + 1] = value;
        image.data[index + 2] = value;
        image.data[index + 3] = patternAlpha;
      }
      context.putImageData(image, 0, 0);
    };
    const loop = () => {
      if (frame % Math.max(1, patternRefreshInterval) === 0) drawGrain();
      frame += 1;
      animationId = window.requestAnimationFrame(loop);
    };
    drawGrain();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) animationId = window.requestAnimationFrame(loop);
    return () => window.cancelAnimationFrame(animationId);
  }, [patternAlpha, patternRefreshInterval, patternScaleX, patternScaleY, patternSize]);

  return <canvas className="noise-overlay" ref={grainRef} aria-hidden="true" />;
}
