import React from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface DonutSegment {
  label: string;
  value: number;
  /** classe Tailwind bg-* ou couleur hex */
  color: string;
  colorHex?: string; // pour le SVG si nécessaire
}

export interface DonutChartStubProps {
  data: DonutSegment[];
  /** Valeur centrale affichée */
  centerValue?: string;
  /** Label sous la valeur centrale */
  centerLabel?: string;
  /** Taille du SVG */
  size?: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// DonutChartStub
// Graphique en anneau SVG — structure finale du Design System.
// À remplacer par Recharts <PieChart> lors de l'intégration des données réelles.
// ---------------------------------------------------------------------------
export function DonutChartStub({
  data,
  centerValue,
  centerLabel,
  size = 160,
  className,
}: DonutChartStubProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const radius = (size / 2) * 0.75;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Génération des segments SVG via strokeDasharray
  let cumulAngle = -90; // commencer à 12h

  const segments = data.map((seg, idx) => {
    const fraction = total > 0 ? seg.value / total : 0;
    const dash = fraction * circumference;
    const gap = circumference - dash;
    const offset = (cumulAngle / 360) * circumference;
    cumulAngle += fraction * 360;

    // Couleurs DS par index si pas de hex fourni
    const dsColors = [
      'hsl(210,75%,17%)',  // primary
      'hsl(142,71%,45%)',  // success
      'hsl(38,92%,50%)',   // warning
      'hsl(0,84%,60%)',    // destructive
      'hsl(215,16%,47%)',  // muted
      'hsl(214,100%,50%)', // info
    ];

    return (
      <circle
        key={idx}
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={seg.colorHex ?? dsColors[idx % dsColors.length]}
        strokeWidth={size * 0.13}
        strokeDasharray={`${dash} ${gap}`}
        strokeDashoffset={-offset}
        strokeLinecap="butt"
        style={{ transition: 'stroke-dasharray 0.6s ease-out' }}
      />
    );
  });

  return (
    <div className={cn('flex flex-col sm:flex-row items-center gap-6', className)}>
      {/* SVG Donut */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="rotate-0"
        >
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={radius}
            fill="none"
            stroke="hsl(var(--secondary))"
            strokeWidth={size * 0.13}
          />
          {segments}
        </svg>
        {/* Centre */}
        {(centerValue || centerLabel) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerValue && (
              <span className="font-mono font-bold text-foreground" style={{ fontSize: size * 0.16 }}>
                {centerValue}
              </span>
            )}
            {centerLabel && (
              <span className="text-muted-foreground text-center leading-tight px-2" style={{ fontSize: size * 0.08 }}>
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {data.map((seg, idx) => {
          const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0.0';
          const dsColors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-destructive', 'bg-muted-foreground', 'bg-info'];
          return (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <span className={cn('h-2.5 w-2.5 rounded-full shrink-0', seg.color || dsColors[idx % dsColors.length])} />
              <span className="text-foreground truncate flex-1">{seg.label}</span>
              <span className="font-mono text-xs text-muted-foreground shrink-0">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
