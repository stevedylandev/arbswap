import { createPublicClient, http, type TransactionReceipt } from "viem";
import { arbitrum, base } from "viem/chains";

// Create clients for different chains
const arbitrumClient = createPublicClient({
	chain: arbitrum,
	transport: http(),
});

const baseClient = createPublicClient({
	chain: base,
	transport: http(),
});

export interface TransactionWithChain {
	hash: string;
	chainId: number;
	receipt: TransactionReceipt;
}

// Wait for transaction receipt on a specific chain with shorter timeout
async function waitForTransactionReceiptOnChain(
	hash: string,
	chainId: number,
	timeout = 30000, // 30 seconds for faster fallback
): Promise<TransactionReceipt | null> {
	const client = chainId === base.id ? baseClient : arbitrumClient;

	try {
		const receipt = await client.waitForTransactionReceipt({
			hash: hash as `0x${string}`,
			timeout,
		});
		return receipt;
	} catch (error) {
		// Don't log errors here since we expect some to fail
		return null;
	}
}

// Try to get transaction receipt from Base first, then Arbitrum
export async function getTransactionReceipt(
	txHash: string,
	onReceiptReceived: (transaction: TransactionWithChain) => void,
): Promise<void> {
	// Try Base first (assuming most cross-chain swaps start there)
	const baseReceipt = await waitForTransactionReceiptOnChain(txHash, base.id);

	if (baseReceipt) {
		onReceiptReceived({
			hash: txHash,
			chainId: base.id,
			receipt: baseReceipt,
		});
		return;
	}

	// If not found on Base, try Arbitrum
	const arbReceipt = await waitForTransactionReceiptOnChain(
		txHash,
		arbitrum.id,
	);

	if (arbReceipt) {
		onReceiptReceived({
			hash: txHash,
			chainId: arbitrum.id,
			receipt: arbReceipt,
		});
		return;
	}

	console.warn(`Transaction ${txHash} not found on Base or Arbitrum`);
}

// Get the appropriate client for a chain
export function getViemClient(chainId: number) {
	return chainId === base.id ? baseClient : arbitrumClient;
}
