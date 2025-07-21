import { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { TokenSwap } from "./components/TokenSwap";
import { TopClankers } from "./components/TopClankers";
import type { Token } from "./services/tokenService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "./components/ui/button";

function App() {
	const { isConnected } = useAccount();
	const { connect, connectors } = useConnect();
	const [selectedToken, setSelectedToken] = useState<Token | null>(null);

	const handleClankerSelect = (clankerToken: {
		address: string;
		name: string;
		count_holders: number;
		imageUrl: string | null;
	}) => {
		// Convert clanker token to Token interface format
		const token: Token = {
			address: clankerToken.address,
			name: clankerToken.name,
			symbol: clankerToken.name
				.toUpperCase()
				.replace(/\s+/g, "")
				.substring(0, 6), // Generate symbol from name
			decimals: 18, // Default for most ERC-20 tokens
			type: "ERC-20",
			holders: clankerToken.count_holders,
			icon_url: clankerToken.imageUrl || undefined,
		};
		setSelectedToken(token);
	};

	return (
		<div className="max-w-4xl w-full mx-auto flex flex-col gap-6 items-center justify-center min-h-screen p-4">
			<h1 className="text-3xl font-bold">ArbSwap</h1>
			<p className="text-center text-muted-foreground mb-4">
				Swap tokens on Arbitrum using Farcaster
			</p>
			{isConnected && (
				<Tabs defaultValue="search" className="w-full">
					<TabsList className="w-full">
						<TabsTrigger value="search">Search</TabsTrigger>
						<TabsTrigger value="clankers">Clankers</TabsTrigger>
					</TabsList>
					<TabsContent value="search">
						<TokenSwap
							externalSelectedToken={selectedToken}
							onTokenSelect={setSelectedToken}
						/>
					</TabsContent>
					<TabsContent value="clankers">
						<TopClankers onTokenSelect={handleClankerSelect} />
					</TabsContent>
				</Tabs>
			)}
			{!isConnected && (
				<Button
					type="button"
					onClick={() => connect({ connector: connectors[0] })}
				>
					Connect
				</Button>
			)}
		</div>
	);
}

export default App;
