"use client";

import { CSSProperties, Key, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import "./LogoLoop.css";

export type LogoItem = {
  src?: string;
  alt?: string;
  title?: string;
  href?: string;
  node?: ReactNode;
  [key: string]: unknown;
};

type LogoLoopProps = {
  logos: LogoItem[];
  speed?: number;
  direction?: "left" | "right";
  logoHeight?: number;
  gap?: number;
  hoverSpeed?: number;
  fadeOut?: boolean;
  fadeOutColor?: string;
  scaleOnHover?: boolean;
  renderItem?: (item: LogoItem, key: Key) => ReactNode;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
};

export default function LogoLoop({
  logos,
  speed = 120,
  direction = "left",
  logoHeight = 48,
  gap = 32,
  hoverSpeed = 0,
  fadeOut = false,
  fadeOutColor,
  scaleOnHover = false,
  renderItem,
  ariaLabel = "Logos de empresas",
  className = "",
  style,
}: LogoLoopProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sequenceRef = useRef<HTMLUListElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const [sequenceWidth, setSequenceWidth] = useState(0);
  const [copyCount, setCopyCount] = useState(2);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const update = () => {
      const containerWidth = containerRef.current?.clientWidth ?? 0;
      const width = Math.ceil(sequenceRef.current?.getBoundingClientRect().width ?? 0);
      if (!width) return;
      setSequenceWidth(width);
      setCopyCount(Math.max(2, Math.ceil(containerWidth / width) + 2));
    };

    const observer = new ResizeObserver(update);
    if (containerRef.current) observer.observe(containerRef.current);
    if (sequenceRef.current) observer.observe(sequenceRef.current);
    const images = sequenceRef.current?.querySelectorAll("img") ?? [];
    images.forEach((image) => image.addEventListener("load", update, { once: true }));
    update();
    return () => observer.disconnect();
  }, [logos, gap, logoHeight]);

  useEffect(() => {
    if (!sequenceWidth || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let animationId = 0;
    const directionMultiplier = direction === "left" ? 1 : -1;
    const animate = (timestamp: number) => {
      if (lastTimestampRef.current === null) lastTimestampRef.current = timestamp;
      const delta = Math.min(0.05, (timestamp - lastTimestampRef.current) / 1000);
      lastTimestampRef.current = timestamp;
      const target = (hovered ? hoverSpeed : speed) * directionMultiplier;
      const easing = 1 - Math.exp(-delta / 0.25);
      velocityRef.current += (target - velocityRef.current) * easing;
      offsetRef.current = ((offsetRef.current + velocityRef.current * delta) % sequenceWidth + sequenceWidth) % sequenceWidth;
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${-offsetRef.current}px,0,0)`;
      animationId = window.requestAnimationFrame(animate);
    };
    animationId = window.requestAnimationFrame(animate);
    return () => {
      window.cancelAnimationFrame(animationId);
      lastTimestampRef.current = null;
    };
  }, [direction, hovered, hoverSpeed, sequenceWidth, speed]);

  const rootStyle = useMemo(() => ({
    "--logoloop-gap": `${gap}px`,
    "--logoloop-logoHeight": `${logoHeight}px`,
    ...(fadeOutColor ? { "--logoloop-fadeColor": fadeOutColor } : {}),
    ...style,
  } as CSSProperties), [fadeOutColor, gap, logoHeight, style]);

  const classes = ["logoloop", fadeOut && "logoloop--fade", scaleOnHover && "logoloop--scale-hover", className].filter(Boolean).join(" ");
  const lists = Array.from({ length: copyCount }, (_, copyIndex) => (
    <ul className="logoloop__list" role="list" aria-hidden={copyIndex > 0} ref={copyIndex === 0 ? sequenceRef : undefined} key={copyIndex}>
      {logos.map((item, itemIndex) => {
        const key = `${copyIndex}-${itemIndex}`;
        const content = renderItem ? renderItem(item, key) : item.node ?? <img src={item.src} alt={item.alt ?? ""} draggable={false} />;
        return <li className="logoloop__item" role="listitem" key={key}>{item.href ? <a href={item.href} target="_blank" rel="noreferrer noopener">{content}</a> : content}</li>;
      })}
    </ul>
  ));

  return <div className={classes} style={rootStyle} ref={containerRef} role="region" aria-label={ariaLabel}>
    <div className="logoloop__track" ref={trackRef} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>{lists}</div>
  </div>;
}
