import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";

type Bindings = {
	NEYNAR_API_KEY: string;
	ALCHEMY_API_KEY: string;
};

type Follower = {
	fid: number;
	mutual_affinity_score: number;
	username: string;
};

type FollowerResponse = {
	users: Follower[];
	next: {
		cursor: string;
	};
};

type UserDehydrated = {
	object: "user_dehydrated";
	fid: number;
	username: string;
	display_name: string;
	pfp_url: string;
	custody_address: string;
};

type ChannelDehydrated = {
	id: string;
	name: string;
	object: "channel_dehydrated";
	image_url: string;
	viewer_context: {
		following: boolean;
		role: string;
	};
};

type Bio = {
	text: string;
	mentioned_profiles: UserDehydrated[];
	mentioned_profiles_ranges: {
		start: number;
		end: number;
	}[];
	mentioned_channels: ChannelDehydrated[];
	mentioned_channels_ranges: {
		start: number;
		end: number;
	}[];
};

type Location = {
	latitude: number;
	longitude: number;
	address: {
		city: string;
		state: string;
		state_code: string;
		country: string;
		country_code: string;
	};
	radius: number;
};

type Banner = {
	url: string;
};

type Profile = {
	bio: Bio;
	location: Location;
	banner: Banner;
};

type Pro = {
	status: string;
	subscribed_at: string;
	expires_at: string;
};

type VerifiedAddresses = {
	eth_addresses: string[];
	sol_addresses: string[];
	primary: {
		eth_address: string;
		sol_address: string;
	};
};

type VerifiedAccount = {
	platform: string;
	username: string;
};

type Experimental = {
	deprecation_notice: string;
	neynar_user_score: number;
};

type ViewerContext = {
	following: boolean;
	followed_by: boolean;
	blocking: boolean;
	blocked_by: boolean;
};

type User = {
	object: "user";
	fid: number;
	username: string;
	display_name: string;
	custody_address: string;
	pro: Pro;
	pfp_url: string;
	profile: Profile;
	follower_count: number;
	following_count: number;
	verifications: string[];
	verified_addresses: VerifiedAddresses;
	verified_accounts: VerifiedAccount[];
	power_badge: boolean;
	experimental: Experimental;
	viewer_context: ViewerContext;
	score: number;
};

type UserResponse = {
	users: User[];
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.get("/tokens/:fid", async (c) => {
	const fid = c.req.param("fid");

	const followerRes = await fetch(
		`https://api.neynar.com/v2/farcaster/user/best_friends?fid=${fid}&limit=5`,
		{
			method: "GET",
			headers: {
				"x-api-key": `${c.env.NEYNAR_API_KEY}`,
			},
		},
	);

	if (!followerRes.ok) {
		const text = await followerRes.text();
		console.log(text);
		return c.json({ error: "Problem fetching follower data" }, 500);
	}

	const followerData = (await followerRes.json()) as FollowerResponse;

	const followers: number[] = [];

	for (const follower of followerData.users) {
		followers.push(follower.fid);
	}

	const userReq = await fetch(
		`https://api.neynar.com/v2/farcaster/user/bulk?fids=${followers}`,
		{
			method: "GET",
			headers: {
				"x-api-key": `${c.env.NEYNAR_API_KEY}`,
			},
		},
	);

	if (!userReq.ok) {
		const text = await userReq.text();
		console.log(text);
		return c.json({ error: "Problem fetching user data" }, 500);
	}

	const userData = (await userReq.json()) as UserResponse;

	const walletAddresses: string[] = [];

	for (const user of userData.users) {
		walletAddresses.push(user.verified_addresses.primary.eth_address);
	}

	const tokens = [];

	for (const address of walletAddresses) {
		const balanceRes = await fetch(
			`https://arb-mainnet.g.alchemy.com/v2/${c.env.ALCHEMY_API_KEY}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					jsonrpc: "2.0",
					method: "alchemy_getTokenBalances",
					params: [address.toString(), "erc20"],
				}),
			},
		);
		if (!balanceRes.ok) {
			const json = await balanceRes.text();
			console.log("Token data fetch failed for: ", address);
			console.log(json);
			continue;
		}
		const balanceData = await balanceRes.json();
		for (const token of balanceData.result.tokenBalances) {
			const tokenRes = await fetch(
				`https://arb-mainnet.g.alchemy.com/v2/${c.env.ALCHEMY_API_KEY}`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						jsonrpc: "2.0",
						method: "alchemy_getTokenMetadata",
						params: [token.contractAddress],
					}),
				},
			);
			const tokenData = await tokenRes.json();
			tokens.push(tokenData);
		}
	}

	return c.json(tokens, { status: 200 });
});

export default {
	async fetch(request: Request, env: any, ctx: any) {
		return app.fetch(request, env, ctx);
	},
};
