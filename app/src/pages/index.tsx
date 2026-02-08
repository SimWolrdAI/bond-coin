import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef } from "react";
import { useTokenStats } from "@/hooks/useTokenStats";
import { TOKEN_MINT } from "@/utils/token";

/* ===== SVG paths for "BOND" loading ===== */
const LETTER_PATHS = [
  "M10,80 L10,10 Q10,10 10,10 L10,10 Q40,10 40,25 Q40,40 20,42 Q45,44 45,60 Q45,78 10,80 Z",
  "M70,45 Q70,10 95,10 Q120,10 120,45 Q120,80 95,80 Q70,80 70,45 Z",
  "M140,80 L140,10 L175,80 L175,10",
  "M195,10 L195,80 Q235,80 235,45 Q235,10 195,10 Z",
];
const drawVariant = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({ pathLength: 1, opacity: 1, transition: { pathLength: { delay: i * 0.4, duration: 0.8, ease: "easeInOut" as const }, opacity: { delay: i * 0.4, duration: 0.01 } } }),
};

/* ===== Idle animation presets ===== */
const idleFloat = (i: number) => ({
  y: [0, -4, 0], rotate: [0, 0.5, 0, -0.5, 0],
  transition: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut" as const, delay: i * 0.3 },
});
const idleBreathe = (i: number) => ({
  scale: [1, 1.01, 1],
  transition: { duration: 2.5 + i * 0.4, repeat: Infinity, ease: "easeInOut" as const, delay: i * 0.2 },
});
const idleWiggle = (i: number) => ({
  rotate: [0, -1, 1, -0.5, 0],
  transition: { duration: 4 + i * 0.6, repeat: Infinity, ease: "easeInOut" as const, delay: i * 0.4 },
});
const tapShrink = { scale: 0.97 };

/* ===== Reusable SVG components ===== */
function DrawLine({ d, color = "#000", width = 3, delay = 0, duration = 0.8, viewBox = "0 0 300 20", className = "" }: {
  d: string; color?: string; width?: number; delay?: number; duration?: number; viewBox?: string; className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <svg ref={ref} viewBox={viewBox} className={className} fill="none" preserveAspectRatio="none">
      <motion.path d={d} stroke={color} strokeWidth={width} strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ pathLength: { delay, duration, ease: "easeInOut" }, opacity: { delay, duration: 0.01 } }} />
    </svg>
  );
}

function Swoosh({ color = "#facc15", delay = 0.2, className = "" }: { color?: string; delay?: number; className?: string }) {
  return <DrawLine d="M5,14 Q40,2 80,12 Q120,22 160,8 Q200,0 240,10 Q260,16 295,6" color={color} width={4} delay={delay} duration={0.7} viewBox="0 0 300 24" className={"w-full h-4 " + className} />;
}

function DoodleDivider({ className = "" }: { className?: string }) {
  return <div className={"w-full " + className}><DrawLine d="M0,10 Q30,3 60,10 Q90,17 120,10 Q150,3 180,10 Q210,17 240,10 Q270,3 300,10" color="#ccc" width={2} delay={0} duration={1} viewBox="0 0 300 20" className="w-full h-5" /></div>;
}

function DrawCheck({ delay = 0.5 }: { delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  return (
    <svg ref={ref} width="24" height="24" viewBox="0 0 24 24" fill="none">
      <motion.path d="M4,12 L10,18 L20,6" stroke="#22c55e" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }} animate={inView ? { pathLength: 1, opacity: 1 } : {}}
        transition={{ pathLength: { delay, duration: 0.4, ease: "easeOut" }, opacity: { delay, duration: 0.01 } }} />
    </svg>
  );
}

/* ===== Typewriter ===== */
function Typewriter({ text, highlights, speed = 12, delay = 0, className = "" }: {
  text: string; highlights?: { word: string; color: string }[]; speed?: number; delay?: number; className?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [charCount, setCharCount] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => { let i = 0; const iv = setInterval(() => { i++; setCharCount(i); if (i >= text.length) clearInterval(iv); }, speed); }, delay * 1000);
    return () => clearTimeout(t);
  }, [inView, text, speed, delay]);
  const vis = text.slice(0, charCount);
  let result: ReactNode = vis;
  if (highlights && highlights.length > 0) {
    const parts: ReactNode[] = []; let rem = vis; let k = 0;
    while (rem.length > 0) {
      let ei = rem.length; let mh: { word: string; color: string } | null = null;
      for (const hl of highlights) { const idx = rem.indexOf(hl.word); if (idx !== -1 && idx < ei) { ei = idx; mh = hl; } }
      if (mh && ei < rem.length) { if (ei > 0) parts.push(rem.slice(0, ei)); parts.push(<span key={k++} className={mh.color + " font-bold"}>{mh.word}</span>); rem = rem.slice(ei + mh.word.length); }
      else { parts.push(rem); rem = ""; }
    }
    result = parts;
  }
  return (
    <p ref={ref} className={className}>{result}
      {charCount < text.length && inView && <motion.span className="inline-block w-[2px] h-[1.1em] bg-black ml-[1px] align-middle" animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} />}
    </p>
  );
}

function LoadingScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: "#f8f8f4", backgroundImage: "linear-gradient(#cde0f0 1px, transparent 1px), linear-gradient(90deg, #cde0f0 1px, transparent 1px)", backgroundSize: "28px 28px" }}
      exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: "easeOut" }}>
      <div className="absolute top-0 left-[72px] w-[2px] h-full bg-[#e8847a] opacity-50" />
      <div className="flex flex-col items-center gap-6">
        <motion.svg width="260" height="90" viewBox="0 0 260 90" initial="hidden" animate="visible">
          {LETTER_PATHS.map((d, i) => <motion.path key={i} d={d} fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" variants={drawVariant} custom={i} />)}
        </motion.svg>
        <motion.svg width="200" height="20" viewBox="0 0 200 20" className="-mt-4">
          <motion.path d="M10,15 Q50,0 100,12 Q150,24 190,8" fill="none" stroke="#facc15" strokeWidth="4" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 1.8, duration: 0.6 }} />
        </motion.svg>
        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map(i => <motion.div key={i} className="w-2 h-2 bg-black rounded-full" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 2.2 + i * 0.2, duration: 0.8, repeat: Infinity, repeatDelay: 0.4 }} />)}
        </div>
      </div>
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const } }),
};

/* ===== HOW IT WORKS ===== */
const STEPS = [
  { step: "1", title: "Buy $BOND", desc: "Get tokens on Pump.fun", bg: "bg-yellow-100", accent: "#facc15" },
  { step: "2", title: "Hold & Earn", desc: "All holders get SOL", bg: "bg-green-100", accent: "#34d399" },
  { step: "3", title: "Stake for x", desc: "Lock for multiplier", bg: "bg-blue-100", accent: "#60a5fa" },
  { step: "4", title: "Claim SOL", desc: "Daily payouts", bg: "bg-pink-100", accent: "#f472b6" },
];

