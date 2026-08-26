"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import "./DotGrid.css";

gsap.registerPlugin(InertiaPlugin);

type Dot = { cx: number; cy: number; xOffset: number; yOffset: number; inertiaApplied: boolean };
type DotGridProps = {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: CSSProperties;
};

const throttle = (callback: (event: MouseEvent) => void, limit: number) => {
  let lastCall = 0;
  return (event: MouseEvent) => {
    const now = performance.now();
    if (now - lastCall < limit) return;
    lastCall = now;
    callback(event);
  };
};

function hexToRgb(hex: string) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return { r: 0, g: 0, b: 0 };
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

export default function DotGrid({
  dotSize = 4,
  gap = 18,
  baseColor = "#f97316",
  activeColor = "#3157ff",
  proximity = 180,
  speedTrigger = 100,
  shockRadius = 300,
  shockStrength = 4,
  maxSpeed = 5000,
  resistance = 800,
  returnDuration = 1.35,
  className = "",
  style,
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const pointerRef = useRef({ x: -9999, y: -9999, vx: 0, vy: 0, speed: 0, lastTime: 0, lastX: 0, lastY: 0 });
  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === "undefined" || !window.Path2D) return null;
    const path = new Path2D();
    path.arc(0, 0, dotSize / 2, 0, Math.PI * 2);
    return path;
  }, [dotSize]);

  const buildGrid = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;
    const { width, height } = wrapper.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.ceil(width * dpr);
    canvas.height = Math.ceil(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.getContext("2d")?.scale(dpr, dpr);

    const cell = dotSize + gap;
    const columns = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);
    const startX = (width - (cell * columns - gap)) / 2 + dotSize / 2;
    const startY = (height - (cell * rows - gap)) / 2 + dotSize / 2;
    dotsRef.current = Array.from({ length: rows * columns }, (_, index) => ({
      cx: startX + (index % columns) * cell,
      cy: startY + Math.floor(index / columns) * cell,
      xOffset: 0,
      yOffset: 0,
      inertiaApplied: false,
    }));
  }, [dotSize, gap]);

  useEffect(() => {
    buildGrid();
    const observer = new ResizeObserver(buildGrid);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [buildGrid]);

  useEffect(() => {
    if (!circlePath) return;
    let animationId = 0;
    const proximitySquared = proximity * proximity;
    const draw = () => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      if (!canvas || !context) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      context.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      const { x, y } = pointerRef.current;
      for (const dot of dotsRef.current) {
        const dx = dot.cx - x;
        const dy = dot.cy - y;
        const distanceSquared = dx * dx + dy * dy;
        let color = baseColor;
        if (distanceSquared <= proximitySquared) {
          const amount = 1 - Math.sqrt(distanceSquared) / proximity;
          color = `rgb(${Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * amount)},${Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * amount)},${Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * amount)})`;
        }
        context.save();
        context.translate(dot.cx + dot.xOffset, dot.cy + dot.yOffset);
        context.fillStyle = color;
        context.fill(circlePath);
        context.restore();
      }
      animationId = window.requestAnimationFrame(draw);
    };
    draw();
    return () => window.cancelAnimationFrame(animationId);
  }, [activeRgb, baseColor, baseRgb, circlePath, proximity]);

  useEffect(() => {
    const returnDot = (dot: Dot) => {
      gsap.to(dot, { xOffset: 0, yOffset: 0, duration: returnDuration, ease: "elastic.out(1,0.75)", onComplete: () => { dot.inertiaApplied = false; } });
    };
    const onMove = (event: MouseEvent) => {
      const now = performance.now();
      const pointer = pointerRef.current;
      const delta = pointer.lastTime ? now - pointer.lastTime : 16;
      let vx = ((event.clientX - pointer.lastX) / delta) * 1000;
      let vy = ((event.clientY - pointer.lastY) / delta) * 1000;
      let speed = Math.hypot(vx, vy);
      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }
      Object.assign(pointer, { lastTime: now, lastX: event.clientX, lastY: event.clientY, vx, vy, speed, x: event.clientX, y: event.clientY });
      for (const dot of dotsRef.current) {
        const distance = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
        if (speed <= speedTrigger || distance >= proximity || dot.inertiaApplied) continue;
        dot.inertiaApplied = true;
        gsap.killTweensOf(dot);
        gsap.to(dot, {
          inertia: { xOffset: dot.cx - pointer.x + vx * .005, yOffset: dot.cy - pointer.y + vy * .005, resistance },
          onComplete: () => returnDot(dot),
        });
      }
    };
    const onClick = (event: MouseEvent) => {
      for (const dot of dotsRef.current) {
        const distance = Math.hypot(dot.cx - event.clientX, dot.cy - event.clientY);
        if (distance >= shockRadius || dot.inertiaApplied) continue;
        dot.inertiaApplied = true;
        const falloff = Math.max(0, 1 - distance / shockRadius);
        gsap.killTweensOf(dot);
        gsap.to(dot, {
          inertia: { xOffset: (dot.cx - event.clientX) * shockStrength * falloff, yOffset: (dot.cy - event.clientY) * shockStrength * falloff, resistance },
          onComplete: () => returnDot(dot),
        });
      }
    };
    const throttledMove = throttle(onMove, 50);
    window.addEventListener("mousemove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("mousemove", throttledMove);
      window.removeEventListener("click", onClick);
      dotsRef.current.forEach((dot) => gsap.killTweensOf(dot));
    };
  }, [maxSpeed, proximity, resistance, returnDuration, shockRadius, shockStrength, speedTrigger]);

  return <section className={`dot-grid ${className}`} style={style} aria-hidden="true">
    <div className="dot-grid__wrap" ref={wrapperRef}><canvas className="dot-grid__canvas" ref={canvasRef} /></div>
  </section>;
}
