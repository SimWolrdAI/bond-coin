import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export interface UserProfile {
  wallet: string;
  totalEarned: number;
  totalStaked: number;
  activeStakes: any[];
  payoutHistory: any[];
  createdAt: string | null;
}

export function useProfile() {
  const { publicKey } = useWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/profile/${publicKey.toBase58()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await response.json();
        setProfile(data);
      } catch (e: any) {
        console.error('Error fetching profile:', e);
        setError(e.message);
        // Если профиля нет, создаем пустой
        setProfile({
          wallet: publicKey.toBase58(),
          totalEarned: 0,
          totalStaked: 0,
          activeStakes: [],
          payoutHistory: [],
          createdAt: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchProfile, 30000);
    return () => clearInterval(interval);
  }, [publicKey]);

  return { profile, loading, error };
}

