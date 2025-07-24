import type { Token } from "@/services/tokenService";

export const DEFAULT_TOKENS: Token[] = [
	{
		address: "0x912CE59144191C1204E64559FE8253a0e49E6548",
		name: "Arbitrum",
		symbol: "ARB",
		decimals: 18,
		type: "ERC-20",
		holders: 1540467,
		icon_url:
			"https://assets.coingecko.com/coins/images/16547/small/arb.jpg?1721358242",
	},
	{
		address: "0x13A7DeDb7169a17bE92B0E3C7C2315B46f4772B3",
		name: "Boop",
		symbol: "BOOP",
		decimals: 18,
		type: "ERC-20",
		holders: 12687,
		icon_url:
			"https://assets.coingecko.com/coins/images/33874/small/Boop_resized.png?1703144302",
	},
];