function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section ref={ref} id="how" initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
      <motion.div variants={fadeUp} custom={0} className="mb-8"><span className="tab-sticker bg-green-200">How It Works</span></motion.div>
      <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black font-hand mb-1 text-black">How It <span className="hl-green">Works</span></motion.h2>
      <Swoosh color="#22c55e" delay={0.3} className="max-w-[180px] mb-10" />

      <div className="hidden md:block">
        <div className="grid grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3 + i * 0.3, duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <motion.div className="relative mb-4 z-20"
                animate={inView ? { rotate: [0, 5, -5, 3, 0], scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                whileHover={{ scale: 1.2, rotate: 15 }} whileTap={tapShrink}>
                <div className="w-[50px] h-[50px] rounded-full flex items-center justify-center font-black text-xl font-hand relative z-10 text-white"
                  style={{ background: "#000", boxShadow: "0 0 0 3px " + s.accent }}>
                  {s.step}
                </div>
              </motion.div>
              <motion.div
                animate={inView ? idleFloat(i) : {}}
                whileHover={{ y: -8, rotate: -2, boxShadow: "5px 6px 0 #000" }} whileTap={tapShrink}
                className={"sticker-card w-full p-5 text-center cursor-default " + s.bg}>
                <h3 className="font-black text-base font-hand text-black mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 font-bold font-hand">{s.desc}</p>
                <svg className="w-[60%] h-2 mx-auto mt-2" viewBox="0 0 100 8" fill="none">
                  <motion.path d="M5,5 Q25,1 50,5 Q75,9 95,4" stroke={s.accent} strokeWidth="2.5" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ delay: 0.8 + i * 0.3, duration: 0.5 }} />
                </svg>
              </motion.div>
            </motion.div>
          ))}
        </div>
        <div className="flex justify-around px-16 -mt-[70px] mb-8 pointer-events-none">
          {[0, 1, 2].map(i => (
            <svg key={i} width="40" height="24" viewBox="0 0 40 24" fill="none">
              <motion.path d="M4,12 Q12,4 20,12 Q28,20 36,12" stroke="#999" strokeWidth="2" strokeLinecap="round"
                initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ delay: 1 + i * 0.3, duration: 0.4 }} />
              <motion.path d="M30,6 L36,12 L30,18" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ delay: 1.2 + i * 0.3, duration: 0.2 }} />
            </svg>
          ))}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {STEPS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }} animate={inView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
            className={"sticker-card p-5 flex items-center gap-4 " + s.bg}>
            <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-black text-lg font-hand shrink-0" style={{ boxShadow: "0 0 0 3px " + s.accent }}>{s.step}</div>
            <div><h3 className="font-black text-base font-hand text-black">{s.title}</h3><p className="text-xs text-gray-500 font-bold font-hand">{s.desc}</p></div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ===== RATINGS ===== */
const RATINGS = [
  { rating: "AAA", days: "180 days", mult: "3.0x", color: "bg-yellow-300", accent: "#facc15", barW: "100%" },
  { rating: "AA", days: "90 days", mult: "2.5x", color: "bg-green-300", accent: "#34d399", barW: "83%" },
  { rating: "A", days: "60 days", mult: "2.0x", color: "bg-blue-300", accent: "#60a5fa", barW: "67%" },
  { rating: "BBB", days: "30 days", mult: "1.5x", color: "bg-purple-300", accent: "#a78bfa", barW: "50%" },
  { rating: "BB", days: "14 days", mult: "1.2x", color: "bg-orange-300", accent: "#fb923c", barW: "40%" },
  { rating: "B", days: "7 days", mult: "1.0x", color: "bg-red-300", accent: "#f87171", barW: "33%" },
];

function BondRatingsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (inView) { const t = setTimeout(() => setEntered(true), 800); return () => clearTimeout(t); }
  }, [inView]);

  return (
    <motion.section ref={ref} id="ratings" initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
      <motion.div variants={fadeUp} custom={0} className="mb-8"><span className="tab-sticker bg-blue-200">Ratings</span></motion.div>
      <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black font-hand mb-1 text-black">Bond <span className="hl-pink">Ratings</span></motion.h2>
      <Swoosh color="#f472b6" delay={0.3} className="max-w-[180px] mb-10" />

      <div className="max-w-2xl space-y-4">
        {RATINGS.map((r, i) => (
          <motion.div key={r.rating}
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2 + i * 0.15, duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              animate={entered ? { y: [0, -2, 0, 2, 0], rotate: [0, 0.3, 0, -0.3, 0], transition: { duration: 4 + i * 0.7, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 } } : {}}
              whileHover={{ x: 8, scale: 1.02, boxShadow: "5px 5px 0 #000" }} whileTap={tapShrink}
              className="sticker-card p-4 md:p-5 flex items-center justify-between cursor-default"
            >
              <div className="flex items-center gap-4">
                <motion.span
                  animate={entered ? { scale: [1, 1.06, 1], rotate: [0, 2, -2, 0], transition: { duration: 3 + i * 0.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 } } : {}}
                  whileHover={{ scale: 1.25, rotate: -8 }}
                  className={"badge " + r.color + " !text-base !px-3 !py-1"}>{r.rating}</motion.span>
                <div>
                  <p className="font-black text-base font-hand text-black">{r.days}</p>
                  <div className="w-32 md:w-40 h-2 bg-gray-100 rounded-full mt-1 overflow-hidden border border-gray-200">
                    <motion.div className="h-full rounded-full" style={{ background: r.accent }}
                      initial={{ width: 0 }} animate={inView ? { width: r.barW } : {}} transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }} />
                  </div>
                </div>
              </div>
              <motion.span className="font-black text-2xl font-hand text-black"
                animate={entered ? { scale: [1, 1.08, 1], transition: { duration: 2.5 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 } } : {}}
                whileHover={{ scale: 1.3 }}>{r.mult}</motion.span>
            </motion.div>
          </motion.div>
        ))}
      </div>

      <motion.div className="mt-6 flex items-center gap-3 max-w-2xl pl-4" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}} transition={{ delay: 1.5, duration: 0.5 }}>
        <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
          <motion.path d="M2,10 L22,10 M16,4 L22,10 L16,16" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : {}} transition={{ delay: 1.5, duration: 0.3 }} />
        </svg>
        <span className="text-sm text-gray-400 font-bold font-hand">Lock longer = <span className="hl-yellow">earn more</span></span>
      </motion.div>
    </motion.section>
  );
}

