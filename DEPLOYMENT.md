# Деплой Bond Coin

## Архитектура

### 1. Фронтенд (Next.js)
- **Платформа:** Vercel (рекомендуется) или Netlify
- **Что деплоить:** папка `app/`
- **Особенности:** Статический сайт + API routes для некоторых функций

### 2. Смарт-контракт (Anchor)
- **Платформа:** Solana Mainnet
- **Что деплоить:** папка `programs/bond-staking/`
- **Команда:** `anchor deploy --provider.cluster mainnet`

### 3. Скрипт распределения наград
- **Платформа:** Vercel Cron Jobs, Railway, или отдельный сервер
- **Что деплоить:** `scripts/distribute-rewards.ts`
- **Частота:** Ежедневно (cron)

### 4. База данных для профилей (опционально)
- **Варианты:**
  - **Vercel Postgres** (простой, интегрирован с Vercel)
  - **Supabase** (бесплатный tier, PostgreSQL)
  - **MongoDB Atlas** (бесплатный tier)
  - **PlanetScale** (бесплатный tier, MySQL)

## Пошаговый план деплоя

### Шаг 1: Деплой фронтенда на Vercel

1. Установи Vercel CLI:
```bash
npm i -g vercel
```

2. В папке `app/`:
```bash
cd app
vercel
```

3. Настрой переменные окружения в Vercel Dashboard:
   - `NEXT_PUBLIC_SOLANA_RPC` - твой Helius RPC
   - `NEXT_PUBLIC_TOKEN_MINT` - адрес токена (опционально, можно в коде)

### Шаг 2: Деплой смарт-контракта

1. Настрой `Anchor.toml` для mainnet
2. Деплой:
```bash
anchor build
anchor deploy --provider.cluster mainnet
```

3. Сохрани Program ID для использования в скрипте

### Шаг 3: Настройка профилей пользователей

**Вариант A: Только localStorage (текущий)**
- ✅ Просто
- ❌ Данные только в браузере пользователя
- ❌ Нет истории на разных устройствах

**Вариант B: Бэкенд + БД (рекомендуется)**
- ✅ Данные доступны везде
- ✅ История выплат
- ✅ Лидерборд с реальными данными

**Что нужно добавить:**
1. API routes в Next.js (`app/src/pages/api/`)
2. База данных (Supabase/Vercel Postgres)
3. Модели данных:
   - `users` (wallet_address, total_earned, total_staked, etc.)
   - `payouts` (wallet_address, amount, date, type)
   - `stakes` (wallet_address, amount, tier, start_date, end_date)

### Шаг 4: Скрипт распределения наград

**Вариант A: Vercel Cron Jobs**
1. Создай API route: `app/src/pages/api/cron/distribute.ts`
2. Настрой в `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/distribute",
    "schedule": "0 0 * * *"
  }]
}
```

**Вариант B: Отдельный сервер (Railway/Render)**
1. Создай отдельный Node.js проект
2. Запусти скрипт через cron или node-cron

## Что нужно доработать для реальных профилей

### 1. API для профилей
Создать `app/src/pages/api/profile/[wallet].ts`:
- Получение данных профиля
- История выплат
- Активные стейки

### 2. Интеграция с контрактом
- Чтение стейков из контракта
- Проверка балансов
- История транзакций

### 3. База данных
- Таблица пользователей
- Таблица выплат
- Таблица стейков

## Рекомендации

1. **Начни с Vercel для фронтенда** - это самый простой вариант
2. **Для профилей используй Supabase** - бесплатный tier, легко интегрируется
3. **Скрипт распределения** - можно начать с Vercel Cron, потом перенести на отдельный сервер если нужно

## Минимальный стек для запуска

- ✅ Vercel (фронтенд)
- ✅ Solana Mainnet (контракт)
- ✅ Supabase (БД для профилей)
- ✅ Vercel Cron (скрипт распределения)

Хочешь, чтобы я помог настроить какой-то конкретный шаг?

