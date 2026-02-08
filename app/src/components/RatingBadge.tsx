"use client";
import React from "react";

const RATING_CONFIG: Record<string, { label: string; multiplier: string; days: number; color: string }> = {
  AAA: { label: "AAA", multiplier: "x3.0", days: 180, color: "rating-AAA" },
  AA:  { label: "AA",  multiplier: "x2.5", days: 90,  color: "rating-AA" },
  A:   { label: "A",   multiplier: "x2.0", days: 60,  color: "rating-A" },
  BBB: { label: "BBB", multiplier: "x1.5", days: 30,  color: "rating-BBB" },
  BB:  { label: "BB",  multiplier: "x1.2", days: 14,  color: "rating-BB" },
  B:   { label: "B",   multiplier: "x1.0", days: 7,   color: "rating-B" },
};

export default function RatingBadge({ rating, size = "md" }: { rating: string; size?: "sm" | "md" | "lg" }) {
  const config = RATING_CONFIG[rating] || RATING_CONFIG["B"];
  const sc: Record<string, string> = { sm: "px-2 py-0.5 text-xs", md: "px-3 py-1 text-sm", lg: "px-4 py-2 text-lg" };
  const cls = "inline-flex items-center gap-1 rounded-full font-bold font-mono " + config.color + " " + sc[size];
  return (
    <span className={cls}>
      {config.label}
      <span className="opacity-70 text-[0.8em]">{config.multiplier}</span>
    </span>
  );
}

export { RATING_CONFIG };
