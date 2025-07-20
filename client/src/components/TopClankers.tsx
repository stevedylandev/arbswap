import { useQuery } from "@tanstack/react-query";
import { Users, ArrowRight } from "lucide-react";

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
	const response = await fetch("http://localhost:8787/tokens/6023");
	if (!response.ok) {
		throw new Error("Failed to fetch clankers");
	}
	return response.json();
};

interface TopClankersProps {
	onTokenSelect?: (token: ClankerToken) => void;
}

export function TopClankers({ onTokenSelect }: TopClankersProps = {}) {
	const { data, isLoading, isError } = useQuery({
		queryKey: ["topClankers"],
		queryFn: fetchTopClankers,
		refetchInterval: 30000,
	});

	if (isLoading) {
		return (
			<div className="w-full max-w-md mx-auto p-6 bg-background border rounded-lg shadow-sm">
				<h2 className="text-2xl font-bold mb-6">Clankers on Arbitrum</h2>
				<div className="text-center text-muted-foreground">
					Loading clankers...
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
			<h2 className="text-2xl font-bold">Top 3 Clankers on ARB</h2>
			<p className="text-sm text-muted-foreground mb-6">
				Click any token to swap USDC for it
			</p>

			<div className="space-y-4">
				{topThree.map((token, index) => (
					<div
						key={token.address}
						className="p-4 border rounded-lg hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group"
						onClick={() => onTokenSelect?.(token)}
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
									<ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
								</div>
								<div className="text-sm text-muted-foreground mb-2">
									{token.description === "nan" || !token.description
										? "No description provided"
										: token.description.length > 100
											? token.description.substring(0, 100) + "..."
											: token.description}
								</div>
								<div className="flex items-center gap-2 text-sm mb-2">
									<Users className="h-4 w-4" />
									<span className="font-medium">
										{token.count_holders} holders
									</span>
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
