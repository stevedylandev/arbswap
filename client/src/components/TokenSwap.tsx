import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { type Token, useTokensQuery } from "../services/tokenService";
import { sdk } from "@farcaster/miniapp-sdk";

export function TokenSwap() {
	const [amount, setAmount] = useState("");
	const [slippage, setSlippage] = useState("1");
	const [fromToken, setFromToken] = useState<Token | null>(null);
	const [toToken, setToToken] = useState<Token | null>(null);
	const [isSwapping, setIsSwapping] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const tokensQuery = useTokensQuery();
	const { data: tokens, isLoading, isError } = useQuery(tokensQuery);

	const handleSwap = async () => {
		if (!fromToken || !toToken || !amount) {
			setError("Please select tokens and enter an amount");
			return;
		}

		setError(null);
		setSuccessMessage(null);
		setIsSwapping(true);

		try {
			// Convert token addresses to CAIP-19 format
			// Assuming Arbitrum chain ID is 42161
			const sellToken = `eip155:42161/erc20:${fromToken.address}`;
			const buyToken = `eip155:42161/erc20:${toToken.address}`;

			// Convert amount based on token decimals
			const sellAmount = (
				parseFloat(amount) * Math.pow(10, fromToken.decimals)
			).toString();

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

	const handleSwitchTokens = () => {
		const temp = fromToken;
		setFromToken(toToken);
		setToToken(temp);
	};

	if (isLoading) {
		return <div className="flex justify-center p-8">Loading tokens...</div>;
	}

	if (isError) {
		return (
			<div className="text-red-500 p-8">
				Error loading tokens. Please try again later.
			</div>
		);
	}

	return (
		<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
			<h2 className="text-2xl font-bold mb-6">Swap Tokens</h2>

			<div className="space-y-4">
				<div>
					<Label htmlFor="from-token">From</Label>
					<div className="flex gap-2 mt-1.5">
						<Select
							value={fromToken?.address}
							onValueChange={(value) => {
								const selected =
									tokens?.find((t) => t.address === value) || null;
								setFromToken(selected);
							}}
						>
							<SelectTrigger className="flex-1">
								<SelectValue placeholder="Select token" />
							</SelectTrigger>
							<SelectContent>
								{tokens?.map((token) => (
									<SelectItem key={token.address} value={token.address}>
										<div className="flex items-center gap-2">
											{token.icon_url && (
												<img
													src={token.icon_url}
													alt={token.symbol}
													className="w-5 h-5 rounded-full"
												/>
											)}
											<span>{token.symbol}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>

						<Input
							id="amount"
							type="number"
							placeholder="0.0"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							className="flex-1"
						/>
					</div>
				</div>
				<div className="flex justify-center">
					<Button
						variant="ghost"
						size="icon"
						onClick={handleSwitchTokens}
						disabled={!fromToken || !toToken}
					>
						<ArrowDownUp className="h-4 w-4" />
					</Button>
				</div>
				<div>
					<Label htmlFor="to-token">To</Label>
					<div className="flex gap-2 mt-1.5">
						<Select
							value={toToken?.address}
							onValueChange={(value) => {
								const selected =
									tokens?.find((t) => t.address === value) || null;
								setToToken(selected);
							}}
						>
							<SelectTrigger className="flex-1">
								<SelectValue placeholder="Select token" />
							</SelectTrigger>
							<SelectContent>
								{tokens?.map((token) => (
									<SelectItem key={token.address} value={token.address}>
										<div className="flex items-center gap-2">
											{token.icon_url && (
												<img
													src={token.icon_url}
													alt={token.symbol}
													className="w-5 h-5 rounded-full"
												/>
											)}
											<span>{token.symbol}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<div>
					<Label htmlFor="slippage">Slippage Tolerance (%)</Label>
					<Input
						id="slippage"
						type="number"
						placeholder="1.0"
						value={slippage}
						onChange={(e) => setSlippage(e.target.value)}
						className="mt-1.5"
					/>
				</div>
				{error && <div className="text-red-500 text-sm">{error}</div>}
				{successMessage && (
					<div className="text-green-500 text-sm">{successMessage}</div>
				)}
				<Button
					className="w-full"
					onClick={handleSwap}
					disabled={isSwapping || !fromToken || !toToken || !amount}
				>
					{isSwapping ? "Swapping..." : "Swap"}
				</Button>{" "}
			</div>
		</div>
	);
}
