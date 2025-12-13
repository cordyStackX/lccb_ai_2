"use client";
import { useState, useRef, useEffect } from "react";

export default function useInView<T extends HTMLElement>(Observe = false, threshold_val = 0.4) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (Observe) {
            observer.unobserve(entry.target);
          }
        }
        else {
          setIsInView(false);
        }
      },
      { threshold: threshold_val }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  });

  return { ref, isInView };
}