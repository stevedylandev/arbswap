import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { sdk } from "@farcaster/miniapp-sdk";
import "./index.css";
import App from "./App.tsx";
import { WagmiProvider } from "wagmi";
import { config } from "./lib/config.ts";

// Create a client
const queryClient = new QueryClient();

// Wrapper component to initialize SDK
function AppWithSDK() {
	useEffect(() => {
		// Initialize the SDK
		const initSDK = async () => {
			try {
				// Signal that the app is ready to be displayed
				await sdk.actions.ready();
				console.log("Farcaster SDK initialized");
			} catch (error) {
				console.error("Failed to initialize Farcaster SDK:", error);
			}
		};

		initSDK();
	}, []);

	return <App />;
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<AppWithSDK />
				<ReactQueryDevtools initialIsOpen={false} />
			</QueryClientProvider>
		</WagmiProvider>
	</StrictMode>,
);
