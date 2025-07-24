import { TransactionReceipt, Log } from "viem";

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE =
	"0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

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
	tokenOutDecimals: number = 18, // Default token decimals
): SwapAmounts | null {
	try {
		const transferLogs = receipt.logs.filter(
			(log: Log) =>
				log.topics[0] === TRANSFER_EVENT_SIGNATURE && log.topics.length >= 3,
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

// Parse swap amounts from a cross-chain transaction
export async function parseSwapAmountsFromCrossChainReceipt(
	receipt: TransactionReceipt,
	chainId: number,
	userAddress: string,
	tokenInAddress: string,
	tokenOutAddress: string,
	tokenInDecimals: number = 6,
	tokenOutDecimals: number = 18,
): Promise<SwapAmounts | null> {
	try {
		// Map chain-specific USDC addresses
		const chainSpecificTokenIn = getChainSpecificUSDCAddress(
			chainId,
			tokenInAddress,
		);

		// Use the same parsing logic but with chain-specific token addresses
		return parseSwapAmountsFromReceipt(
			receipt,
			userAddress,
			chainSpecificTokenIn,
			tokenOutAddress,
			tokenInDecimals,
			tokenOutDecimals,
		);
	} catch (error) {
		console.error("Error parsing cross-chain swap amounts:", error);
		return null;
	}
}

// Get the correct USDC address for the chain
function getChainSpecificUSDCAddress(
	chainId: number,
	arbitrumUSDCAddress: string,
): string {
	// USDC addresses by chain
	const USDC_ADDRESSES = {
		1: "0xA0b86a33E6441227a5f1F3AeAA2A04D9cdB6d59b", // Ethereum
		8453: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // Base
		42161: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", // Arbitrum
	} as const;

	return (
		USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES] ||
		arbitrumUSDCAddress
	);
}
