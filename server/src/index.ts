import { Hono } from "hono";
import { cors } from "hono/cors";
import type { ApiResponse } from "shared/dist";

type Bindings = {
	NEYNAR_API_KEY: string;
	ALCHEMY_API_KEY: string;
	QUOTIENT_API_KEY: string;
};

type Holder = {
	fid: number;
	username: string;
	pfpUrl: string;
	quotientScore: number;
};

type Token = {
	address: string;
	name: string;
	description: string;
	imageUrl: string;
	count_holders: number;
	holders: Holder[];
};

type TokenResponse = {
	tokens: Token[];
	total_tokens: number;
	queried_fids: number;
	chain: string;
};

type Follower = {
	fid: number;
	username: string;
	pfp_url: string;
};

type FollowerResponse = {
	fid: number;
	mutual_followers: Follower[];
	count: number;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.get("/tokens/:fid", async (c) => {
	const fid = c.req.param("fid");

	const followerRes = await fetch(
		`https://api.quotient.social/v1/farcaster-users/mutuals`,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				fid: Number(fid),
				api_key: c.env.QUOTIENT_API_KEY,
			}),
		},
	);

	if (!followerRes.ok) {
		const text = await followerRes.text();
		console.log(text);
		return c.json({ error: "Problem fetching follower data" }, 500);
	}

	const followerData = (await followerRes.json()) as FollowerResponse;

	const followers: number[] = [];

	for (const follower of followerData.mutual_followers) {
		followers.push(follower.fid);
	}

	console.log(followers);

	const tokenRes = await fetch(
		"https://api.quotient.social/v1/holds-clankers",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				fids: followers,
				api_key: c.env.QUOTIENT_API_KEY,
				chain: "arbitrum",
			}),
		},
	);

	if (!tokenRes.ok) {
		const text = await tokenRes.text();
		console.log(text);
		return c.json({ error: "Problem fetching token data" }, 500);
	}

	const tokens = (await tokenRes.json()) as TokenResponse;

	return c.json(tokens);
});

export default {
	async fetch(request: Request, env: any, ctx: any) {
		return app.fetch(request, env, ctx);
	},
};
