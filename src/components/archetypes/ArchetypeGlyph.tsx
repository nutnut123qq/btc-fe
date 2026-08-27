"use client";

import type { ArchetypeOhlcBar } from "@/lib/types";

interface ArchetypeGlyphProps {
  bars: ArchetypeOhlcBar[];
  className?: string;
}

export function ArchetypeGlyph({ bars, className = "w-full h-full" }: ArchetypeGlyphProps) {
  if (!bars || bars.length === 0) return null;
  const minLow = Math.min(...bars.map((b) => b.low));
  const maxHigh = Math.max(...bars.map((b) => b.high));
  const range = maxHigh - minLow || 1;

  return (
    <svg
      viewBox={`0 0 ${bars.length * 10} 100`}
      className={`${className} overflow-visible`}
    >
      {bars.map((b, i) => {
        const x = i * 10 + 2;
        const yHigh = 100 - ((b.high - minLow) / range) * 100;
        const yLow = 100 - ((b.low - minLow) / range) * 100;
        const yOpen = 100 - ((b.open - minLow) / range) * 100;
        const yClose = 100 - ((b.close - minLow) / range) * 100;
        const isUp = b.close >= b.open;
        const color = isUp ? "#10b981" : "#f43f5e"; // emerald-500 : rose-500
        const yBody = Math.min(yOpen, yClose);
        const hBody = Math.max(Math.abs(yClose - yOpen), 1);

        return (
          <g key={i}>
            <line x1={x + 3} y1={yHigh} x2={x + 3} y2={yLow} stroke={color} strokeWidth="1" />
            <rect x={x + 1} y={yBody} width="4" height={hBody} fill={color} />
          </g>
        );
      })}
    </svg>
  );
}
