# 🚀 Гайд по деплою Bond Coin

## Что нужно для запуска

### ✅ Минимальный стек:
1. **Vercel** - для фронтенда (Next.js)
2. **Solana Mainnet** - для смарт-контракта
3. **Supabase** (или Vercel Postgres) - для БД профилей
4. **Vercel Cron** - для ежедневного распределения наград

---

## 📋 Пошаговая инструкция

### 1️⃣ Деплой фронтенда на Vercel

#### Вариант A: Через Vercel Dashboard (проще)
1. Зайди на [vercel.com](https://vercel.com)
2. Подключи GitHub репозиторий
3. Выбери папку `app/`
4. Настрой переменные окружения:
   ```
   NEXT_PUBLIC_SOLANA_RPC=https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   CRON_SECRET=твой_секретный_ключ
   ```
5. Деплой!

#### Вариант B: Через CLI
```bash
cd app
npm install -g vercel
vercel
```

---

### 2️⃣ Настройка базы данных (Supabase)

1. Создай аккаунт на [supabase.com](https://supabase.com)
2. Создай новый проект
3. Выполни SQL для создания таблиц:

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
  wallet_address TEXT REFERENCES users(wallet_address),
  amount_sol DECIMAL(18, 9),
  payout_type TEXT, -- 'hold' или 'stake'
  multiplier DECIMAL(3, 1) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица стейков
CREATE TABLE stakes (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT REFERENCES users(wallet_address),
  amount DECIMAL(18, 9),
  tier TEXT, -- 'B', 'BB', 'BBB', 'A', 'AA', 'AAA'
  multiplier DECIMAL(3, 1),
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_payouts_wallet ON payouts(wallet_address);
CREATE INDEX idx_stakes_wallet ON stakes(wallet_address);
CREATE INDEX idx_stakes_active ON stakes(wallet_address, claimed) WHERE claimed = FALSE;
```

4. Получи API ключи из Settings → API

---

### 3️⃣ Интеграция БД в код

Установи Supabase клиент:
```bash
cd app
npm install @supabase/supabase-js
```

Создай `app/src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

Добавь переменные в Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=твой_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=твой_ключ
SUPABASE_SERVICE_ROLE_KEY=твой_service_key (для API routes)
```

---

### 4️⃣ Деплой смарт-контракта

```bash
cd bond-coin
anchor build
anchor deploy --provider.cluster mainnet
```

Сохрани Program ID для использования в скрипте распределения.

---

### 5️⃣ Настройка Cron для распределения наград

Vercel автоматически запустит `/api/cron/distribute` по расписанию из `vercel.json`.

Убедись, что в переменных окружениях есть:
- `CRON_SECRET` - для защиты endpoint
- `SOLANA_PRIVATE_KEY` - приватный ключ кошелька для отправки SOL
- `PROGRAM_ID` - ID твоего контракта

---

## 🔐 Безопасность

1. **Никогда не коммить приватные ключи** в Git
2. Используй **Vercel Environment Variables** для секретов
3. **CRON_SECRET** должен быть случайной строкой
4. Для production используй **Service Role Key** от Supabase (не Anon Key)

---

## 📊 Мониторинг

- **Vercel Dashboard** - логи деплоя и ошибки
- **Supabase Dashboard** - данные БД
- **Solana Explorer** - транзакции контракта

---

## 💰 Стоимость

- **Vercel**: Бесплатно до 100GB трафика
- **Supabase**: Бесплатно до 500MB БД
- **Solana**: ~0.000005 SOL за транзакцию
- **Helius RPC**: Зависит от плана

---

## 🐛 Troubleshooting

### Ошибка "Module not found"
```bash
cd app
npm install
```

### Ошибка подключения к БД
Проверь переменные окружения в Vercel Dashboard

### Cron не запускается
Проверь формат расписания в `vercel.json` (cron syntax)

---

## ✅ Чеклист перед запуском

- [ ] Фронтенд задеплоен на Vercel
- [ ] Переменные окружения настроены
- [ ] БД создана и таблицы готовы
- [ ] Контракт задеплоен на Mainnet
- [ ] Program ID сохранен
- [ ] Cron настроен
- [ ] Приватный ключ для выплат настроен
- [ ] Тестирование на devnet пройдено

---

**Готов помочь с настройкой любого шага!** 🚀

