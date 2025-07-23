export type ArbSocialTradingRow = {
	fid: number;
	wallet_address: string;
	tx_hash: string;
	token_address: string;
	amount_in: number;
	amount_out: number;
	timestamp: string;
	chain: number;
};

export type Holder = {
	fid: number;
	username: string;
	pfpUrl: string;
	quotientScore: number;
};

export type Token = {
	address: string;
	name: string;
	description: string;
	imageUrl: string;
	count_holders: number;
	holders: Holder[];
};

export type TokenResponse = {
	tokens: Token[];
	total_tokens: number;
	queried_fids: number;
	chain: string;
};

export type Follower = {
	fid: number;
	username: string;
	pfp_url: string;
};

export type FollowerResponse = {
	fid: number;
	mutual_followers: Follower[];
	count: number;
};
