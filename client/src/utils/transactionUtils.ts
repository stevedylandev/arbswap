import { TransactionReceipt, Log } from "viem";

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

interface SwapAmounts {
  amountIn: bigint;
  amountOut: bigint;
  tokenInDecimals: number;
  tokenOutDecimals: number;
}

export function parseSwapAmountsFromReceipt(
  receipt: TransactionReceipt,
  userAddress: string,
  tokenInAddress: string,
  tokenOutAddress: string,
  tokenInDecimals: number = 6, // USDC decimals
  tokenOutDecimals: number = 18 // Default token decimals
): SwapAmounts | null {
  try {
    const transferLogs = receipt.logs.filter(
      (log: Log) => 
        log.topics[0] === TRANSFER_EVENT_SIGNATURE &&
        log.topics.length >= 3
    );

    let amountIn = BigInt(0);
    let amountOut = BigInt(0);

    for (const log of transferLogs) {
      const fromAddress = `0x${log.topics[1]?.slice(26)}`.toLowerCase();
      const toAddress = `0x${log.topics[2]?.slice(26)}`.toLowerCase();
      const amount = BigInt(log.data);

      // Check if this is a transfer from the user (token in)
      if (
        fromAddress === userAddress.toLowerCase() &&
        log.address?.toLowerCase() === tokenInAddress.toLowerCase()
      ) {
        amountIn = amount;
      }

      // Check if this is a transfer to the user (token out)
      if (
        toAddress === userAddress.toLowerCase() &&
        log.address?.toLowerCase() === tokenOutAddress.toLowerCase()
      ) {
        amountOut = amount;
      }
    }

    if (amountIn > 0 || amountOut > 0) {
      return {
        amountIn,
        amountOut,
        tokenInDecimals,
        tokenOutDecimals,
      };
    }

    return null;
  } catch (error) {
    console.error("Error parsing swap amounts from receipt:", error);
    return null;
  }
}

export function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / Math.pow(10, decimals);
}