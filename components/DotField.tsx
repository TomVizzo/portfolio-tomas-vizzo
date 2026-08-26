"use client";

import { memo, useEffect, useId, useRef } from "react";

type Dot = { ax: number; ay: number; sx: number; sy: number };
type DotFieldProps = {
  dotRadius?: number;
  dotSpacing?: number;
  cursorRadius?: number;
  bulgeStrength?: number;
  glowRadius?: number;
  gradientFrom?: string;
  gradientTo?: string;
  glowColor?: string;
};

const DotField = memo(function DotField({
  dotRadius = 1.5,
  dotSpacing = 14,
  cursorRadius = 500,
  bulgeStrength = 67,
  glowRadius = 160,
  gradientFrom = "rgba(249, 115, 22, .42)",
  gradientTo = "rgba(255, 91, 45, .2)",
  glowColor = "rgba(249, 115, 22, .18)",
}: DotFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, active: false });
  const frameRef = useRef<number | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const engagementRef = useRef(0);
  const glowId = useId().replaceAll(":", "");

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !context) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let resizeTimer: number;

    const buildDots = (width: number, height: number) => {
      const step = dotRadius + dotSpacing;
      const columns = Math.floor(width / step);
      const rows = Math.floor(height / step);
      const padX = (width % step) / 2;
      const padY = (height % step) / 2;
      dotsRef.current = Array.from({ length: rows * columns }, (_, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);
        const ax = padX + column * step + step / 2;
        const ay = padY + row * step + step / 2;
        return { ax, ay, sx: ax, sy: ay };
      });
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { width, height };
      buildDots(width, height);
    };

    const scheduleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 100);
    };

    const movePointer = (event: PointerEvent) => {
      pointerRef.current.x = event.clientX;
      pointerRef.current.y = event.clientY;
      pointerRef.current.active = true;
    };

    const leavePointer = () => { pointerRef.current.active = false; };

    const draw = () => {
      const pointer = pointerRef.current;
      const targetEngagement = pointer.active ? 1 : 0;
      engagementRef.current += (targetEngagement - engagementRef.current) * .12;
      const engagement = engagementRef.current;
      const { width, height } = sizeRef.current;
      context.clearRect(0, 0, width, height);
      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, gradientFrom);
      gradient.addColorStop(1, gradientTo);
      context.fillStyle = gradient;
      context.beginPath();

      for (const dot of dotsRef.current) {
        const dx = pointer.x - dot.ax;
        const dy = pointer.y - dot.ay;
        const distance = Math.hypot(dx, dy);
        if (distance < cursorRadius && engagement > .01) {
          const force = Math.pow(1 - distance / cursorRadius, 2) * bulgeStrength * engagement;
          const angle = Math.atan2(dy, dx);
          dot.sx += (dot.ax - Math.cos(angle) * force - dot.sx) * .15;
          dot.sy += (dot.ay - Math.sin(angle) * force - dot.sy) * .15;
        } else {
          dot.sx += (dot.ax - dot.sx) * .1;
          dot.sy += (dot.ay - dot.sy) * .1;
        }
        context.moveTo(dot.sx + dotRadius / 2, dot.sy);
        context.arc(dot.sx, dot.sy, dotRadius / 2, 0, Math.PI * 2);
      }
      context.fill();

      if (glowRef.current) {
        glowRef.current.setAttribute("cx", `${pointer.x}`);
        glowRef.current.setAttribute("cy", `${pointer.y}`);
        glowRef.current.style.opacity = `${engagement * .9}`;
      }
      frameRef.current = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", scheduleResize);
    window.addEventListener("pointermove", movePointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", leavePointer);
    window.addEventListener("blur", leavePointer);
    frameRef.current = window.requestAnimationFrame(draw);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleResize);
      window.removeEventListener("pointermove", movePointer);
      document.documentElement.removeEventListener("pointerleave", leavePointer);
      window.removeEventListener("blur", leavePointer);
    };
  }, [bulgeStrength, cursorRadius, dotRadius, dotSpacing, gradientFrom, gradientTo]);

  return <div className="dot-field-background" aria-hidden="true">
    <canvas ref={canvasRef} />
    <svg>
      <defs><radialGradient id={glowId}><stop offset="0%" stopColor={glowColor}/><stop offset="100%" stopColor="transparent"/></radialGradient></defs>
      <circle ref={glowRef} cx="-9999" cy="-9999" r={glowRadius} fill={`url(#${glowId})`} />
    </svg>
  </div>;
});

export default DotField;
