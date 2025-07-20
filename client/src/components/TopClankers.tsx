import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

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

export function TopClankers() {
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
			<h2 className="text-2xl font-bold">Clankers on Arbitrum</h2>
			<p className="mt-4 text-sm text-muted-foreground mb-6">
				Tokens that your mutual followers hold
			</p>

			<div className="space-y-4">
				{topThree.map((token, index) => (
					<div
						key={token.address}
						className="p-4 border rounded-lg hover:bg-muted transition-colors"
					>
						<div className="flex items-start gap-3">
							<div className="flex-shrink-0">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
									#{index + 1}
								</div>
							</div>
							<div className="flex-1 min-w-0">
								<div className="font-semibold text-lg truncate">
									{token.name}
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
