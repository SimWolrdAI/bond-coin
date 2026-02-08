import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTokenData } from "@/hooks/useTokenData";
import { useTokenStats } from "@/hooks/useTokenStats";
import { useStaking } from "@/hooks/useStaking";
import { useProfile } from "@/hooks/useProfile";
import { TOKEN_MINT } from "@/utils/token";

const tapShrink = { scale: 0.97 };

/* ===== TIER DATA ===== */
const TIERS = [
  { rating: "B", days: 7, mult: 1.0, color: "bg-red-300", accent: "#f87171", textColor: "text-red-700" },
  { rating: "BB", days: 14, mult: 1.2, color: "bg-orange-300", accent: "#fb923c", textColor: "text-orange-700" },
  { rating: "BBB", days: 30, mult: 1.5, color: "bg-purple-300", accent: "#a78bfa", textColor: "text-purple-700" },
  { rating: "A", days: 60, mult: 2.0, color: "bg-blue-300", accent: "#60a5fa", textColor: "text-blue-700" },
  { rating: "AA", days: 90, mult: 2.5, color: "bg-green-300", accent: "#34d399", textColor: "text-green-700" },
  { rating: "AAA", days: 180, mult: 3.0, color: "bg-yellow-300", accent: "#facc15", textColor: "text-yellow-700" },
];

