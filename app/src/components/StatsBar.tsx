"use client";
import React from "react";

export default function StatsBar({ totalStaked, totalStakers, totalRewardsDistributed, tokenPrice }: {
  totalStaked: number; totalStakers: number; totalRewardsDistributed: number; tokenPrice: number;
}) {
  const stats = [
    { label: "Total Staked", value: (totalStaked / 1000000).toFixed(1) + "M", sub: "BOND", icon: "????" },
    { label: "Stakers", value: totalStakers.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","), sub: "holders", icon: "????" },
    { label: "Rewards Paid", value: totalRewardsDistributed.toFixed(1), sub: "SOL", icon: "????" },
    { label: "Token Price", value: "$" + tokenPrice.toFixed(4), sub: "USD", icon: "????" },
  ];
  return (
    <div className="w-full bg-[#111827]/80 backdrop-blur-sm border-b border-[#1e293b]">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-6 overflow-x-auto">
        {stats.map((s, i) => (
          <div key={i} className="flex items-center gap-2 min-w-fit">
            <span className="text-xl">{s.icon}</span>
            <div>
              <div className="text-xs text-gray-400">{s.label}</div>
              <div className="font-bold font-mono text-white">{s.value} <span className="text-gray-400 text-xs font-normal">{s.sub}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
