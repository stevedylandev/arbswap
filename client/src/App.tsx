import { useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import { TokenSwap } from "./components/TokenSwap";
import { TopClankers } from "./components/TopClankers";
import { WalletConnectionDialog } from "./components/WalletConnectionDialog";
import type { Token } from "./services/tokenService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import arbLogo from "./assets/arb-logo.svg";
import { sdk } from "@farcaster/miniapp-sdk";
import { Button } from "./components/ui/button";

function App() {
	const { isConnected } = useAccount();
	const [selectedToken, setSelectedToken] = useState<Token | null>(null);
	const [showWalletDialog, setShowWalletDialog] = useState(false);

	const { disconnect } = useDisconnect();

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
		<div className="max-w-4xl w-full mx-auto flex flex-col gap-6 items-center justify-start min-h-screen p-4 mt-4">
			<div className="flex flex-col gap-2 items-center justify-center">
				<img src={arbLogo} alt="arbitrum logo" className="w-24" />
				<h1 className="text-3xl font-bold text-white">ArbSwap</h1>
				<p className="text-center text-[#E5E5E5] mb-4">
					Swap tokens on Arbitrum using Farcaster
				</p>
				<p className="text-center text-white text-xs flex items-center">
					Powered by
				</p>
				<p
					onClick={() => sdk.actions.openUrl("https://quotient.social")}
					className="text-center text-white text-lg flex items-center cursor-pointer"
				>
					{" "}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						className="h-6 w-6"
					>
						<title>divide</title>
						<path
							fill="currentColor"
							d="M6 11h12a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2m6.002-7a2 2 0 1 0-.004 4a2 2 0 0 0 .004-4m0 12a2 2 0 1 0-.004 4a2 2 0 0 0 .004-4"
						/>
					</svg>{" "}
					Quotient
				</p>
			</div>
			<Tabs defaultValue="search" className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="search">Search</TabsTrigger>
					<TabsTrigger value="clankers">Clankers</TabsTrigger>
				</TabsList>
				<TabsContent value="search">
					<TokenSwap
						externalSelectedToken={selectedToken}
						onTokenSelect={setSelectedToken}
						isConnected={isConnected}
						onConnectionRequired={() => setShowWalletDialog(true)}
					/>
				</TabsContent>
				<TabsContent value="clankers">
					<TopClankers
						onTokenSelect={handleClankerSelect}
						isConnected={isConnected}
						onConnectionRequired={() => setShowWalletDialog(true)}
					/>
				</TabsContent>
			</Tabs>
			<Button onClick={() => disconnect()}>disconnect</Button>

			<WalletConnectionDialog
				open={showWalletDialog}
				onOpenChange={setShowWalletDialog}
			/>
		</div>
	);
}

export default App;
