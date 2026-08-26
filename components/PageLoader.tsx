"use client";

import { useEffect, useState } from "react";

type LoaderPhase = "loading" | "leaving";

export default function PageLoader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<LoaderPhase>("loading");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const root = document.documentElement;
    const timers: number[] = [];
    const startedAt = window.performance.now();
    const minimumVisibleTime = 2000;
    let resourcesReady = document.readyState === "complete";
    let displayedProgress = 0;
    let finished = false;

    root.classList.add("page-is-loading");

    const unlockPage = () => root.classList.remove("page-is-loading");
    const complete = () => {
      if (finished) return;
      finished = true;
      displayedProgress = 100;
      setProgress(100);
      timers.push(window.setTimeout(() => setPhase("leaving"), 220));
      timers.push(window.setTimeout(() => {
        setVisible(false);
        unlockPage();
      }, 920));
    };
    const markResourcesReady = () => {
      resourcesReady = true;
    };

    window.addEventListener("load", markResourcesReady, { once: true });

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timers.push(window.setTimeout(complete, minimumVisibleTime));
    } else {
      const interval = window.setInterval(() => {
        const elapsed = window.performance.now() - startedAt;
        const minimumTimeReached = elapsed >= minimumVisibleTime;

        if (resourcesReady && minimumTimeReached) {
          const remaining = 100 - displayedProgress;
          displayedProgress += Math.max(1, Math.ceil(remaining * 0.16));
        } else {
          displayedProgress = Math.max(
            displayedProgress,
            Math.min(92, Math.round((elapsed / minimumVisibleTime) * 92)),
          );
        }

        displayedProgress = Math.min(100, displayedProgress);
        setProgress(displayedProgress);
        if (displayedProgress === 100) {
          window.clearInterval(interval);
          complete();
        }
      }, 34);

      timers.push(interval);
      timers.push(window.setTimeout(markResourcesReady, 5000));
    }

    return () => {
      window.removeEventListener("load", markResourcesReady);
      timers.forEach(window.clearTimeout);
      unlockPage();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`page-loader page-loader--${phase}`} aria-label="Cargando portfolio">
      <div className="page-loader__inner">
        <header className="page-loader__header">
          <b><i aria-hidden="true" /> Tomás Vizzo</b>
          <span>PORTFOLIO · 2026</span>
        </header>

        <div className="page-loader__counter" aria-hidden="true">
          <span>{progress}</span><sup>%</sup>
        </div>

        <div className="page-loader__footer">
          <div className="page-loader__meta">
            <span>Preparando experiencia</span>
            <span>{String(progress).padStart(3, "0")} / 100</span>
          </div>
          <div
            className="page-loader__track"
            role="progressbar"
            aria-label="Progreso de carga"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
          >
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
