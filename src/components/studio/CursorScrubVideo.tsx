"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vídeo cuyo fotograma se controla por la posición del cursor (scrub), no
 * por reproducción normal. Requiere un vídeo codificado con TODOS los
 * fotogramas como keyframe para que el seek sea fino y sin saltos:
 *
 *   ffmpeg -i in.mp4 -c:v libx264 -preset slow -crf 18 -g 1 -keyint_min 1 \
 *     -x264-params "scenecut=0" -profile:v high -pix_fmt yuv420p \
 *     -movflags +faststart -an out.mp4
 */
interface CursorScrubVideoProps {
  videoFile: string;
  axis?: "horizontal" | "vertical";
  reverse?: boolean;
  trackingArea?: "component" | "window";
  smoothing?: number;
  objectFit?: "cover" | "contain" | "fill";
  borderRadius?: number;
  className?: string;
}

export default function CursorScrubVideo({
  videoFile,
  axis = "horizontal",
  reverse = false,
  trackingArea = "component",
  smoothing = 0.22,
  objectFit = "cover",
  borderRadius = 0,
  className,
}: CursorScrubVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readyRef = useRef(false);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    const videoEl = videoRef.current;
    if (!root || !videoEl) return;
    const video: HTMLVideoElement = videoEl;

    let targetTime = 0;
    let currentTimeRef = 0;
    let seeking = false;
    let raf = 0;
    let cancelled = false;

    function onLoadedMetadata() {
      // OJO: currentTime ya está en 0 por defecto — asignarle 0 de nuevo NO
      // dispara seeking/seeked y el navegador nunca decodifica un frame
      // (pantalla negra). Forzamos un seek real a un valor no-cero.
      video.currentTime = 0.001;
    }
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.load();

    function onSeeking() {
      seeking = true;
    }
    function onSeeked() {
      seeking = false;
    }
    function onCanPlayThrough() {
      if (!cancelled) {
        readyRef.current = true;
        forceRender((n) => n + 1);
      }
    }
    video.addEventListener("seeking", onSeeking);
    video.addEventListener("seeked", onSeeked);
    video.addEventListener("canplaythrough", onCanPlayThrough);

    function normalize(clientX: number, clientY: number) {
      let nx: number, ny: number;
      if (trackingArea === "window") {
        nx = clientX / window.innerWidth;
        ny = clientY / window.innerHeight;
      } else {
        const rect = root!.getBoundingClientRect();
        nx = (clientX - rect.left) / rect.width;
        ny = (clientY - rect.top) / rect.height;
      }
      return { nx: Math.min(1, Math.max(0, nx)), ny: Math.min(1, Math.max(0, ny)) };
    }

    function onPointerMove(clientX: number, clientY: number) {
      if (!video.duration || !isFinite(video.duration)) return;
      const { nx, ny } = normalize(clientX, clientY);
      let pos = axis === "horizontal" ? nx : ny;
      if (reverse) pos = 1 - pos;
      targetTime = pos * video.duration;
    }

    const onPointer = (e: Event) => {
      const pe = e as PointerEvent;
      onPointerMove(pe.clientX, pe.clientY);
    };
    const onTouch = (e: Event) => {
      const te = e as TouchEvent;
      const t = te.touches[0];
      if (t) onPointerMove(t.clientX, t.clientY);
    };

    const target: EventTarget = trackingArea === "window" ? window : root;
    target.addEventListener("pointermove", onPointer);
    target.addEventListener("touchmove", onTouch, { passive: true } as AddEventListenerOptions);

    function tick() {
      if (
        readyRef.current &&
        !seeking &&
        video.duration &&
        isFinite(video.duration) &&
        Math.abs(currentTimeRef - targetTime) > 0.008
      ) {
        currentTimeRef += (targetTime - currentTimeRef) * smoothing;
        video.currentTime = currentTimeRef;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("seeking", onSeeking);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("canplaythrough", onCanPlayThrough);
      target.removeEventListener("pointermove", onPointer);
      target.removeEventListener("touchmove", onTouch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoFile, axis, reverse, trackingArea, smoothing]);

  return (
    <div ref={rootRef} className={className} style={{ width: "100%", height: "100%" }}>
      <video
        ref={videoRef}
        src={videoFile}
        muted
        playsInline
        preload="auto"
        disableRemotePlayback
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit,
          borderRadius,
          display: "block",
        }}
      />
    </div>
  );
}
