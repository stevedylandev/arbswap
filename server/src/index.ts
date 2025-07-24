import { Hono } from "hono";
import { cors } from "hono/cors";
import postgres from "postgres";
import type {
  FollowerResponse,
  TokenResponse,
  ArbSocialTradingRow,
} from "shared";
import { validateTradeData, validateFidParam } from "./validation";

// Define your table type based on the schema

type Bindings = {
  QUOTIENT_API_KEY: string;
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.use(cors());

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/tokens/:fid", async (c) => {
  const fidParam = c.req.param("fid");

  const fidValidation = validateFidParam(fidParam);
  if (!fidValidation.success) {
    return c.json({ error: fidValidation.error }, 400);
  }

  const fid = fidValidation.data;

  const followerRes = await fetch(
    `https://api.quotient.social/v1/farcaster-users/mutuals`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fid: fid,
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

    // Validate the request body using Zod
    const validation = validateTradeData(body);
    if (!validation.success) {
      return c.json(
        {
          success: false,
          error: validation.error,
        },
        400,
      );
    }

    const {
      fid,
      wallet_address,
      tx_hash,
      token_address_in,
      token_address_out,
      amount_in,
      amount_out,
      timestamp,
      chain,
    } = validation.data;

    if (!c.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set");
      return c.json(
        {
          success: false,
          error: "Database configuration missing",
        },
        500,
      );
    }

    console.log("DATABASE_URL exists:", !!c.env.DATABASE_URL);
    console.log("DATABASE_URL starts with:", c.env.DATABASE_URL?.substring(0, 20));

    const sql = postgres(c.env.DATABASE_URL);

    const result = await sql`
        INSERT INTO ecosystem.arb_social_trading (
          fid, wallet_address, tx_hash, token_address_in, token_address_out,
          amount_in, amount_out, timestamp, chain
        ) VALUES (
          ${fid}, ${wallet_address}, ${tx_hash}, ${token_address_in}, ${token_address_out},
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
    console.error("Error details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });

    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create trade record",
        details: error instanceof Error ? error.message : String(error),
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
