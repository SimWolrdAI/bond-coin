import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase, StakeRecord, isSupabaseEnabled } from "@/lib/supabase";

export interface Stake {
  id: string;
  amount: number;
  tier: string;
  multiplier: number;
  lockDays: number;
  startTime: number;
  unlockTime: number;
  claimed: boolean;
}

const STORAGE_KEY = "bond_stakes";

export function useStaking() {
  const { publicKey } = useWallet();
  const [stakes, setStakes] = useState<Stake[]>([]);
  const [loading, setLoading] = useState(false);

  // Load stakes from Supabase or localStorage
  useEffect(() => {
    if (!publicKey) {
      setStakes([]);
      return;
    }

    const walletAddress = publicKey.toBase58();
    
    if (isSupabaseEnabled()) {
      loadStakesFromDB(walletAddress);
    } else {
      // Fallback to localStorage
      loadStakesFromLocalStorage(walletAddress);
    }
  }, [publicKey]);

  const loadStakesFromLocalStorage = (walletAddress: string) => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${walletAddress}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const active = parsed.filter((s: Stake) => Date.now() < s.unlockTime || !s.claimed);
        setStakes(active);
        if (active.length !== parsed.length) {
          localStorage.setItem(`${STORAGE_KEY}_${walletAddress}`, JSON.stringify(active));
        }
      }
    } catch (e) {
      console.error("Error loading stakes from localStorage:", e);
    }
  };

  const loadStakesFromDB = async (walletAddress: string) => {
    if (!supabase) {
      loadStakesFromLocalStorage(walletAddress);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('stakes')
        .select('*')
        .eq('wallet_address', walletAddress)
        .eq('claimed', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading stakes:', error);
        // Fallback to localStorage
        loadStakesFromLocalStorage(walletAddress);
        return;
      }

      if (data) {
        const stakes: Stake[] = data.map((record: StakeRecord) => ({
          id: `stake_${record.id}`,
          amount: record.amount,
          tier: record.tier,
          multiplier: record.multiplier,
          lockDays: Math.ceil((new Date(record.end_date).getTime() - new Date(record.start_date).getTime()) / (24 * 60 * 60 * 1000)),
          startTime: new Date(record.start_date).getTime(),
          unlockTime: new Date(record.end_date).getTime(),
          claimed: record.claimed,
        }));
        setStakes(stakes);
      }
    } catch (e) {
      console.error('Error loading stakes from DB:', e);
      // Fallback to localStorage
      loadStakesFromLocalStorage(walletAddress);
    }
  };

  // Create a new stake
  const createStake = useCallback(async (amount: number, tier: string, multiplier: number, lockDays: number): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");
    
    setLoading(true);
    
    const walletAddress = publicKey.toBase58();
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + (lockDays * 24 * 60 * 60 * 1000));
    
    const newStake: Stake = {
      id: `stake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      tier,
      multiplier,
      lockDays,
      startTime: startDate.getTime(),
      unlockTime: endDate.getTime(),
      claimed: false,
    };
    
    try {
      if (isSupabaseEnabled() && supabase) {
        // Сохраняем в Supabase
        const { data, error } = await supabase
          .from('stakes')
          .insert({
            wallet_address: walletAddress,
            amount,
            tier,
            multiplier,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            claimed: false,
          })
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        // Обновляем профиль пользователя
        await supabase
          .from('users')
          .upsert({
            wallet_address: walletAddress,
            total_staked: amount,
          }, {
            onConflict: 'wallet_address',
          });

        // Перезагружаем стейки
        await loadStakesFromDB(walletAddress);
        
        setLoading(false);
        return `stake_${data.id}`;
      } else {
        // Fallback to localStorage
        const updated = [...stakes, newStake];
        if (publicKey) {
          localStorage.setItem(`${STORAGE_KEY}_${walletAddress}`, JSON.stringify(updated));
        }
        setStakes(updated);
        setLoading(false);
        return newStake.id;
      }
    } catch (e: any) {
      setLoading(false);
      // Если Supabase не работает, используем localStorage
      if (isSupabaseEnabled()) {
        console.warn('Supabase failed, using localStorage:', e);
        const updated = [...stakes, newStake];
        if (publicKey) {
          localStorage.setItem(`${STORAGE_KEY}_${walletAddress}`, JSON.stringify(updated));
        }
        setStakes(updated);
        return newStake.id;
      }
      throw e;
    }
  }, [publicKey, stakes]);

  // Unstake (claim and unlock)
  const unstake = useCallback(async (stakeId: string): Promise<void> => {
    if (!publicKey) throw new Error("Wallet not connected");
    
    const walletAddress = publicKey.toBase58();
    const stake = stakes.find(s => s.id === stakeId);
    if (!stake) throw new Error("Stake not found");
    
    const now = Date.now();
    if (now < stake.unlockTime) {
      throw new Error("Stake is still locked");
    }
    
    setLoading(true);
    
    try {
      if (isSupabaseEnabled() && supabase) {
        const dbId = parseInt(stakeId.replace('stake_', ''));
        
        // Обновляем в БД
        const { error } = await supabase
          .from('stakes')
          .update({ claimed: true })
          .eq('id', dbId)
          .eq('wallet_address', walletAddress);

        if (error) {
          throw new Error(error.message);
        }

        // Перезагружаем стейки
        await loadStakesFromDB(walletAddress);
      } else {
        // Fallback to localStorage
        const updated = stakes.filter(s => s.id !== stakeId);
        if (publicKey) {
          localStorage.setItem(`${STORAGE_KEY}_${walletAddress}`, JSON.stringify(updated));
        }
        setStakes(updated);
      }
      
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      // Если Supabase не работает, используем localStorage
      if (isSupabaseEnabled()) {
        console.warn('Supabase failed, using localStorage:', e);
        const updated = stakes.filter(s => s.id !== stakeId);
        if (publicKey) {
          localStorage.setItem(`${STORAGE_KEY}_${walletAddress}`, JSON.stringify(updated));
        }
        setStakes(updated);
        return;
      }
      throw e;
    }
  }, [publicKey, stakes]);

  // Get total staked amount
  const totalStaked = stakes.reduce((sum, s) => sum + (s.claimed ? 0 : s.amount), 0);

  // Get active stakes (not claimed)
  const activeStakes = stakes.filter(s => !s.claimed);

  // Get total rewards (simulated - based on time staked)
  const calculateRewards = useCallback((stake: Stake): number => {
    if (stake.claimed) return 0;
    const now = Date.now();
    const stakedFor = now - stake.startTime;
    const daysStaked = stakedFor / (24 * 60 * 60 * 1000);
    // Simulate rewards: 0.1% per day with multiplier
    const baseReward = (stake.amount * 0.001 * daysStaked);
    return baseReward * stake.multiplier;
  }, []);

  const totalRewards = stakes.reduce((sum, s) => sum + calculateRewards(s), 0);

  return {
    stakes: activeStakes,
    totalStaked,
    totalRewards,
    loading,
    createStake,
    unstake,
    calculateRewards,
  };
}
