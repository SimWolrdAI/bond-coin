import type { AppProps } from "next/app";
import Head from "next/head";
import { useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { RPC_ENDPOINT } from "@/utils/token";

import "@solana/wallet-adapter-react-ui/styles.css";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  const endpoint = useMemo(() => RPC_ENDPOINT, []);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <>
      <Head>
        <title>Bond Coin - Tokenized Bonds on Solana</title>
        <meta name="description" content="Bond Coin - Earn SOL from trading fees. Stake tokens for multiplied payouts." />
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}
