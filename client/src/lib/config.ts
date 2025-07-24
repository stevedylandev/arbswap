import { http, createConfig } from "wagmi";
import { arbitrum, base } from "wagmi/chains";
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";

export const config = createConfig({
	chains: [arbitrum, base],
	transports: {
		[arbitrum.id]: http(),
		[base.id]: http(),
	},
	connectors: [miniAppConnector()],
});
