# Настройка Supabase для Bond Coin

## Шаг 1: Создание проекта Supabase

1. Зайди на [supabase.com](https://supabase.com)
2. Создай аккаунт (бесплатно)
3. Создай новый проект
4. Дождись завершения создания (1-2 минуты)

## Шаг 2: Создание таблиц

Зайди в **SQL Editor** в Supabase Dashboard и выполни этот SQL:

```sql
-- Таблица пользователей
CREATE TABLE users (
  wallet_address TEXT PRIMARY KEY,
  total_earned_sol DECIMAL(18, 9) DEFAULT 0,
  total_staked DECIMAL(18, 9) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица выплат
CREATE TABLE payouts (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT REFERENCES users(wallet_address) ON DELETE CASCADE,
  amount_sol DECIMAL(18, 9) NOT NULL,
  payout_type TEXT NOT NULL CHECK (payout_type IN ('hold', 'stake')),
  multiplier DECIMAL(3, 1) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица стейков
CREATE TABLE stakes (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT REFERENCES users(wallet_address) ON DELETE CASCADE,
  amount DECIMAL(18, 9) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('B', 'BB', 'BBB', 'A', 'AA', 'AAA')),
  multiplier DECIMAL(3, 1) NOT NULL,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_payouts_wallet ON payouts(wallet_address);
CREATE INDEX idx_payouts_created ON payouts(created_at DESC);
CREATE INDEX idx_stakes_wallet ON stakes(wallet_address);
CREATE INDEX idx_stakes_active ON stakes(wallet_address, claimed) WHERE claimed = FALSE;
CREATE INDEX idx_stakes_end_date ON stakes(end_date);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Шаг 3: Получение API ключей

1. В Supabase Dashboard зайди в **Settings** → **API**
2. Скопируй:
   - **Project URL** → это `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → это `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → это `SUPABASE_SERVICE_ROLE_KEY` (для API routes)

## Шаг 4: Настройка переменных окружения

### Для локальной разработки:
Создай файл `app/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=твой_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_anon_key
SUPABASE_SERVICE_ROLE_KEY=твой_service_role_key
```

### Для Vercel:
1. Зайди в Vercel Dashboard → твой проект → **Settings** → **Environment Variables**
2. Добавь те же переменные

## Шаг 5: Установка зависимостей

```bash
cd app
npm install @supabase/supabase-js
```

## Готово! 🎉

Теперь:
- ✅ Каждый пользователь будет иметь свой профиль по адресу кошелька
- ✅ Стейки будут сохраняться в БД
- ✅ История выплат будет храниться централизованно
- ✅ Данные доступны с любого устройства

## Проверка работы

1. Запусти `npm run dev`
2. Подключи кошелек
3. Создай стейк
4. Проверь в Supabase Dashboard → Table Editor → `stakes` - должен появиться новый стейк

