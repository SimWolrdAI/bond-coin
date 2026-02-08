"use client";
import React from "react";
import RatingBadge from "./RatingBadge";

export default function MyStakeCard({ stake, onClaim, onUnstake }: {
  stake: { amount: number; lockDays: number; rating: string; lockEnd: Date; weightedStake: number; pendingRewards: number; claimedRewards: number; } | null;
  onClaim: () => Promise<void>; onUnstake: () => Promise<void>;
}) {
  if (!stake) {
    return (
      <div className="bg-[#111827] rounded-2xl p-6 border border-[#1e293b] max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">???? My Stake</h2>
        <p className="text-gray-400 text-center py-8">You have not staked yet.<br/><span className="text-sm">Choose a lock period and stake above</span></p>
      </div>
    );
  }
  const now = new Date();
  const expired = now >= stake.lockEnd;
  const daysLeft = Math.max(0, Math.ceil((stake.lockEnd.getTime() - now.getTime()) / 86400000));
  const pct = Math.min(100, ((stake.lockDays - daysLeft) / stake.lockDays) * 100);
  return (
    <div className={"bg-[#111827] rounded-2xl p-6 border max-w-md w-full " + (expired ? "border-[#10b981]" : "border-[#1e293b] pulse-active")}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">???? My Stake</h2>
        <RatingBadge rating={stake.rating} size="lg" />
      </div>
      <div className="space-y-3 mb-4">
        <div className="flex justify-between"><span className="text-gray-400">Staked</span><span className="font-mono font-bold">{stake.amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} BOND</span></div>
        <div className="flex justify-between"><span className="text-gray-400">Weighted</span><span className="font-mono text-[#f59e0b]">{stake.weightedStake.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</span></div>
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{expired ? "Lock complete!" : daysLeft + " days left"}</span>
            <span>{pct.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[#0a0e17] rounded-full h-2">
            <div className={"h-2 rounded-full transition-all " + (expired ? "bg-[#10b981]" : "bg-[#f59e0b]")} style={{width: pct + "%"}} />
          </div>
        </div>
        <div className="border-t border-[#1e293b] pt-3 space-y-2">
          <div className="flex justify-between"><span className="text-gray-400">Pending</span><span className="font-mono text-[#10b981] font-bold">{stake.pendingRewards.toFixed(4)} SOL</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Claimed</span><span className="font-mono text-gray-300">{stake.claimedRewards.toFixed(4)} SOL</span></div>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onClaim} disabled={stake.pendingRewards<=0}
          className={"flex-1 py-2.5 rounded-xl font-bold transition-all " + (stake.pendingRewards>0 ? "bg-[#10b981] text-black hover:bg-emerald-400 glow-green" : "bg-gray-700 text-gray-500 cursor-not-allowed")}>Claim SOL</button>
        <button onClick={onUnstake} disabled={!expired}
          className={"flex-1 py-2.5 rounded-xl font-bold transition-all " + (expired ? "bg-[#3b82f6] text-white hover:bg-blue-500" : "bg-gray-700 text-gray-500 cursor-not-allowed")}>{expired ? "Unstake" : daysLeft + "d left"}</button>
      </div>
    </div>
  );
}
