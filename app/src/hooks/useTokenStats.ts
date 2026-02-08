import { useEffect, useState } from "react";
import { getTokenStats, getTopTokenHolders, TokenHolder, TokenStats } from "@/utils/token";

export interface UseTokenStatsReturn {
  stats: TokenStats | null;
  topHolders: TokenHolder[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTokenStats(): UseTokenStatsReturn {
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [topHolders, setTopHolders] = useState<TokenHolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching token stats and holders...");
      const [statsData, holdersData] = await Promise.all([
        getTokenStats(),
        getTopTokenHolders(undefined, 20),
      ]);

      console.log("Stats:", statsData);
      console.log("Holders:", holdersData);
      
      setStats(statsData);
      setTopHolders(holdersData);
    } catch (err) {
      console.error("Error fetching token stats:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch token stats";
      setError(errorMessage);
      // Still set empty data so UI doesn't break
      setStats(null);
      setTopHolders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    topHolders,
    loading,
    error,
    refresh: fetchData,
  };
}

