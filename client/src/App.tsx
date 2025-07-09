import { useAccount, useConnect } from "wagmi";
import { TokenSwap } from "./components/TokenSwap";

function App() {
	const { isConnected } = useAccount();
	const { connect, connectors } = useConnect();

	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen p-4">
			<h1 className="text-3xl font-bold">ArbSwap</h1>
			<p className="text-center text-muted-foreground mb-4">
				Swap tokens on Arbitrum using Farcaster
			</p>
			{isConnected && <TokenSwap />}
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