/* ===== WALLET BUTTON ===== */
function WalletButton() {
  const { publicKey, disconnect, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const addr = publicKey ? publicKey.toBase58() : "";
  const short = addr ? addr.slice(0, 4) + ".." + addr.slice(-4) : "";

  if (connected && publicKey) {
    return (
      <motion.button onClick={disconnect} className="btn-sticker btn-green !py-2 !px-4 !text-sm"
        whileHover={{ y: -2, boxShadow: "4px 4px 0 #000" }} whileTap={tapShrink}>
        {short}
      </motion.button>
    );
  }
  return (
    <motion.button onClick={() => setVisible(true)} className="btn-sticker btn-purple !py-2 !px-4 !text-sm"
      animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      whileHover={{ y: -2, boxShadow: "4px 4px 0 #000" }} whileTap={tapShrink}>
      Connect Wallet
    </motion.button>
  );
}

/* ===== TABS ===== */
type Tab = "stake" | "leaderboard" | "profile";

const tabData: { id: Tab; label: string; bg: string }[] = [
  { id: "stake", label: "Stake", bg: "bg-yellow-200" },
  { id: "leaderboard", label: "Leaderboard", bg: "bg-green-200" },
  { id: "profile", label: "Profile", bg: "bg-blue-200" },
];

/* ===== STAKE TAB ===== */
function StakeTab() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance, formattedBalance, loading: tokenLoading } = useTokenData();
  const { stakes, totalStaked, totalRewards, loading: stakingLoading, createStake, unstake, calculateRewards } = useStaking();
  const [selectedTier, setSelectedTier] = useState(2);
  const [amount, setAmount] = useState("");
  const [staking, setStaking] = useState(false);
  const tier = TIERS[selectedTier];

  const handleStake = useCallback(async () => {
    if (!connected || !publicKey) { setVisible(true); return; }
    const stakeAmount = parseFloat(amount);
    if (!amount || stakeAmount <= 0 || stakeAmount > balance) {
      alert("Invalid amount! Make sure you have enough tokens.");
      return;
    }
    
    setStaking(true);
    try {
      await createStake(stakeAmount, tier.rating, tier.mult, tier.days);
      setAmount("");
      alert(`Successfully staked ${stakeAmount.toLocaleString()} $BOND for ${tier.days} days (${tier.rating} rating, ${tier.mult}x multiplier)!`);
    } catch (e: any) {
      alert("Error: " + (e.message || "Failed to stake"));
    } finally {
      setStaking(false);
    }
  }, [connected, publicKey, amount, balance, tier, createStake, setVisible]);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* LEFT: Stake form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="sticker-card p-6 md:p-8 bg-white relative">
        <div className="tape tape-tl"></div>
        <h3 className="font-black text-2xl font-hand text-black mb-6">Stake <span className="hl-yellow">$BOND</span></h3>

        {/* Info banner */}
        <div className="rounded-sm border-2 border-dashed border-green-400 bg-green-50 p-3 mb-6">
          <p className="text-xs font-bold font-hand text-green-700">All holders earn SOL from fees. Staking gives you a <span className="hl-yellow">multiplier</span> on top!</p>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-sm font-bold font-hand text-gray-400 uppercase tracking-wider">Your Balance</span>
          <span className="font-black text-lg font-hand text-black">
            {tokenLoading ? (
              <span className="text-gray-400">Loading...</span>
            ) : connected ? (
              <>
                {formattedBalance} <span className="text-sm text-gray-400">tokens</span>
              </>
            ) : (
              "---"
            )}
          </span>
        </div>

        {/* Amount input */}
        <div className="mb-5">
          <label className="text-sm font-bold font-hand text-gray-500 mb-2 block">Amount to Stake</label>
          <div className="relative">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
              className="w-full p-4 pr-24 border-2 border-black rounded-sm font-hand font-bold text-xl text-black bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-300 focus:border-black" />
            <button onClick={() => setAmount(balance.toString())}
              disabled={!connected || balance === 0}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black font-hand text-yellow-600 bg-yellow-100 px-3 py-1 border border-yellow-400 rounded-sm hover:bg-yellow-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              MAX
            </button>
          </div>
        </div>

        {/* Lock duration */}
        <div className="mb-5">
          <label className="text-sm font-bold font-hand text-gray-500 mb-3 block">Lock Duration (for multiplier)</label>
          <div className="grid grid-cols-3 gap-2">
            {TIERS.map((t, i) => (
              <motion.button key={t.rating} onClick={() => setSelectedTier(i)}
                whileHover={{ y: -2, boxShadow: "3px 4px 0 #000" }} whileTap={tapShrink}
                className={"p-3 border-2 rounded-sm font-hand font-bold text-center transition-all " +
                  (selectedTier === i ? "border-black bg-black text-white" : "border-black bg-white text-black shadow-[2px_2px_0_#000] hover:bg-gray-50")}
                style={selectedTier === i ? { boxShadow: "3px 3px 0 " + t.accent } : undefined}>
                <div className="text-lg leading-none">{t.days}d</div>
                <div className="text-[10px] mt-0.5 opacity-60">{t.rating} / {t.mult}x</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Selected tier summary */}
        <motion.div key={selectedTier} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={"rounded-sm border-2 border-black p-3 mb-5 flex items-center justify-between " + tier.color + "/30"}>
          <div className="flex items-center gap-3">
            <span className={"badge " + tier.color + " !text-sm"}>{tier.rating}</span>
            <span className="font-bold font-hand text-sm text-black">{tier.days} days lock</span>
          </div>
          <div className="text-right">
            <span className="font-black font-hand text-xl text-black">{tier.mult}x</span>
            <p className="text-[10px] font-hand text-gray-500">payout multiplier</p>
          </div>
        </motion.div>

        {/* Stake button */}
        {connected ? (
          <motion.button onClick={handleStake} disabled={staking || !amount}
            whileHover={{ y: -3, boxShadow: "5px 5px 0 #000" }} whileTap={tapShrink}
            className={"btn-sticker btn-yellow w-full justify-center text-lg " + (staking ? "opacity-60 cursor-wait" : "") + (!amount ? " opacity-40 cursor-not-allowed" : "")}>
            {staking ? (
              <span className="flex items-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full" />
                Staking...
              </span>
            ) : "Stake $BOND"}
          </motion.button>
        ) : (
          <motion.button onClick={() => setVisible(true)}
            whileHover={{ y: -3, boxShadow: "5px 5px 0 #000" }} whileTap={tapShrink}
            className="btn-sticker btn-purple w-full justify-center text-lg">
            Connect Wallet to Stake
          </motion.button>
        )}
      </motion.div>

      {/* RIGHT: Info cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col gap-5">

        {/* How payouts work */}
        <div className="sticker-card p-6 bg-yellow-50 relative">
          <div className="tape tape-tr"></div>
          <h4 className="font-black text-lg font-hand text-black mb-4">How Payouts Work</h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center border-2 border-black font-black font-hand text-sm shrink-0">1</div>
              <div><p className="font-bold font-hand text-sm text-black">Trading fees collected</p><p className="text-xs text-gray-500 font-hand">From every buy/sell on Pump.fun</p></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center border-2 border-black font-black font-hand text-sm shrink-0">2</div>
              <div><p className="font-bold font-hand text-sm text-black">Base payout to ALL holders</p><p className="text-xs text-gray-500 font-hand">Proportional to % of supply held</p></div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center border-2 border-black font-black font-hand text-sm shrink-0">3</div>
              <div><p className="font-bold font-hand text-sm text-black">Stakers get multiplied payout</p><p className="text-xs text-gray-500 font-hand">Lock tokens for 1.0x - 3.0x boost</p></div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="sticker-card p-5 bg-green-50">
          <h4 className="font-black text-sm font-hand text-black mb-3 uppercase tracking-wider">Protocol Info</h4>
          <div className="space-y-2">
            {[
              { l: "Fee Source", v: "Pump.fun Trading Fees" },
              { l: "Paid In", v: "SOL" },
              { l: "Distribution", v: "Daily" },
              { l: "Hold Payout", v: "1.0x (base)" },
              { l: "Max Staking Boost", v: "3.0x (AAA)" },
            ].map((row, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-xs font-bold font-hand text-gray-500">{row.l}</span>
                <span className="text-xs font-black font-hand text-black">{row.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Active Stakes List */}
        {stakes.length > 0 && (
          <div className="sticker-card p-5 bg-blue-50 relative">
            <div className="tape tape-tr"></div>
            <h4 className="font-black text-sm font-hand text-black mb-3 uppercase tracking-wider">Your Active Stakes</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stakes.map((stake) => {
                const tier = TIERS.find(t => t.rating === stake.tier) || TIERS[0];
                const now = Date.now();
                const progress = Math.min(100, ((now - stake.startTime) / (stake.unlockTime - stake.startTime)) * 100);
                const rewards = calculateRewards(stake);
                return (
                  <div key={stake.id} className="p-3 border-2 border-black rounded-sm bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className={"badge " + tier.color + " !text-xs"}>{stake.tier}</span>
                        <span className="font-black font-hand text-xs text-black">{stake.amount.toLocaleString(undefined, { maximumFractionDigits: 1 })} $BOND</span>
                      </div>
                      <span className="font-black font-hand text-xs text-green-600">{rewards.toFixed(3)} SOL</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 border border-gray-300 rounded-full overflow-hidden">
                      <motion.div className={"h-full " + tier.color} style={{ width: `${progress}%` }}
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <p className="text-[9px] font-hand text-gray-400 mt-1">
                      {progress.toFixed(0)}% • {Math.ceil((stake.unlockTime - now) / (24 * 60 * 60 * 1000))}d left
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ===== LEADERBOARD TAB ===== */
function LeaderboardTab() {
  const { stats, topHolders, loading, error, refresh } = useTokenStats();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Total Supply", val: loading ? "..." : (stats?.formattedSupply || "---"), bg: "bg-yellow-100" },
          { label: "Est. Holders", val: loading ? "..." : (stats?.estimatedHolders ? stats.estimatedHolders.toString() : "---"), bg: "bg-green-100" },
          { label: "Top Holders", val: loading ? "..." : (topHolders.length.toString()), bg: "bg-blue-100" },
          { label: "SOL Distributed", val: "---", bg: "bg-pink-100" }, // Will be updated when payout system is live
        ].map((s, i) => (
          <div key={i} className={"sticker-card p-4 text-center " + s.bg}>
            <div className="text-xl font-black font-hand text-black">{s.val}</div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1 font-hand">{s.label}</div>
          </div>
        ))}
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="sticker-card p-4 bg-red-50 border-2 border-red-300 mb-6">
          <p className="text-sm font-bold font-hand text-red-700 mb-2">Error loading data: {error}</p>
          <p className="text-xs font-hand text-red-600 mb-3">Check browser console for details. Token might be on devnet or address might be incorrect.</p>
          <motion.button onClick={refresh} whileHover={{ y: -2 }} whileTap={tapShrink}
            className="btn-sticker btn-red !text-xs !py-1.5 !px-3">
            Retry
          </motion.button>
        </motion.div>
      )}

      {/* Table */}
      <div className="sticker-card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_1fr_80px_70px] gap-2 p-4 bg-gray-100 border-b-2 border-black text-xs font-black font-hand text-gray-500 uppercase tracking-wider">
          <div>#</div>
          <div>Address</div>
          <div>Holdings</div>
          <div>% Supply</div>
          <div>Staked</div>
        </div>
        {/* Rows */}
        {loading ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 font-hand font-bold">Loading top holders...</p>
          </div>
        ) : topHolders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-400 font-hand font-bold">No holders found</p>
          </div>
        ) : (
          topHolders.map((holder, i) => {
            const shortAddr = holder.address.slice(0, 4) + ".." + holder.address.slice(-4);
            return (
              <motion.div key={holder.address}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ backgroundColor: "#fefce8" }}
                className={"grid grid-cols-[40px_1fr_1fr_80px_70px] gap-2 p-4 items-center border-b border-gray-100 transition-colors " + (i === 0 ? "bg-yellow-50/50" : "")}
              >
                <div className="font-black font-hand text-sm text-gray-400">
                  {i === 0 ? <span className="text-yellow-500">1</span> : i === 1 ? <span className="text-gray-400">2</span> : i === 2 ? <span className="text-orange-400">3</span> : i + 1}
                </div>
                <div className="font-mono text-sm text-black font-bold" title={holder.address}>{shortAddr}</div>
                <div>
                  <p className="font-black font-hand text-sm text-black">{holder.formattedBalance}</p>
                </div>
                <div className="font-bold font-hand text-sm text-black">{holder.percentage.toFixed(4)}%</div>
                <div className="text-xs font-hand text-gray-300">---</div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-gray-400 font-hand font-bold">
          {loading ? "Loading..." : topHolders.length > 0 ? `Showing top ${topHolders.length} holders` : "No holders found"} • Data updates every 30 seconds
        </p>
        <motion.button onClick={refresh} disabled={loading} whileHover={{ y: -2 }} whileTap={tapShrink}
          className="btn-sticker btn-blue !text-xs !py-1.5 !px-3 disabled:opacity-40">
          {loading ? "Loading..." : "Refresh"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ===== PROFILE TAB ===== */
function ProfileTab() {
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { balance, formattedBalance, supply, formattedSupply, supplyPercentage, loading: tokenLoading, error: tokenError } = useTokenData();
  const { stakes, totalStaked, totalRewards, unstake, calculateRewards } = useStaking();
  const { profile, loading: profileLoading } = useProfile();

  if (!connected) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="sticker-card p-12 text-center bg-white">
        <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
            <path d="M20,21v-2a4,4,0,0,0-4-4H8a4,4,0,0,0-4,4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h3 className="font-black text-2xl font-hand text-black mb-2">Connect Your Wallet</h3>
        <p className="text-gray-400 font-hand text-sm mb-6">See your holdings, payouts, and staking status</p>
        <motion.button onClick={() => setVisible(true)}
          whileHover={{ y: -3, boxShadow: "5px 5px 0 #000" }} whileTap={tapShrink}
          className="btn-sticker btn-purple justify-center text-lg mx-auto">
          Connect Wallet
        </motion.button>
      </motion.div>
    );
  }

  // Connected — show mock profile
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="grid md:grid-cols-2 gap-6">

        {/* Holdings & Base Payout */}
        <div className="sticker-card p-6 bg-white relative">
          <div className="tape tape-tl"></div>
          <h3 className="font-black text-xl font-hand text-black mb-5">My Holdings</h3>

          <div className="space-y-4">
            {tokenError && (
              <div className="rounded-sm border-2 border-red-300 bg-red-50 p-2 mb-3">
                <p className="text-xs font-bold font-hand text-red-700">Error: {tokenError}</p>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold font-hand text-gray-400">Token Balance</span>
              <span className="font-black text-xl font-hand text-black">
                {tokenLoading ? "Loading..." : formattedBalance}
              </span>
            </div>
            {supply > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold font-hand text-gray-400">% of Supply</span>
                <span className="font-bold font-hand text-black">
                  {tokenLoading ? "..." : supplyPercentage.toFixed(4)}%
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold font-hand text-gray-400">Total Supply</span>
              <span className="font-bold font-hand text-black text-sm">
                {tokenLoading ? "..." : formattedSupply}
              </span>
            </div>
            <div className="border-t-2 border-dashed border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold font-hand text-gray-400">Base Payout (holder)</span>
                <span className="font-black font-hand text-green-600">0 SOL</span>
              </div>
              <p className="text-[10px] text-gray-400 font-hand mt-1">Earned from just holding tokens, no staking required</p>
            </div>
          </div>
        </div>

        {/* Staking Status */}
        <div className="sticker-card p-6 bg-white relative">
          <div className="tape tape-tr"></div>
          <h3 className="font-black text-xl font-hand text-black mb-5">Staking Status</h3>

          {stakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round">
                  <path d="M12,2 L12,22 M2,12 L22,12" />
                </svg>
              </div>
              <p className="text-gray-400 font-bold font-hand text-sm mb-1">No active stake</p>
              <p className="text-gray-300 font-hand text-xs mb-3">Your multiplier: 1.0x (base holder)</p>
              <Link href="/app" legacyBehavior>
                <motion.a className="btn-sticker btn-yellow !text-sm !py-2" whileHover={{ y: -2 }} whileTap={tapShrink}>
                  Stake to boost payout
                </motion.a>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 border-2 border-green-300 rounded-sm">
                <span className="text-sm font-bold font-hand text-gray-600">Total Staked</span>
                <span className="font-black font-hand text-lg text-black">{totalStaked.toLocaleString(undefined, { maximumFractionDigits: 2 })} $BOND</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 border-2 border-yellow-300 rounded-sm">
                <span className="text-sm font-bold font-hand text-gray-600">Pending Rewards</span>
                <span className="font-black font-hand text-lg text-green-600">{totalRewards.toFixed(4)} SOL</span>
              </div>
              {stakes.map((stake) => {
                const tier = TIERS.find(t => t.rating === stake.tier) || TIERS[0];
                const now = Date.now();
                const progress = Math.min(100, ((now - stake.startTime) / (stake.unlockTime - stake.startTime)) * 100);
                const canUnlock = now >= stake.unlockTime;
                const rewards = calculateRewards(stake);
                return (
                  <div key={stake.id} className="p-4 border-2 border-black rounded-sm bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={"badge " + tier.color}>{stake.tier}</span>
                          <span className="font-black font-hand text-sm text-black">{stake.multiplier}x</span>
                        </div>
                        <p className="text-xs font-bold font-hand text-gray-500">{stake.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $BOND</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold font-hand text-green-600">{rewards.toFixed(4)} SOL</p>
                        <p className="text-[10px] font-hand text-gray-400">rewards</p>
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs font-bold font-hand text-gray-500 mb-1">
                        <span>Lock Progress</span>
                        <span>{progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 border border-gray-300 rounded-full overflow-hidden">
                        <motion.div className={"h-full " + tier.color} style={{ width: `${progress}%` }}
                          initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                    {canUnlock ? (
                      <motion.button onClick={async () => {
                        try {
                          await unstake(stake.id);
                          alert(`Successfully unlocked and claimed ${stake.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} $BOND + ${rewards.toFixed(4)} SOL rewards!`);
                        } catch (e: any) {
                          alert("Error: " + (e.message || "Failed to unlock"));
                        }
                      }}
                        whileHover={{ y: -2, boxShadow: "3px 3px 0 #000" }} whileTap={tapShrink}
                        className="btn-sticker btn-green w-full !text-sm !py-2 mt-2">
                        Unlock & Claim
                      </motion.button>
                    ) : (
                      <p className="text-[10px] font-hand text-gray-400 text-center mt-2">
                        Unlocks in {Math.ceil((stake.unlockTime - now) / (24 * 60 * 60 * 1000))} days
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Payout History */}
      <div className="sticker-card p-6 bg-white mt-6">
        <h3 className="font-black text-xl font-hand text-black mb-5">Payout History</h3>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-sm border-2 border-green-200">
            <div className="text-2xl font-black font-hand text-green-600">
              {profileLoading ? "..." : (profile?.totalEarned?.toFixed(4) || "0")} SOL
            </div>
            <div className="text-[10px] text-gray-500 font-bold font-hand uppercase mt-1">Total Earned</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-sm border-2 border-yellow-200">
            <div className="text-2xl font-black font-hand text-yellow-600">
              {profileLoading ? "..." : (profile?.payoutHistory?.filter((p: any) => p.payout_type === 'hold').reduce((sum: number, p: any) => sum + (p.amount_sol || 0), 0).toFixed(4) || "0")} SOL
            </div>
            <div className="text-[10px] text-gray-500 font-bold font-hand uppercase mt-1">From Holding</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-sm border-2 border-blue-200">
            <div className="text-2xl font-black font-hand text-blue-600">
              {profileLoading ? "..." : (profile?.payoutHistory?.filter((p: any) => p.payout_type === 'stake').reduce((sum: number, p: any) => sum + (p.amount_sol || 0), 0).toFixed(4) || "0")} SOL
            </div>
            <div className="text-[10px] text-gray-500 font-bold font-hand uppercase mt-1">From Staking Boost</div>
          </div>
        </div>

        {profileLoading ? (
          <div className="border-2 border-dashed border-gray-200 rounded-sm p-8 text-center">
            <p className="text-gray-300 font-hand font-bold text-sm">Loading...</p>
          </div>
        ) : profile?.payoutHistory && profile.payoutHistory.length > 0 ? (
          <div className="space-y-2">
            {profile.payoutHistory.map((payout: any, i: number) => (
              <div key={i} className="p-3 border-2 border-black rounded-sm bg-white flex justify-between items-center">
                <div>
                  <p className="font-black font-hand text-sm text-black">{payout.payout_type === 'stake' ? 'Staking Reward' : 'Hold Reward'}</p>
                  <p className="text-xs font-hand text-gray-500">{new Date(payout.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-black font-hand text-lg text-green-600">+{payout.amount_sol.toFixed(4)} SOL</p>
                  {payout.multiplier > 1 && (
                    <p className="text-xs font-hand text-gray-400">{payout.multiplier}x</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-sm p-8 text-center">
            <p className="text-gray-300 font-hand font-bold text-sm">No payout history yet</p>
            <p className="text-gray-200 font-hand text-xs mt-1">Buy $BOND to start earning SOL from trading fees</p>
          </div>
        )}
      </div>

      {/* Claimable */}
      <div className="sticker-card p-6 bg-yellow-50 mt-6 relative">
        <div className="tape tape-tl"></div>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-black text-xl font-hand text-black">Claimable Rewards</h3>
            <p className="text-xs text-gray-500 font-hand mt-1">Base payout + staking boost</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black font-hand text-green-600">{totalRewards.toFixed(4)} SOL</div>
          </div>
        </div>
        <motion.button 
          onClick={() => {
            if (totalRewards > 0) {
              alert(`Claimed ${totalRewards.toFixed(4)} SOL! (This is a demo - real payouts will be available after launch)`);
            }
          }}
          disabled={totalRewards === 0}
          whileHover={totalRewards > 0 ? { y: -3, boxShadow: "5px 5px 0 #000" } : {}}
          whileTap={tapShrink}
          className={"btn-sticker btn-green w-full justify-center text-lg mt-4 " + (totalRewards === 0 ? "opacity-40 cursor-not-allowed" : "")}>
          Claim SOL
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ===== APP PAGE ===== */
export default function AppPage() {
  const [tab, setTab] = useState<Tab>("stake");

  return (
    <>
      <Head>
        <title>Bond Coin - Stake & Earn</title>
        <meta name="description" content="Bond Coin - Stake tokens, view leaderboard, track your payouts" />
      </Head>

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#f8f8f4]/90 backdrop-blur-sm border-b-2 border-black px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <Link href="/" legacyBehavior>
            <motion.a className="flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={tapShrink}>
              <Image src="/icon.png" alt="BOND" width={32} height={32} className="rounded" />
              <span className="text-2xl font-black font-hand">$BOND</span>
            </motion.a>
          </Link>

          <div className="flex items-center gap-2">
            {tabData.map(t => (
              <motion.button key={t.id} onClick={() => setTab(t.id)}
                whileHover={{ y: -2, boxShadow: "3px 4px 0 #000" }} whileTap={tapShrink}
                className={"tab-sticker " + (tab === t.id ? t.bg + " !shadow-[3px_3px_0_#000]" : "bg-white")}>
                {t.label}
              </motion.button>
            ))}
          </div>

          <WalletButton />
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-8 relative" style={{ marginLeft: "max(calc(50% - 560px), 88px)" }}>
        {/* Token CA Display */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="sticker-card p-4 bg-gray-50 mb-6 relative">
          <div className="tape tape-tl"></div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div>
              <p className="text-xs font-black font-hand text-gray-400 uppercase tracking-wider mb-1">$BOND Token Contract Address</p>
              <p className="font-mono text-sm font-bold text-black break-all">{TOKEN_MINT.toBase58()}</p>
              <p className="text-[10px] text-gray-400 font-hand mt-1">Live on-chain data from Solana</p>
            </div>
            <motion.button
              onClick={() => navigator.clipboard.writeText(TOKEN_MINT.toBase58())}
              whileHover={{ y: -2, boxShadow: "3px 3px 0 #000" }} whileTap={tapShrink}
              className="btn-sticker btn-blue !text-xs !py-1.5 !px-3 shrink-0">
              Copy CA
            </motion.button>
          </div>
        </motion.div>

        {/* Tab label */}
        <motion.div key={tab} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black font-hand text-black">
            {tab === "stake" && <>Stake <span className="hl-yellow">$BOND</span></>}
            {tab === "leaderboard" && <><span className="hl-green">Leaderboard</span></>}
            {tab === "profile" && <>My <span className="hl-pink">Profile</span></>}
          </h1>
          <p className="text-sm text-gray-400 font-hand font-bold mt-1">
            {tab === "stake" && "Lock tokens for multiplied SOL payouts"}
            {tab === "leaderboard" && "Top holders and stakers by on-chain data"}
            {tab === "profile" && "Your holdings, payouts, and staking status"}
          </p>
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {tab === "stake" && <StakeTab key="stake" />}
          {tab === "leaderboard" && <LeaderboardTab key="leaderboard" />}
          {tab === "profile" && <ProfileTab key="profile" />}
        </AnimatePresence>
      </main>

      <footer className="border-t-2 border-black py-6 bg-white/50 mt-12">
        <div className="max-w-5xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="BOND" width={20} height={20} className="rounded" />
            <span className="font-black font-hand text-sm text-black">$BOND</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" legacyBehavior>
              <motion.a className="btn-sticker btn-blue !text-xs !py-1.5 !px-3"
                whileHover={{ y: -2 }} whileTap={tapShrink}>Home</motion.a>
            </Link>
            <a href="https://pump.fun" target="_blank" rel="noopener noreferrer" className="btn-sticker btn-yellow !text-xs !py-1.5 !px-3">Pump.fun</a>
          </div>
          <p className="text-xs text-gray-400 font-black font-hand">2026 $BOND</p>
        </div>
      </footer>
    </>
  );
}

