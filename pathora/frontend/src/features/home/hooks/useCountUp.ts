"use client";
import { useState, useEffect, useRef } from "react";

interface UseCountUpOptions {
  end: number;
  duration?: number;
  startOnVisible?: boolean;
  suffix?: string;
}

export function useCountUp(
  { end, duration = 2000, startOnVisible = true, suffix = "" }: UseCountUpOptions,
  isVisible: boolean
): string {
  const [count, setCount] = useState(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!startOnVisible && !hasStarted.current) {
      hasStarted.current = true;
    } else if (startOnVisible && !isVisible) {
      return;
    }

    hasStarted.current = true;
    let startTime: number;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, startOnVisible, isVisible]);

  return `${count}${suffix}`;
}
