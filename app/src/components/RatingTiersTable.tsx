"use client";
import React from "react";
import RatingBadge from "./RatingBadge";

const TIERS = [
  { rating: "AAA", days: 180, mult: "x3.0", desc: "Maximum yield", emoji: "????" },
  { rating: "AA",  days: 90,  mult: "x2.5", desc: "High yield", emoji: "????" },
  { rating: "A",   days: 60,  mult: "x2.0", desc: "Good yield", emoji: "???" },
  { rating: "BBB", days: 30,  mult: "x1.5", desc: "Moderate yield", emoji: "????" },
  { rating: "BB",  days: 14,  mult: "x1.2", desc: "Base+", emoji: "????" },
  { rating: "B",   days: 7,   mult: "x1.0", desc: "Base yield", emoji: "????" },
];

export default function RatingTiersTable() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">Bond Ratings</h2>
      <div className="grid gap-3">
        {TIERS.map((tier) => (
          <div key={tier.rating} className="bg-[#111827] border border-[#1e293b] rounded-xl p-4 flex items-center gap-4 hover:border-[#f59e0b]/50 transition-all">
            <span className="text-2xl">{tier.emoji}</span>
            <RatingBadge rating={tier.rating} size="lg" />
            <div className="flex-1"><p className="text-sm text-gray-300">{tier.desc}</p></div>
            <div className="text-right">
              <div className="font-mono font-bold text-[#f59e0b] text-lg">{tier.mult}</div>
              <div className="text-xs text-gray-400">{tier.days} days</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
