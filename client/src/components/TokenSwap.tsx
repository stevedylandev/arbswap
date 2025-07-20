import { useState, memo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { type Token, useSearchTokensQuery, usePopularTokensQuery } from "../services/tokenService";
import { sdk } from "@farcaster/miniapp-sdk";
import { useDebounce } from "use-debounce";

// Memoized component to prevent unnecessary re-renders
const TokenList = memo(({ 
	tokens, 
	selectedTokenAddress, 
	onSelectToken 
}: { 
	tokens: Token[], 
	selectedTokenAddress?: string,
	onSelectToken: (token: Token) => void 
}) => {
	return (
		<div className="divide-y">
			{tokens.map((token) => (
				<div
					key={token.address}
					className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-muted transition-colors ${
						selectedTokenAddress === token.address
							? "bg-muted"
							: ""
					}`}
					onClick={() => onSelectToken(token)}
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
					{token.price && (
						<div className="text-right">
							<div className="font-medium">
								${token.price.value.toFixed(2)}
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
});

// Container component that handles token fetching and state
const TokenListContainer = memo(({
	searchQuery,
	selectedTokenAddress,
	onSelectToken
}: {
	searchQuery: string,
	selectedTokenAddress?: string,
	onSelectToken: (token: Token) => void
}) => {
	// Use debounced search query for the API call
	const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
	
	// Fetch popular tokens to show when no search query is entered
	const popularTokensQuery = usePopularTokensQuery();
	const { data: popularTokens, isLoading: isPopularLoading, isError: isPopularError } = useQuery(popularTokensQuery);
	
	// Search tokens based on query
	const searchTokensQuery = useSearchTokensQuery(debouncedSearchQuery);
	const { data: searchResults, isLoading: isSearchLoading, isError: isSearchError } = useQuery(searchTokensQuery);
	
	// Determine which tokens to display
	const displayTokens = debouncedSearchQuery ? searchResults : popularTokens;
	const isLoading = debouncedSearchQuery ? isSearchLoading : isPopularLoading;
	const isError = debouncedSearchQuery ? isSearchError : isPopularError;

	if (isLoading) {
		return <div className="p-4 text-center">Loading tokens...</div>;
	}

	if (isError) {
		return <div className="p-4 text-center text-red-500">Error loading tokens. Please try again.</div>;
	}

	if (displayTokens?.length === 0) {
		return (
			<div className="p-4 text-center text-muted-foreground">
				{debouncedSearchQuery 
					? "No tokens found. Try a different search term." 
					: "No popular tokens available."}
			</div>
		);
	}

	return (
		<TokenList 
			tokens={displayTokens || []} 
			selectedTokenAddress={selectedTokenAddress}
			onSelectToken={onSelectToken}
		/>
	);
});

interface TokenSwapProps {
	externalSelectedToken?: Token | null;
	onTokenSelect?: (token: Token | null) => void;
}

export function TokenSwap({ externalSelectedToken, onTokenSelect }: TokenSwapProps = {}) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedToken, setSelectedToken] = useState<Token | null>(externalSelectedToken || null);
	const [isSwapping, setIsSwapping] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);
	
	// USDC on Arbitrum
	const USDC_ADDRESS = "0xaf88d065e77c8cC2239327C5EDb3A432268e5831";
	const USDC_DECIMALS = 6;

	// Handle external token selection
	useEffect(() => {
		if (externalSelectedToken) {
			setSelectedToken(externalSelectedToken);
		}
	}, [externalSelectedToken]);

	// Memoize the token selection handler to prevent unnecessary re-renders
	const handleSelectToken = useCallback((token: Token) => {
		setSelectedToken(token);
		onTokenSelect?.(token);
	}, [onTokenSelect]);

	const handleSwap = async () => {
		if (!selectedToken) {
			setError("Please select a token");
			return;
		}

		setError(null);
		setSuccessMessage(null);
		setIsSwapping(true);

		try {
			// Convert token addresses to CAIP-19 format
			// Assuming Arbitrum chain ID is 42161
			const sellToken = `eip155:42161/erc20:${USDC_ADDRESS}`;
			const buyToken = `eip155:42161/erc20:${selectedToken.address}`;

			// Default amount of USDC to swap (1 USDC)
			const sellAmount = (1 * Math.pow(10, USDC_DECIMALS)).toString();

			await sdk.actions.swapToken({
				sellToken,
				buyToken,
				sellAmount,
			});

			// if (!result.success) {
			// 	setError(`Swap failed: ${result.error?.message || result.reason}`);
			// } else {
			// 	setSuccessMessage(
			// 		`Swap successful! Transaction(s): ${result.swap.transactions.join(", ")}`,
			// 	);
			// 	console.log("Swap successful:", result.swap.transactions);
			// }
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to swap tokens");
		} finally {
			setIsSwapping(false);
		}
	};

	return (
		<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
			<h2 className="text-2xl font-bold mb-6">Token Search</h2>

			<div className="space-y-6">
				<div>
					<div className="flex justify-between items-center">
						<Label htmlFor="token-search">Search for a token</Label>
						{!searchQuery && (
							<span className="text-xs text-muted-foreground">Showing popular tokens</span>
						)}
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
							onSelectToken={handleSelectToken}
						/>
					</div>
				</div>

				{error && <div className="text-red-500 text-sm">{error}</div>}
				{successMessage && (
					<div className="text-green-500 text-sm">{successMessage}</div>
				)}
				
				<Button
					className="w-full"
					onClick={handleSwap}
					disabled={isSwapping || !selectedToken}
				>
					{isSwapping ? "Swapping..." : `Swap 1 USDC for ${selectedToken?.symbol || 'token'}`}
				</Button>
			</div>
		</div>
	);
}
