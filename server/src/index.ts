import { Hono } from "hono";
import { cors } from "hono/cors";
import { neon } from "@neondatabase/serverless";

// Define your table type based on the schema
interface ArbSocialTradingRow {
	fid: number;
	wallet_address: string;
	tx_hash: string;
	token_address: string;
	amount_in: number;
	amount_out: number;
	timestamp: string;
	chain: number;
}

type Bindings = {
	QUOTIENT_API_KEY: string;
	DATABASE_URL: string;
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

app.post("/trade", async (c) => {
	try {
		const body = await c.req.json();
		const {
			fid,
			wallet_address,
			tx_hash,
			token_address,
			amount_in,
			amount_out,
			timestamp,
			chain = 42161, // Default to Arbitrum
		} = body;

		// Basic validation
		if (!fid || !wallet_address || !tx_hash || !token_address) {
			return c.json(
				{
					success: false,
					error: "Missing required fields",
				},
				400,
			);
		}

		const sql = neon(c.env.DATABASE_URL);

		const result = await sql`
        INSERT INTO ecosystem.arb_social_trading (
          fid, wallet_address, tx_hash, token_address,
          amount_in, amount_out, timestamp, chain
        ) VALUES (
          ${fid}, ${wallet_address}, ${tx_hash}, ${token_address},
          ${amount_in}, ${amount_out}, ${timestamp}, ${chain}
        )
        RETURNING *
      `;

		return c.json({
			success: true,
			data: result[0] as ArbSocialTradingRow,
		});
	} catch (error) {
		console.error("Database error:", error);
		return c.json(
			{
				success: false,
				error: "Failed to create trade record",
			},
			500,
		);
	}
});

export default {
	async fetch(request: Request, env: any, ctx: any) {
		return app.fetch(request, env, ctx);
	},
};
