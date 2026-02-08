import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";

// ===== TOKEN CONFIGURATION =====
// $BOND token contract address from Pump.fun
export const TOKEN_MINT = new PublicKey("Djh5MhQJwbMfmdSSeXz3FmE3VZpP9SW7q3aY7Wy3pump");

// RPC endpoint - using Helius for better performance
// Helius RPC format: https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_SOLANA_RPC || "https://mainnet.helius-rpc.com/?api-key=a4a9e6a6-e090-421c-9120-f52e42361647";

// Specialized APIs for token data
const PUMP_FUN_API = "https://frontend-api.pump.fun";

// Create connection dynamically to ensure it uses the correct RPC
function getConnection() {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

export interface TokenData {
  balance: number;
  decimals: number;
  supply: number;
  symbol?: string;
  name?: string;
}

/**
 * Get token balance for a wallet address
 */
export async function getTokenBalance(
  walletAddress: PublicKey,
  tokenMint: PublicKey = TOKEN_MINT
): Promise<{ balance: number; decimals: number }> {
  const conn = getConnection();
  try {
    // Get all token accounts for this wallet
    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(walletAddress, {
      mint: tokenMint,
    });

    if (tokenAccounts.value.length === 0) {
      // Try to get decimals from mint info, but don't fail if it doesn't work
      try {
        const mintInfo = await getTokenMintInfo(tokenMint);
        return { balance: 0, decimals: mintInfo.decimals };
      } catch (e) {
        // Default to 6 decimals for Pump.fun tokens
        return { balance: 0, decimals: 6 };
      }
    }

    // Sum all token account balances
    let totalBalance = 0;
    let decimals = 6; // default for Pump.fun tokens

    for (const account of tokenAccounts.value) {
      const parsedInfo = account.account.data.parsed.info;
      const balance = parsedInfo.tokenAmount.uiAmount || 0;
      totalBalance += balance;
      decimals = parsedInfo.tokenAmount.decimals || 6;
    }

    return { balance: totalBalance, decimals };
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return { balance: 0, decimals: 6 };
  }
}

/**
 * Get token mint info (supply, decimals, etc.)
 */
export async function getTokenMintInfo(tokenMint: PublicKey = TOKEN_MINT): Promise<{
  supply: number;
  decimals: number;
  symbol?: string;
  name?: string;
}> {
  const conn = getConnection();
  const mintAddress = tokenMint.toBase58();
  
  try {
    // Try Pump.fun API first (most reliable for Pump.fun tokens)
    try {
      const pumpResponse = await fetch(`${PUMP_FUN_API}/coins/${mintAddress}`);
      if (pumpResponse.ok) {
        const pumpData = await pumpResponse.json();
        console.log("Pump.fun data:", pumpData);
        
        const supply = pumpData.market_cap || pumpData.total_supply || 0;
        const decimals = pumpData.decimals || 6;
        
        return {
          supply,
          decimals,
          symbol: pumpData.symbol,
          name: pumpData.name,
        };
      }
    } catch (e) {
      console.log("Pump.fun API failed, trying RPC:", e);
    }
    
    // Try Pump.fun API
    try {
      const pumpResponse = await fetch(`${PUMP_FUN_API}/coins/${mintAddress}`);
      if (pumpResponse.ok) {
        const pumpData = await pumpResponse.json();
        console.log("Pump.fun data:", pumpData);
        
        const supply = pumpData.market_cap || pumpData.total_supply || 0;
        const decimals = pumpData.decimals || 6;
        
        return {
          supply,
          decimals,
          symbol: pumpData.symbol,
          name: pumpData.name,
        };
      }
    } catch (e) {
      console.log("Pump.fun API failed, trying direct RPC:", e);
    }
    
    // Fallback to direct RPC
    const accountInfo = await conn.getParsedAccountInfo(tokenMint);
    
    if (!accountInfo.value) {
      throw new Error(`Account ${mintAddress} does not exist`);
    }
    
    const parsed = accountInfo.value.data;
    if (parsed && "parsed" in parsed) {
      const parsedData = parsed.parsed.info;
      if (parsedData.mintAuthority || parsedData.supply !== undefined) {
        const supply = Number(parsedData.supply) / Math.pow(10, parsedData.decimals || 6);
        return {
          supply,
          decimals: parsedData.decimals || 6,
          symbol: undefined,
          name: undefined,
        };
      }
    }
    
    // Last resort: try getMint
    const mintInfo = await getMint(conn, tokenMint);
    const supply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
    console.log("Mint info - Supply:", supply, "Decimals:", mintInfo.decimals);

    return {
      supply,
      decimals: mintInfo.decimals,
      symbol: undefined,
      name: undefined,
    };
  } catch (error) {
    console.error("Error fetching token mint info:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Token address:", mintAddress);
    }
    throw error;
  }
}

