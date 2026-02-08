import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getTokenBalance, getTokenMintInfo, formatTokenAmount, calculateSupplyPercentage, TOKEN_MINT } from "@/utils/token";

export interface UseTokenDataReturn {
  balance: number;
  formattedBalance: string;
  supply: number;
  formattedSupply: string;
  supplyPercentage: number;
  decimals: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTokenData(): UseTokenDataReturn {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(0);
  const [supply, setSupply] = useState(0);
  const [decimals, setDecimals] = useState(9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!connected || !publicKey) {
      setBalance(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch balance and supply in parallel
      const [balanceData, mintInfo] = await Promise.all([
        getTokenBalance(publicKey, TOKEN_MINT),
        getTokenMintInfo(TOKEN_MINT),
      ]);

      setBalance(balanceData.balance);
      setSupply(mintInfo.supply);
      setDecimals(balanceData.decimals || mintInfo.decimals);
    } catch (err) {
      console.error("Error fetching token data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch token data");
      setBalance(0);
      setSupply(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  const formattedBalance = formatTokenAmount(balance, decimals);
  const formattedSupply = formatTokenAmount(supply, decimals);
  const supplyPercentage = calculateSupplyPercentage(balance, supply);

  return {
    balance,
    formattedBalance,
    supply,
    formattedSupply,
    supplyPercentage,
    decimals,
    loading,
    error,
    refresh: fetchData,
  };
}

