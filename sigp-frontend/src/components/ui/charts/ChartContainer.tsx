import { useLayoutEffect, useRef, useState, type ReactElement } from 'react';
import { ResponsiveContainer } from 'recharts';

interface ChartContainerProps {
  children: ReactElement;
  className?: string;
  minHeight?: number;
}

/**
 * Drop-in replacement for Recharts' <ResponsiveContainer width="X%" height="X%">.
 *
 * Root cause this works around: Recharts' own ResponsiveContainer initializes its
 * internal size state to { width: -1, height: -1 } and renders/warns with that value
 * on the very first render, before its effect measures the real DOM node — this is
 * hardcoded in recharts' source (defaultResponsiveContainerProps.initialDimension)
 * and fires whenever BOTH width and height are given as percentages.
 *
 * Fix: measure this wrapper ourselves via ResizeObserver *before* mounting any chart,
 * then feed Recharts fixed pixel numbers instead of percentages. A fixed positive
 * number never hits recharts' -1 code path, so the warning cannot occur — and nothing
 * is rendered at all until we have a real, positive size (satisfies "no chart mounted
 * while its container is effectively 0×0 or hidden").
 */
export function ChartContainer({ children, className, minHeight }: ChartContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return;
      setSize((prev) => (prev && prev.width === width && prev.height === height ? prev : { width, height }));
    };

    const rect = el.getBoundingClientRect();
    measure(rect.width, rect.height);

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      measure(width, height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ width: '100%', height: '100%', minHeight }}>
      {size && (
        <ResponsiveContainer width={size.width} height={size.height}>
          {children}
        </ResponsiveContainer>
      )}
    </div>
  );
}
