"use client";
import React from "react";

const STEPS = [
  { num: "01", title: "Buy BOND", desc: "Get BOND tokens on Pump.fun or Raydium.", icon: "????" },
  { num: "02", title: "Stake", desc: "Lock tokens for 7-180 days. Longer = higher rating.", icon: "????" },
  { num: "03", title: "Fees generated", desc: "Every BOND trade = fees to the creator.", icon: "????" },
  { num: "04", title: "Earn SOL", desc: "Fees go to stakers based on share x multiplier.", icon: "????" },
];

export default function HowItWorks() {
  return (
    <div className="w-full max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-px bg-[#1e293b]" />
        <div className="space-y-8">
          {STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-6 relative">
              <div className="w-16 h-16 rounded-full bg-[#111827] border-2 border-[#f59e0b] flex items-center justify-center text-2xl flex-shrink-0 z-10">{step.icon}</div>
              <div className="pt-2">
                <div className="text-[#f59e0b] font-mono text-sm mb-1">Step {step.num}</div>
                <h3 className="text-lg font-bold mb-1">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-10 bg-[#111827] border border-[#1e293b] rounded-2xl p-6 text-center">
        <p className="text-sm text-gray-400 mb-3">Reward formula:</p>
        <div className="font-mono text-lg text-[#f59e0b]">Reward = (tokens x multiplier) / total_weighted x fees</div>
      </div>
    </div>
  );
}
