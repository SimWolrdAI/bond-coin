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

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SOLANA_RPC` (optional, defaults to Helius)

