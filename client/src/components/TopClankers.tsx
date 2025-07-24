import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { sdk } from "@farcaster/miniapp-sdk";
import { useState, useEffect } from "react";
import { Skeleton } from "./ui/skeleton";
import { recordTrade, type TradeData } from "../services/tokenService";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import {
	parseSwapAmountsFromCrossChainReceipt,
	formatTokenAmount,
} from "../utils/transactionUtils";
import {
	getTransactionReceipt,
	type TransactionWithChain,
} from "../utils/crossChainUtils";

interface ClankerToken {
	address: string;
	name: string;
	description: string;
	imageUrl: string | null;
	count_holders: number;
	holders: Array<{
		fid: number;
		username: string;
		pfpUrl: string;
		quotientScore: number;
	}>;
}

interface ClankerResponse {
	tokens: ClankerToken[];
	total_tokens: number;
	queried_fids: number;
	chain: string;
}

const fetchTopClankers = async (): Promise<ClankerResponse> => {
	const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/tokens/3`);
	if (!response.ok) {
		throw new Error("Failed to fetch clankers");
	}
	return response.json();
};

interface TopClankersProps {
	onTokenSelect?: (token: ClankerToken) => void;
	isConnected?: boolean;
	onConnectionRequired?: () => void;
}

export function TopClankers({
	onTokenSelect,
	isConnected = true,
	onConnectionRequired,
}: TopClankersProps = {}) {
	const [isSwapping, setIsSwapping] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pendingSwap, setPendingSwap] = useState<{
		token: ClankerToken;
		txHash: string;
	} | null>(null);
	const { address } = useAccount();

	const { data, isLoading, isError } = useQuery({
		queryKey: ["topClankers"],
		queryFn: fetchTopClankers,
		refetchInterval: 30000,
	});

	// USDC on Arbitrum
	const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
	const USDC_DECIMALS = 6;

	// Handle transaction monitoring (try Base first, then Arbitrum)
	useEffect(() => {
		if (pendingSwap && address) {
			const recordTradeWithActualAmounts = async (
				transaction: TransactionWithChain,
			) => {
				try {
					const context = await sdk.context;
					const user = context.user;

					if (!user) return;

					const swapAmounts = await parseSwapAmountsFromCrossChainReceipt(
						transaction.receipt,
						transaction.chainId,
						address,
						USDC_ADDRESS,
						pendingSwap.token.address,
						USDC_DECIMALS,
						18, // Assuming 18 decimals for clanker tokens
					);

					// Always record trade, even if parsing fails
					const tradeData: TradeData = {
						fid: user.fid,
						wallet_address: address,
						tx_hash: transaction.hash,
						token_address_out: pendingSwap.token.address,
						token_address_in: USDC_ADDRESS,
						amount_in: swapAmounts ? formatTokenAmount(swapAmounts.amountIn, USDC_DECIMALS) : 1, // Fallback to 1 USDC
						amount_out: swapAmounts ? formatTokenAmount(swapAmounts.amountOut, 18) : 0, // Fallback to 0 if unknown
						timestamp: new Date().toISOString(),
						chain: transaction.chainId,
					};

					const recordResult = await recordTrade(tradeData);
					if (!recordResult.success) {
						console.warn("Failed to record trade:", recordResult.error);
					} else {
						console.log(
							swapAmounts ? "Trade recorded successfully with actual amounts:" : "Trade recorded with fallback amounts:",
							tradeData,
						);
					}
				} catch (error) {
					console.warn("Error recording trade with actual amounts:", error);
				} finally {
					// Clear pending swap after processing
					setPendingSwap(null);
				}
			};

			// Try to get transaction receipt (Base first, then Arbitrum)
			getTransactionReceipt(pendingSwap.txHash, recordTradeWithActualAmounts);
		}
	}, [pendingSwap, address, USDC_ADDRESS, USDC_DECIMALS]);

	const handleTokenClick = async (token: ClankerToken) => {
		// Check if wallet is connected before attempting swap
		if (!isConnected) {
			onConnectionRequired?.();
			return;
		}

		setError(null);
		setIsSwapping(token.address);

		try {
			// Convert token addresses to CAIP-19 format
			const sellToken = `eip155:8453/erc20:${USDC_ADDRESS}`;
			const buyToken = `eip155:42161/erc20:${token.address}`;

			// Default amount of USDC to swap (1 USDC)
			const sellAmount = (1 * Math.pow(10, USDC_DECIMALS)).toString();

			const result = await sdk.actions.swapToken({
				sellToken,
				buyToken,
				sellAmount,
			});

			if (result.success) {
				toast(`Swap successful!`);

				// Monitor the single transaction (try Base first, then Arbitrum)
				if (result.swap.transactions && result.swap.transactions.length > 0) {
					setPendingSwap({
						token,
						txHash: result.swap.transactions[0], // Always just one transaction
					});
				}

				// Call the original onTokenSelect if provided
				onTokenSelect?.(token);
			} else {
				const errorMessage =
					result.error?.message || `Swap failed: ${result.reason}`;
				toast(`Swap failed: ${errorMessage}`);
				setError(errorMessage);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to swap tokens";
			toast(`Swap failed: ${errorMessage}`);
			setError(errorMessage);
		} finally {
			setIsSwapping(null);
		}
	};

	if (isLoading) {
		return (
			<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
				<h2 className="text-2xl font-bold">Top Clankers on Arbitrum</h2>
				<p className="text-sm text-muted-foreground mb-6">
					The current top Clankers based on your mutual follows on Farcaster.
					Click any token to swap for it!
				</p>

				<div className="space-y-4">
					{[1, 2, 3].map((index) => (
						<div key={index} className="p-4 border rounded-lg">
							<div className="flex items-start gap-3">
								<div className="flex-shrink-0">
									<Skeleton className="w-10 h-10 rounded-full" />
								</div>
								<div className="flex-1 min-w-0">
									<div className="flex items-center justify-between">
										<Skeleton className="h-6 w-32" />
										<Skeleton className="h-4 w-4" />
									</div>
									<Skeleton className="h-4 w-full mt-2" />
									<Skeleton className="h-4 w-3/4 mt-1" />
									<div className="flex -space-x-2 mt-2">
										{[1, 2, 3, 4, 5].map((i) => (
											<Skeleton key={i} className="w-6 h-6 rounded-full" />
										))}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
				<h2 className="text-2xl font-bold mb-6">Clankers on Arbitrum</h2>
				<div className="text-center text-red-500">Error loading clankers</div>
			</div>
		);
	}

	const topThree = data?.tokens.slice(0, 3) || [];

	return (
		<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
			<h2 className="text-2xl font-bold">Top Clankers on Arbitrum</h2>
			<p className="text-sm text-muted-foreground mb-6">
				The current top Clankers based on your mutual follows on Farcaster.
				Click any token to swap for it!
			</p>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
					{error}
				</div>
			)}

			<div className="space-y-4">
				{topThree.map((token, index) => (
					<div
						key={token.address}
						className={`p-4 border rounded-lg hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group ${
							isSwapping === token.address
								? "opacity-50 pointer-events-none"
								: ""
						}`}
						onClick={() => handleTokenClick(token)}
						title="Click to swap for this token"
					>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
									#{index + 1}
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between">
									<div className="font-semibold text-lg truncate">
										{token.name}
									</div>
									{isSwapping === token.address ? (
										<div className="text-sm text-muted-foreground">
											Swapping...
										</div>
									) : (
										<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
									)}
								</div>
								<div className="text-sm text-muted-foreground mb-2">
									{token.description === "nan" || !token.description
										? "No description provided"
										: token.description.length > 100
											? token.description.substring(0, 100) + "..."
											: token.description}
								</div>
								{token.holders.length > 0 && (
									<div className="flex -space-x-2 mt-2">
										{token.holders.slice(0, 5).map((holder) => (
											<img
												key={holder.fid}
												src={holder.pfpUrl}
												alt={holder.username}
												className="w-6 h-6 rounded-full border-2 border-background"
												title={holder.username}
											/>
										))}
										{token.holders.length > 5 && (
											<div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs">
												+{token.holders.length - 5}
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
