"use client";
import React, { useState } from "react";
import RatingBadge from "./RatingBadge";

const LOCK_OPTIONS = [
  { days: 7,   rating: "B",   multiplier: "x1.0", apy: "~5%" },
  { days: 14,  rating: "BB",  multiplier: "x1.2", apy: "~6%" },
  { days: 30,  rating: "BBB", multiplier: "x1.5", apy: "~8%" },
  { days: 60,  rating: "A",   multiplier: "x2.0", apy: "~10%" },
  { days: 90,  rating: "AA",  multiplier: "x2.5", apy: "~13%" },
  { days: 180, rating: "AAA", multiplier: "x3.0", apy: "~15%" },
];

export default function StakingCard({ walletConnected, tokenBalance, onStake }: {
  walletConnected: boolean; tokenBalance: number; onStake: (a: number, d: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [sel, setSel] = useState(LOCK_OPTIONS[2]);
  const [loading, setLoading] = useState(false);

  const doStake = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);
    try { await onStake(Number(amount), sel.days); setAmount(""); } catch(e) { console.error(e); }
    setLoading(false);
  };

  const mult = parseFloat(sel.multiplier.replace("x",""));

  return (
    <div className="gradient-border bg-[#111827] rounded-2xl p-6 max-w-md w-full">
      <h2 className="text-xl font-bold mb-4">???? Stake & Earn</h2>
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-1 block">Amount</label>
        <div className="relative">
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
            className="w-full bg-[#0a0e17] border border-[#1e293b] rounded-xl px-4 py-3 text-lg font-mono focus:outline-none focus:border-[#f59e0b] transition-colors" />
          <button onClick={() => setAmount(String(tokenBalance))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-[#f59e0b]/20 text-[#f59e0b] px-2 py-1 rounded-md">MAX</button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Balance: {tokenBalance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} BOND</p>
      </div>
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Lock Period ??? Rating</label>
        <div className="grid grid-cols-3 gap-2">
          {LOCK_OPTIONS.map((o) => {
            const active = sel.days === o.days;
            return (
              <button key={o.days} onClick={() => setSel(o)}
                className={"p-3 rounded-xl border text-center transition-all " + (active ? "border-[#f59e0b] bg-[#f59e0b]/10 glow-gold" : "border-[#1e293b] bg-[#0a0e17] hover:border-gray-600")}>
                <div className="text-lg font-bold font-mono">{o.days}d</div>
                <RatingBadge rating={o.rating} size="sm" />
                <div className="text-xs text-gray-400 mt-1">{o.multiplier}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div className="bg-[#0a0e17] rounded-xl p-4 mb-4 space-y-2">
        <div className="flex justify-between text-sm"><span className="text-gray-400">Rating</span><RatingBadge rating={sel.rating} size="sm" /></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">Multiplier</span><span className="font-mono text-[#f59e0b]">{sel.multiplier}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">Est. APY</span><span className="font-mono text-[#10b981]">{sel.apy}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-400">Unlock in</span><span className="font-mono">{sel.days} days</span></div>
        {amount && Number(amount) > 0 && (
          <div className="flex justify-between text-sm border-t border-[#1e293b] pt-2 mt-2">
            <span className="text-gray-400">Weighted stake</span>
            <span className="font-mono text-white font-bold">{(Number(amount) * mult).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span>
          </div>
        )}
      </div>
      <button onClick={walletConnected ? doStake : undefined}
        disabled={walletConnected && (!amount || Number(amount) <= 0 || loading)}
        className={"w-full py-3 rounded-xl font-bold text-lg transition-all " + (
          !walletConnected || !amount || Number(amount) <= 0
            ? "bg-[#f59e0b] text-black hover:bg-amber-400"
            : "bg-[#f59e0b] text-black hover:bg-amber-400 glow-gold cursor-pointer"
        )}>
        {!walletConnected ? "Connect Wallet" : loading ? "Staking..." : "???? Stake " + sel.rating}
      </button>
    </div>
  );
}
