import { useState, memo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	type Token,
	useSearchTokensQuery,
	recordTrade,
	type TradeData,
} from "../services/tokenService";
import { sdk } from "@farcaster/miniapp-sdk";
import { useDebounce } from "use-debounce";
import { DEFAULT_TOKENS } from "@/lib/constants";
import { toast } from "sonner";

const TokenList = memo(
	({
		tokens,
		selectedTokenAddress,
		isSwapping,
		onSelectToken,
	}: {
		tokens: Token[];
		selectedTokenAddress?: string;
		isSwapping: string | null;
		onSelectToken: (token: Token) => void;
	}) => {
		return (
			<div className="divide-y">
				{tokens.map((token) => (
					<div
						key={token.address}
						className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors ${
							selectedTokenAddress === token.address ? "bg-muted" : ""
						} ${
							isSwapping === token.address
								? "opacity-50 pointer-events-none"
								: ""
						}`}
						onClick={() => onSelectToken(token)}
						title="Click to swap 0.001 ETH for this token"
					>
						{token.icon_url ? (
							<img
								src={token.icon_url}
								alt={token.symbol}
								className="w-8 h-8 rounded-full"
							/>
						) : (
							<div className="w-8 h-8 rounded-full bg-muted-foreground/20 flex items-center justify-center">
								<span className="text-xs font-medium">
									{token.symbol.substring(0, 2)}
								</span>
							</div>
						)}
						<div className="flex-1 min-w-0">
							<div className="font-medium truncate">{token.name}</div>
							<div className="text-sm text-muted-foreground">
								{token.symbol}
							</div>
						</div>
						{isSwapping === token.address ? (
							<div className="text-sm text-muted-foreground">Swapping...</div>
						) : token.price ? (
							<div className="text-right">
								<div className="font-medium">
									${token.price.value.toFixed(2)}
								</div>
							</div>
						) : null}
					</div>
				))}
			</div>
		);
	},
);

// Container component that handles token fetching and state
const TokenListContainer = memo(
	({
		searchQuery,
		selectedTokenAddress,
		isSwapping,
		onSelectToken,
	}: {
		searchQuery: string;
		selectedTokenAddress?: string;
		isSwapping: string | null;
		onSelectToken: (token: Token) => void;
	}) => {
		// Use debounced search query for the API call
		const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

		// Search tokens based on query
		const searchTokensQuery = useSearchTokensQuery(debouncedSearchQuery);
		const {
			data: searchResults,
			isLoading: isSearchLoading,
			isError: isSearchError,
		} = useQuery(searchTokensQuery);

		// Determine which tokens to display
		const displayTokens = debouncedSearchQuery ? searchResults : DEFAULT_TOKENS;
		const isLoading = debouncedSearchQuery ? isSearchLoading : false;
		const isError = debouncedSearchQuery ? isSearchError : false;

		if (isLoading) {
			return <div className="p-4 text-center">Loading tokens...</div>;
		}

		if (isError) {
			return (
				<div className="p-4 text-center text-red-500">
					Error loading tokens. Please try again.
				</div>
			);
		}

		if (displayTokens?.length === 0) {
			return (
				<div className="p-4 text-center text-muted-foreground">
					No tokens found. Try a different search term.
				</div>
			);
		}

		return (
			<TokenList
				tokens={displayTokens || []}
				selectedTokenAddress={selectedTokenAddress}
				isSwapping={isSwapping}
				onSelectToken={onSelectToken}
			/>
		);
	},
);

interface TokenSwapProps {
	externalSelectedToken?: Token | null;
	onTokenSelect?: (token: Token | null) => void;
	isConnected?: boolean;
	onConnectionRequired?: () => void;
}

export function TokenSwap({
	externalSelectedToken,
	onTokenSelect,
	isConnected = true,
	onConnectionRequired,
}: TokenSwapProps = {}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedToken, setSelectedToken] = useState<Token | null>(
		externalSelectedToken || null,
	);
	const [isSwapping, setIsSwapping] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Handle external token selection
	useEffect(() => {
		if (externalSelectedToken) {
			setSelectedToken(externalSelectedToken);
		}
	}, [externalSelectedToken]);

	// Memoize the token selection handler to prevent unnecessary re-renders
	const handleSelectToken = useCallback(
		async (token: Token) => {
			// Check if wallet is connected before attempting swap
			if (!isConnected) {
				onConnectionRequired?.();
				return;
			}

			setError(null);
			setIsSwapping(token.address);

			try {
				// Convert token addresses to CAIP-19 format
				const sellToken = `eip155:8453/native`; // Native ETH on Base
				const buyToken = `eip155:42161/erc20:${token.address}`;

				// Default amount of ETH to swap (0.001 ETH)
				const sellAmount = (0.00265 * Math.pow(10, 18)).toString();

				const result = await sdk.actions.swapToken({
					sellToken,
					buyToken,
					sellAmount,
				});

				if (result.success) {
					toast(`Swap Successful!`);
					setSelectedToken(token);
					onTokenSelect?.(token);

					// Record trade with just fid and tx_hash
					if (result.swap.transactions && result.swap.transactions.length > 0) {
						try {
							const context = await sdk.context;
							const user = context.user;

							if (user) {
								const tradeData: TradeData = {
									fid: user.fid,
									tx_hash: result.swap.transactions[0],
									timestamp: new Date().toISOString(),
								};

								const recordResult = await recordTrade(tradeData);
								if (!recordResult.success) {
									console.warn("Failed to record trade:", recordResult.error);
								}
							}
						} catch (recordError) {
							console.warn("Error recording trade:", recordError);
						}
					}
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
		},
		[isConnected, onConnectionRequired, onTokenSelect],
	);

	return (
		<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
			<h2 className="text-2xl font-bold">Token Swap</h2>
			<p className="mb-6 text-muted-foreground">
				Click any token to swap for it
			</p>

			<div className="space-y-6">
				<div>
					<div className="flex justify-between items-center">
						<Label htmlFor="token-search">Search for a token</Label>
					</div>
					<div className="relative mt-1.5">
						<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
							<Search className="h-4 w-4 text-muted-foreground" />
						</div>
						<Input
							id="token-search"
							type="text"
							placeholder="Search by name or symbol..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="pl-10"
						/>
					</div>
				</div>

				<div className="border rounded-md overflow-hidden">
					<div className="max-h-64 overflow-y-auto">
						<TokenListContainer
							searchQuery={searchQuery}
							selectedTokenAddress={selectedToken?.address}
							isSwapping={isSwapping}
							onSelectToken={handleSelectToken}
						/>{" "}
					</div>
				</div>

				{error && (
					<div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
						{error}
					</div>
				)}
			</div>
		</div>
	);
}
