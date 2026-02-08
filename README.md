# Bond Coin

Tokenized Bonds on Solana

## Project Structure

```
bond-coin/
├── app/                    # Next.js application (Root Directory for Vercel)
│   ├── src/
│   │   ├── pages/         # Next.js pages
│   │   │   ├── _app.tsx
│   │   │   ├── index.tsx
│   │   │   └── app.tsx
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   ├── next.config.js
│   └── tsconfig.json
└── README.md
```

## Vercel Deployment Settings

- **Root Directory:** `app`
- **Framework Preset:** Next.js
- **Build Command:** (auto-detected)
- **Output Directory:** (auto-detected)

## Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL` = `https://phsawyidxklhefrhmflx.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `sb_publishable_qQteWv86HFSHmae5XL9HuA_KEIxrDle`
- `NEXT_PUBLIC_SOLANA_RPC` = `https://mainnet.helius-rpc.com/?api-key=a4a9e6a6-e090-421c-9120-f52e42361647` (optional, but recommended)

