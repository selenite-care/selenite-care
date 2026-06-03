"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

type ViewportAnimatedSectionProps = {
  children: ReactNode;
  className?: string;
};

export default function ViewportAnimatedSection({
  children,
  className = "",
}: ViewportAnimatedSectionProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;

    if (!section || hasEntered) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEntered(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0,
      },
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, [hasEntered]);

  return (
    <div ref={sectionRef} className={`${className}${hasEntered ? " is-visible" : ""}`}>
      {children}
    </div>
  );
}
