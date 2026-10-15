'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 700
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // If browser doesn't support IntersectionObserver or user prefers reduced motion, reveal instantly
    if (
      typeof window === 'undefined' ||
      !('IntersectionObserver' in window) ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const getDirectionClasses = () => {
    switch (direction) {
      case 'up':
        return isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0';
      case 'down':
        return isVisible ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0';
      case 'left':
        return isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0';
      case 'right':
        return isVisible ? 'translate-x-0 opacity-100' : '-translate-x-8 opacity-0';
      case 'none':
      default:
        return isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0';
    }
  };

  return (
    <div
      ref={ref}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className={`transition-all ${getDirectionClasses()} ${className.includes('h-full') && !className.includes('flex') ? 'flex flex-col' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
