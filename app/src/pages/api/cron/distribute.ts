import type { NextApiRequest, NextApiResponse } from 'next';

// Защита от несанкционированного доступа
const CRON_SECRET = process.env.CRON_SECRET;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Проверка секрета (Vercel автоматически добавляет заголовок)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // TODO: Здесь логика распределения наград
    // 1. Получить всех стейкеров из контракта
    // 2. Рассчитать награды
    // 3. Отправить SOL
    // 4. Сохранить в БД

    console.log('Running daily reward distribution...');
    
    // Пример логики:
    // const stakers = await getStakersFromContract();
    // const rewards = calculateRewards(stakers);
    // await distributeSOL(rewards);
    // await saveToDatabase(rewards);

    res.status(200).json({ 
      success: true, 
      message: 'Rewards distributed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error distributing rewards:', error);
    res.status(500).json({ 
      error: 'Failed to distribute rewards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

