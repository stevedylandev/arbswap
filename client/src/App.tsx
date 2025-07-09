import { TokenSwap } from "./components/TokenSwap";

function App() {
	return (
		<div className="max-w-xl mx-auto flex flex-col gap-6 items-center justify-center min-h-screen p-4">
			<h1 className="text-3xl font-bold">ArbSwap</h1>
			<p className="text-center text-muted-foreground mb-4">
				Swap tokens on Arbitrum using Farcaster
			</p>
			<TokenSwap />
		</div>
	);
}

export default App;