/* ===== TOKEN STATS SECTION ===== */
function TokenStatsSection() {
  const { stats, loading, error } = useTokenStats();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use consistent initial value to avoid hydration mismatch
  const displayValue = (val: string | undefined, fallback: string = "---") => {
    if (!mounted) return fallback; // Server-side: always use fallback
    if (loading) return "...";
    return val || fallback;
  };

  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: "Market Cap", 
            val: displayValue(stats?.formattedMarketCap), 
            bg: "bg-yellow-100" 
          },
          { 
            label: "Est. Holders", 
            val: displayValue(stats?.estimatedHolders?.toString()), 
            bg: "bg-green-100" 
          },
          { 
            label: "Top Holders", 
            val: displayValue(stats?.topHoldersCount?.toString()), 
            bg: "bg-blue-100" 
          },
          { 
            label: "SOL Distributed", 
            val: "---", // Will be updated when payout system is live
            bg: "bg-pink-100" 
          },
        ].map((s, i) => (
          <motion.div key={i} variants={fadeUp} custom={i}
            animate={idleFloat(i)}
            whileHover={{ y: -6, scale: 1.04, boxShadow: "5px 6px 0 #000" }} whileTap={tapShrink}
            className={"sticker-card p-5 text-center cursor-default " + s.bg}>
            <motion.div className="text-3xl font-black font-hand text-black"
              animate={idleBreathe(i)} whileHover={{ scale: 1.15 }}>{s.val}</motion.div>
            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1 font-hand">{s.label}</div>
            {error && i === 0 && (
              <p className="text-[10px] text-red-500 font-hand mt-1">Error loading</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

/* ===== MAIN PAGE ===== */
export default function Home() {
  const [loading, setLoading] = useState(true);
  return (
    <>
      <Head>
        <title>Bond Coin - Tokenized Bonds on Solana</title>
        <meta name="description" content="Bond Coin - Earn SOL from trading fees. Stake tokens for multiplied payouts." />
      </Head>

      <AnimatePresence>{loading && <LoadingScreen onDone={() => setLoading(false)} />}</AnimatePresence>

      {/* NAV */}
      <nav className="sticky top-0 z-50 bg-[#f8f8f4]/90 backdrop-blur-sm border-b-2 border-black px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16">
          <motion.div className="flex items-center gap-2 cursor-pointer" whileHover={{ scale: 1.05 }} whileTap={tapShrink}>
            <Image src="/icon.png" alt="BOND" width={32} height={32} className="rounded" />
            <span className="text-2xl font-black font-hand">$BOND</span>
          </motion.div>
          <div className="hidden md:flex items-center gap-3">
            {[
              { href: "#about", l: "About", bg: "bg-yellow-200" },
              { href: "#how", l: "How It Works", bg: "bg-green-200" },
              { href: "#ratings", l: "Ratings", bg: "bg-blue-200" },
            ].map((n, i) => (
              <motion.a key={n.href} href={n.href} className={"tab-sticker " + n.bg}
                animate={idleFloat(i + 5)}
                whileHover={{ y: -4, rotate: -2, boxShadow: "4px 5px 0 #000" }} whileTap={tapShrink}>{n.l}</motion.a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <motion.a href="http://pump.fun/coin/Djh5MhQJwbMfmdSSeXz3FmE3VZpP9SW7q3aY7Wy3pump" target="_blank" rel="noopener noreferrer" className="btn-sticker btn-yellow !py-2 !px-4 !text-sm"
              whileHover={{ y: -2, boxShadow: "4px 4px 0 #000" }} whileTap={tapShrink}>Buy $BOND</motion.a>
            <Link href="/app" legacyBehavior>
              <motion.a className="btn-sticker btn-purple !py-2 !px-4 !text-sm"
                animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                whileHover={{ y: -2, boxShadow: "4px 4px 0 #000" }} whileTap={tapShrink}>App</motion.a>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 relative" style={{marginLeft: "max(calc(50% - 560px), 88px)"}}>

        {/* HERO */}
        <motion.section initial="hidden" animate="visible" className="mb-14">
          <motion.div className="sticker-card p-8 md:p-12 relative overflow-hidden"
            animate={{ boxShadow: ["3px 3px 0 #000", "4px 5px 0 #000", "3px 3px 0 #000"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
            <div className="tape tape-tl"></div>
            <div className="tape tape-tr"></div>
            <div className="grid md:grid-cols-[1fr,auto] gap-8 items-center">
              <div>
                <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-black leading-tight mb-1 font-hand text-black">
                  Hold <span className="hl-yellow">$BOND</span>,{" "}<br/>Earn <span className="hl-green">SOL</span>.
                </motion.h1>
                <Swoosh color="#facc15" delay={0.8} className="max-w-[280px] mb-5" />
                <motion.p variants={fadeUp} custom={2} className="text-lg text-gray-600 leading-relaxed mb-8 max-w-md font-hand">
                  The first <span className="hl-pink">token obligation</span> on Solana. Trading fees from Pump.fun go to all holders. Stake for <span className="hl-yellow">up to 3x</span> multiplier.
                </motion.p>
                <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-4">
                  <motion.a href="http://pump.fun/coin/Djh5MhQJwbMfmdSSeXz3FmE3VZpP9SW7q3aY7Wy3pump" target="_blank" rel="noopener noreferrer" className="btn-sticker btn-yellow"
                    animate={idleBreathe(0)} whileHover={{ y: -4, rotate: -2, boxShadow: "5px 5px 0 #000" }} whileTap={tapShrink}>Buy $BOND</motion.a>
                  <Link href="/app" legacyBehavior>
                    <motion.a className="btn-sticker btn-purple"
                      animate={idleBreathe(1)} whileHover={{ y: -4, rotate: 2, boxShadow: "5px 5px 0 #000" }} whileTap={tapShrink}>Launch App</motion.a>
                  </Link>
                </motion.div>
              </div>
              <motion.div variants={fadeUp} custom={2} className="hidden md:block">
                <motion.div animate={{ y: [0, -12, 0], rotate: [0, 3, 0, -3, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  whileHover={{ scale: 1.12 }} className="w-52 h-52 relative cursor-pointer">
                  <Image src="/icon.png" alt="BOND" fill className="object-contain drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </motion.section>

        {/* STATS */}
        <TokenStatsSection />

        <DoodleDivider className="mb-14" />

        {/* CA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
          <motion.div variants={fadeUp} custom={0}
            animate={idleWiggle(0)}
            whileHover={{ rotate: 0, boxShadow: "5px 5px 0 #000" }}
            className="sticker-card p-6 text-center bg-gray-50 relative cursor-default">
            <div className="tape tape-tl"></div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-2 font-hand">Contract Address</p>
            <p className="font-mono text-sm md:text-base text-gray-500 break-all">{TOKEN_MINT.toBase58()}</p>
          </motion.div>
        </motion.section>

        <DoodleDivider className="mb-14" />

        {/* ABOUT */}
        <motion.section id="about" initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14">
          <motion.div variants={fadeUp} custom={0} className="mb-8"><span className="tab-sticker bg-yellow-200">About</span></motion.div>
          <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-5xl font-black font-hand mb-1 text-black">What is <span className="hl-yellow">$BOND</span>?</motion.h2>
          <Swoosh color="#facc15" delay={0.3} className="max-w-[220px] mb-8" />

          <motion.div variants={fadeUp} custom={2}
            animate={idleWiggle(1)}
            whileHover={{ rotate: 0, boxShadow: "5px 6px 0 #000" }}
            className="sticker-card p-6 md:p-8 bg-white mb-10 relative">
            <div className="tape tape-tl"></div>
            <div className="tape tape-tr"></div>
            <Typewriter className="text-base md:text-lg leading-relaxed text-gray-700 font-hand" speed={10} delay={0.3}
              text="$BOND is the first token obligation protocol on Solana, built natively on Pump.fun. Every holder earns SOL from trading fees — no staking required. But if you want more, you can stake and lock your tokens to get a multiplier of up to 3x on your payouts. Our credit rating system (from AAA to B) rewards long-term commitment: the longer you lock, the higher your rating and the bigger your share. All payouts are transparent and verifiable on-chain. No VCs, no emissions, no hidden mechanics — just pure fee-backed yield from real trading volume flowing back to every holder. Hold $BOND, earn SOL. Stake it, earn even more. Simple as that."
              highlights={[
                { word: "$BOND", color: "hl-yellow" }, { word: "Pump.fun", color: "hl-green" },
                { word: "no staking required", color: "hl-pink" }, { word: "3x", color: "hl-yellow" },
                { word: "AAA", color: "hl-yellow" }, { word: "on-chain", color: "hl-green" },
                { word: "fee-backed yield", color: "hl-orange" }, { word: "earn SOL", color: "hl-green" },
              ]} />
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { title: "Hold = Earn", desc: <>Every $BOND holder gets <span className="hl-yellow font-bold">SOL payouts</span> from trading fees. No staking needed.</>, bg: "bg-yellow-50", d: 0.4 },
              { title: "Stake = Multiply", desc: <>Lock your tokens for up to <span className="hl-green font-bold">3x multiplier</span> on your base payout.</>, bg: "bg-green-50", d: 0.6 },
              { title: "On-Chain", desc: <>Everything transparent. Track all payouts on <span className="hl-pink font-bold">Solana</span>.</>, bg: "bg-blue-50", d: 0.8 },
            ].map((c, i) => (
              <motion.div key={i} variants={fadeUp} custom={i + 2}
                animate={idleFloat(i + 2)}
                whileHover={{ y: -8, rotate: i === 1 ? 0 : i === 0 ? -2 : 2, boxShadow: "5px 6px 0 #000" }} whileTap={tapShrink}
                className={"sticker-card p-6 cursor-default " + c.bg}>
                <div className="flex items-center gap-2 mb-2"><DrawCheck delay={c.d} /><h3 className="text-xl font-black text-black">{c.title}</h3></div>
                <p className="text-sm text-gray-600 leading-relaxed">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <DoodleDivider className="mb-14" />
        <HowItWorksSection />
        <DoodleDivider className="mb-14" />
        <BondRatingsSection />
        <DoodleDivider className="mb-14" />

        {/* CTA */}
        <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-16">
          <motion.div variants={fadeUp} custom={0}
            animate={{ boxShadow: ["3px 3px 0 #000", "5px 5px 0 #000", "3px 3px 0 #000"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ boxShadow: "6px 7px 0 #000" }}
            className="sticker-card p-8 md:p-12 text-center bg-yellow-50 relative">
            <div className="tape tape-tl"></div>
            <div className="tape tape-tr"></div>
            <h2 className="text-3xl md:text-5xl font-black font-hand mb-1 text-black">Ready to earn?</h2>
            <Swoosh color="#facc15" delay={0.3} className="max-w-[200px] mx-auto mb-5" />
            <p className="text-gray-500 mb-8 text-lg max-w-md mx-auto font-hand">Hold $BOND = earn SOL. Stake = earn <span className="hl-yellow">even more</span>.</p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <motion.a href="http://pump.fun/coin/Djh5MhQJwbMfmdSSeXz3FmE3VZpP9SW7q3aY7Wy3pump" target="_blank" rel="noopener noreferrer" className="btn-sticker btn-yellow"
                animate={idleBreathe(0)} whileHover={{ y: -4, rotate: -2, boxShadow: "5px 5px 0 #000", scale: 1.05 }} whileTap={tapShrink}>Buy $BOND</motion.a>
              <Link href="/app" legacyBehavior>
                <motion.a className="btn-sticker btn-purple"
                  animate={idleBreathe(1)} whileHover={{ y: -4, rotate: 2, boxShadow: "5px 5px 0 #000", scale: 1.05 }} whileTap={tapShrink}>Launch App</motion.a>
              </Link>
            </div>
          </motion.div>
        </motion.section>
      </main>

      <footer className="border-t-2 border-black py-8 bg-white/50">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <motion.div className="flex items-center gap-2" whileHover={{ scale: 1.05 }}>
              <Image src="/icon.png" alt="BOND" width={26} height={26} className="rounded" />
              <span className="font-black font-hand text-xl text-black">$BOND</span>
            </motion.div>
            <div className="flex items-center gap-3">
              {[{ l: "Twitter", cls: "btn-blue", href: "https://x.com/i/communities/2020560598006686207/" }, { l: "Pump.fun", cls: "btn-yellow", href: "https://pump.fun" }].map((b, i) => (
                <motion.a key={b.l} href={b.href} target="_blank" rel="noopener noreferrer" className={"btn-sticker " + b.cls + " !text-sm !py-2 !px-4"}
                  animate={idleFloat(i + 8)}
                  whileHover={{ y: -3, rotate: -1, boxShadow: "4px 4px 0 #000" }} whileTap={tapShrink}>{b.l}</motion.a>
              ))}
            </div>
            <p className="text-xs text-gray-400 font-black font-hand">2026 $BOND</p>
          </div>
        </div>
      </footer>
    </>
  );
}
