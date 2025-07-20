import { useAccount, useConnect } from "wagmi";
import { TokenSwap } from "./components/TokenSwap";
import { TopClankers } from "./components/TopClankers";

function App() {
	const { isConnected } = useAccount();
	const { connect, connectors } = useConnect();

	return (
		<div className="max-w-4xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen p-4">
			<h1 className="text-3xl font-bold">ArbSwap</h1>
			<p className="text-center text-muted-foreground mb-4">
				Swap tokens on Arbitrum using Farcaster
			</p>
			<div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">
				<TopClankers />
				<TokenSwap />
			</div>

			{isConnected && (
				<div className="w-full flex flex-col lg:flex-row gap-6 items-start justify-center">
					<TokenSwap />
					<TopClankers />
				</div>
			)}
			{!isConnected && (
				<button
					type="button"
					onClick={() => connect({ connector: connectors[0] })}
				>
					Connect
				</button>
			)}
		</div>
	);
}

export default App;