/**
 * Format token amount with decimals
 */
export function formatTokenAmount(amount: number, decimals: number = 9): string {
  if (amount === 0) return "0";
  if (amount < 0.000001) return "<0.000001";
  
  // Format with appropriate decimal places
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals > 6 ? 6 : decimals,
  });
  
  return formatted;
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap === 0) return "$0";
  if (marketCap < 1000) return `$${marketCap.toFixed(2)}`;
  if (marketCap < 1000000) return `$${(marketCap / 1000).toFixed(2)}K`;
  if (marketCap < 1000000000) return `$${(marketCap / 1000000).toFixed(2)}M`;
  return `$${(marketCap / 1000000000).toFixed(2)}B`;
}

/**
 * Calculate percentage of supply held
 */
export function calculateSupplyPercentage(balance: number, totalSupply: number): number {
  if (totalSupply === 0) return 0;
  return (balance / totalSupply) * 100;
}

/**
 * Get top token holders (largest accounts)
 */
export interface TokenHolder {
  address: string;
  balance: number;
  formattedBalance: string;
  percentage: number;
}

export async function getTopTokenHolders(
  tokenMint: PublicKey = TOKEN_MINT,
  limit: number = 20
): Promise<TokenHolder[]> {
  const conn = getConnection();
  const mintAddress = tokenMint.toBase58();
  
  try {
    // First, get mint info to know decimals
    let decimals = 6; // Default for Pump.fun tokens
    let totalSupply = 0;
    
    try {
      const mintInfo = await getTokenMintInfo(tokenMint);
      decimals = mintInfo.decimals;
      totalSupply = mintInfo.supply;
    } catch (e) {
      console.warn("Could not get mint info, using defaults:", e);
    }
    
    // Try Helius RPC method getTokenLargestAccounts (if available)
    try {
      const rpcResponse = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getTokenLargestAccounts',
          params: [mintAddress, { commitment: 'confirmed' }],
        }),
      });
      
      if (rpcResponse.ok) {
        const rpcData = await rpcResponse.json();
        console.log("RPC getTokenLargestAccounts data:", rpcData);
        
        // Check for error first
        if (rpcData.error) {
          console.warn("RPC getTokenLargestAccounts error:", rpcData.error);
          throw new Error(rpcData.error.message || "RPC error");
        }
        
        if (rpcData.result && rpcData.result.value && Array.isArray(rpcData.result.value)) {
          const holders: TokenHolder[] = [];
          
          // Limit to avoid rate limits
          const accountsToProcess = rpcData.result.value.slice(0, limit);
          
          for (const account of accountsToProcess) {
            try {
              // account.amount is in raw format (with decimals), account.uiAmount is already divided
              const balance = account.uiAmount || (Number(account.amount) / Math.pow(10, decimals));
              
              if (balance > 0) {
                // Use token account address directly - no owner lookup to avoid rate limits
                holders.push({
                  address: account.address, // Token account address (not owner, but works for display)
                  balance,
                  formattedBalance: formatTokenAmount(balance, decimals),
                  percentage: totalSupply > 0 ? calculateSupplyPercentage(balance, totalSupply) : 0,
                });
              }
            } catch (e) {
              console.warn("Could not parse account:", account.address, e);
            }
          }
          
          if (holders.length > 0) {
            console.log("Returning", holders.length, "holders from RPC");
            return holders;
          }
        }
      }
    } catch (e) {
      console.log("RPC getTokenLargestAccounts failed, trying getParsedProgramAccounts:", e);
    }
    
    // Fallback: Use getParsedProgramAccounts with correct format
    try {
      const tokenProgramId = TOKEN_PROGRAM_ID;
      // For memcmp, Solana web3.js expects base58 string directly
      // The library will handle the conversion internally
      const mintBase58 = tokenMint.toBase58();
      
      console.log("Searching for token accounts with mint:", mintAddress);
      
      // Use direct RPC call with correct format for memcmp
      // memcmp bytes must be base58 string, but RPC might need it differently
      // Try using the mint address bytes as base58 string
      const mintBytes = tokenMint.toBytes();
      // Convert bytes array to base58 string using the PublicKey's built-in method
      // But we already have mintBase58, so use that
      // However, memcmp might need the raw bytes encoded as base58
      // Let's try passing the mint address directly as base58 string
      const rpcResponse = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getProgramAccounts',
          params: [
            tokenProgramId.toBase58(),
            {
              filters: [
                { dataSize: 165 },
                {
                  memcmp: {
                    offset: 0,
                    bytes: mintBase58, // Base58 string should work
                  },
                },
              ],
              encoding: 'jsonParsed',
              commitment: 'confirmed',
            },
          ],
        }),
      });
      
      console.log("getProgramAccounts request sent for mint:", mintBase58);
      
      if (!rpcResponse.ok) {
        throw new Error(`RPC request failed: ${rpcResponse.status}`);
      }
      
      const rpcData = await rpcResponse.json();
      console.log("getProgramAccounts response:", rpcData);
      
      if (rpcData.error) {
        console.error("getProgramAccounts error:", rpcData.error);
        // If memcmp fails, try without it - just get all token accounts and filter manually
        throw new Error(rpcData.error.message || "RPC error");
      }
      
      const accounts = rpcData.result || [];

      console.log("Found", accounts.length, "token accounts");

      const holders: TokenHolder[] = [];

      for (const account of accounts) {
        try {
          // Handle both parsed and direct account formats
          let parsedInfo;
          if (account.account && account.account.data && account.account.data.parsed) {
            parsedInfo = account.account.data.parsed.info;
          } else if (account.data && account.data.parsed) {
            parsedInfo = account.data.parsed.info;
          }
          
          if (!parsedInfo) continue;
          
          const balance = parsedInfo.tokenAmount?.uiAmount || parsedInfo.tokenAmount?.amount || 0;
          const ownerAddress = parsedInfo.owner;
          
          if (balance > 0 && ownerAddress) {
            const percentage = totalSupply > 0 ? calculateSupplyPercentage(balance, totalSupply) : 0;
            
            holders.push({
              address: ownerAddress,
              balance,
              formattedBalance: formatTokenAmount(balance, decimals),
              percentage,
            });
          }
        } catch (e) {
          console.warn("Could not parse account:", e);
        }
      }

      // Sort by balance and take top N
      holders.sort((a, b) => b.balance - a.balance);
      const topHolders = holders.slice(0, limit);

      if (topHolders.length > 0) {
        console.log("Returning", topHolders.length, "holders");
        return topHolders;
      }
    } catch (e) {
      console.warn("Could not get token accounts via RPC:", e);
    }
    
    // Fallback: return empty array if we can't get holders
    console.warn("Could not fetch holders, returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching top token holders:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
    // Don't throw, return empty array instead
    return [];
  }
}

