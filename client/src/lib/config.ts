import { http, createConfig } from "wagmi";
import { arbitrum } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

export const config = createConfig({
	chains: [arbitrum],
	transports: {
		[arbitrum.id]: http(),
	},
	connectors: [miniAppConnector()],
});
