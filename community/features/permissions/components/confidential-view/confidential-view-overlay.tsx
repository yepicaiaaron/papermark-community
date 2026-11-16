import { useEffect, useRef, useState } from "react";

const RADIUS = 140;

/**
 * Blurs everything behind it except a circle around the pointer (or the
 * last touch). Sits over the document area of a viewer.
 */
export function ConfidentialViewOverlay({
  navbarAbove = false,
  rotation = 0,
}: {
  navbarAbove?: boolean;
  rotation?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const move = (x: number, y: number) => {
      const box = ref.current?.getBoundingClientRect();
      if (!box) return;
      setPoint({ x: x - box.left, y: y - box.top });
    };
    const onMouse = (e: MouseEvent) => move(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t) move(t.clientX, t.clientY);
    };
    const onLeave = () => setPoint(null);
    window.addEventListener("mousemove", onMouse);
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    window.addEventListener("blur", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchstart", onTouch);
      document.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("blur", onLeave);
    };
  }, []);

  const mask = point
    ? `radial-gradient(circle ${RADIUS}px at ${point.x}px ${point.y}px, transparent 0, transparent ${RADIUS - 30}px, black ${RADIUS}px)`
    : undefined;

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-rotation={rotation}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      style={{
        top: navbarAbove ? "4rem" : 0,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        maskImage: mask,
        WebkitMaskImage: mask,
      }}
    />
  );
}