/**
 * Get token statistics (total holders count, etc.)
 * Note: This is an approximation - getting exact holder count requires scanning all accounts
 */
export interface TokenStats {
  totalSupply: number;
  formattedSupply: string;
  topHoldersCount: number;
  estimatedHolders: number; // Approximation
  price?: number; // Price in SOL
  marketCap?: number; // Market cap in SOL
  formattedPrice?: string;
  formattedMarketCap?: string;
}

export async function getTokenStats(tokenMint: PublicKey = TOKEN_MINT): Promise<TokenStats> {
  const mintAddress = tokenMint.toBase58();
  
  try {
    // Use getTokenMintInfo which has fallbacks
    const mintInfo = await getTokenMintInfo(tokenMint);
    const decimals = mintInfo.decimals;
    const totalSupply = mintInfo.supply;

    // Try to get price and market cap from DexScreener (most reliable)
    let price: number | undefined;
    let marketCap: number | undefined;
    
    try {
      const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mintAddress}`);
      if (dexResponse.ok) {
        const dexData = await dexResponse.json();
        console.log("DexScreener data:", dexData);
        
        if (dexData.pairs && dexData.pairs.length > 0) {
          // Get the pair with highest liquidity
          const pair = dexData.pairs.sort((a: any, b: any) => 
            (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
          )[0];
          
          if (pair.priceUsd) {
            // Keep price in USD
            price = parseFloat(pair.priceUsd);
            
            if (pair.marketCap) {
              marketCap = parseFloat(pair.marketCap); // Market cap in USD
            } else if (price && totalSupply > 0) {
              marketCap = price * totalSupply; // Calculate from price * supply
            }
            
            console.log("Got price from DexScreener:", price, "Market Cap:", marketCap);
          }
        }
      }
    } catch (e) {
      console.log("DexScreener API failed:", e);
    }
    
    // Fallback: Try Pump.fun API
    if (!price || !marketCap) {
      try {
        const pumpResponse = await fetch(`${PUMP_FUN_API}/coins/${mintAddress}`);
        if (pumpResponse.ok) {
          const pumpData = await pumpResponse.json();
          // Pump.fun returns price in USD
          if (pumpData.usd_market_cap) {
            marketCap = pumpData.usd_market_cap; // Already in USD
            if (pumpData.market_cap && pumpData.market_cap > 0) {
              price = pumpData.usd_market_cap / pumpData.market_cap;
            }
          } else if (pumpData.price_usd) {
            price = pumpData.price_usd; // Already in USD
            if (price && totalSupply > 0) {
              marketCap = price * totalSupply;
            }
          }
        }
      } catch (e) {
        console.log("Could not fetch price from Pump.fun:", e);
      }
    }

    // Get top holders to estimate
    let topHolders: TokenHolder[] = [];
    try {
      topHolders = await getTopTokenHolders(tokenMint, 20);
    } catch (e) {
      console.warn("Could not fetch top holders, but continuing with stats:", e);
    }
    
    // Rough estimation: if top 20 hold less than 50% of supply, there are likely many holders
    // This is just a rough guess for display purposes
    const top20Percentage = topHolders.reduce((sum, h) => sum + h.percentage, 0);
    const estimatedHolders = top20Percentage < 50 ? 100 + Math.floor((50 - top20Percentage) * 10) : 50;

    return {
      totalSupply,
      formattedSupply: formatTokenAmount(totalSupply, decimals),
      topHoldersCount: topHolders.length,
      estimatedHolders,
      price,
      marketCap,
      formattedPrice: price ? `$${price.toFixed(6)}` : undefined,
      formattedMarketCap: marketCap ? formatMarketCap(marketCap) : undefined,
    };
  } catch (error) {
    console.error("Error fetching token stats:", error);
    // Return default stats instead of throwing
    return {
      totalSupply: 0,
      formattedSupply: "0",
      topHoldersCount: 0,
      estimatedHolders: 0,
    };
  }
}

