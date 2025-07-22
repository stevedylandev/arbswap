# ArbSwap

![cover](https://arbswap.trading/og.png)

A Farcaster Mini App that lets users discover tokens on Arbitrum, powered by [Quotient](https://quotient.social)

## Quickstart

Clone the repo, `cd` into it, and install dependencies with [Bun](https://bun.sh)

```bash
git clone https://github.com/stevedylandev/arbswap
cd arbswap
bun install
```

Inside the `server` package add a new file named `.dev.vars` with your own Quotient API Key

```bash .dev.vars
QUOTIENT_API_KEY=YOUR_API_KEY
```

Then insice the `client` package make another file named `.env.local` with the following variable

```bash
VITE_SERVER_URL=http://localhost:8787 # Update this with prod instance when deployed
```

Run the dev server with the command below

```bash
bun run dev
```

This will spin up both the server and client at the same time using the [bhvr](https://bhvr.dev) framework.
