import { createClient } from '@supabase/supabase-js';

// Эти переменные нужно будет добавить в Vercel Environment Variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Создаем клиент только если есть URL и ключ
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Проверка, доступен ли Supabase
export const isSupabaseEnabled = () => {
  return supabase !== null && supabaseUrl !== '' && supabaseAnonKey !== '';
};

// Типы для БД
export interface UserProfile {
  wallet_address: string;
  total_earned_sol: number;
  total_staked: number;
  created_at?: string;
  updated_at?: string;
}

export interface StakeRecord {
  id?: number;
  wallet_address: string;
  amount: number;
  tier: string;
  multiplier: number;
  start_date: string;
  end_date: string;
  claimed: boolean;
  created_at?: string;
}

export interface PayoutRecord {
  id?: number;
  wallet_address: string;
  amount_sol: number;
  payout_type: 'hold' | 'stake';
  multiplier: number;
  created_at?: string;
}

