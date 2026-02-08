import type { NextApiRequest, NextApiResponse } from 'next';
import { PublicKey } from '@solana/web3.js';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { wallet } = req.query;

  if (!wallet || typeof wallet !== 'string') {
    return res.status(400).json({ error: 'Wallet address required' });
  }

  try {
    // Проверка валидности адреса
    new PublicKey(wallet);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid wallet address' });
  }

  try {
    if (!isSupabaseEnabled() || !supabase) {
      // Если Supabase не настроен, возвращаем пустой профиль
      return res.status(200).json({
        wallet: wallet,
        totalEarned: 0,
        totalStaked: 0,
        activeStakes: [],
        payoutHistory: [],
        createdAt: null,
      });
    }

    // Получаем профиль пользователя
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', wallet)
      .single();

    if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Error fetching user:', userError);
      // Возвращаем пустой профиль вместо ошибки
    }

    // Получаем активные стейки
    let stakesData = [];
    try {
      const { data: stakes, error: stakesError } = await supabase
        .from('stakes')
        .select('*')
        .eq('wallet_address', wallet)
        .eq('claimed', false);
      
      if (stakesError) {
        console.error('Error fetching stakes:', stakesError);
      } else {
        stakesData = stakes || [];
      }
    } catch (e) {
      console.error('Error fetching stakes:', e);
    }

    // Получаем историю выплат
    let payoutsData = [];
    try {
      const { data: payouts, error: payoutsError } = await supabase
        .from('payouts')
        .select('*')
        .eq('wallet_address', wallet)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (payoutsError) {
        console.error('Error fetching payouts:', payoutsError);
      } else {
        payoutsData = payouts || [];
      }
    } catch (e) {
      console.error('Error fetching payouts:', e);
    }

    const profile = {
      wallet: wallet,
      totalEarned: user?.total_earned_sol || 0,
      totalStaked: user?.total_staked || 0,
      activeStakes: stakesData,
      payoutHistory: payoutsData,
      createdAt: user?.created_at || null,
    };

    res.status(200).json(profile);
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ 
      error: 'Failed to fetch profile',
      message: error.message 
    });
  }
}
