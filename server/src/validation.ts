import { z } from "zod";

// Zod schema for trade data validation
export const TradeSchema = z.object({
	fid: z.number().int().positive("FID must be a positive integer"),
	wallet_address: z.string()
		.min(42, "Wallet address must be at least 42 characters")
		.max(42, "Wallet address must be exactly 42 characters")
		.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum wallet address format"),
	tx_hash: z.string()
		.min(66, "Transaction hash must be at least 66 characters")
		.max(66, "Transaction hash must be exactly 66 characters")
		.regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash format"),
	token_address: z.string()
		.min(42, "Token address must be at least 42 characters")
		.max(42, "Token address must be exactly 42 characters")
		.regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum token address format"),
	amount_in: z.number().nonnegative("Amount in must be non-negative"),
	amount_out: z.number().nonnegative("Amount out must be non-negative"),
	timestamp: z.string().refine((val) => {
		const date = new Date(val);
		return !isNaN(date.getTime());
	}, "Invalid timestamp format"),
	chain: z.number().int().positive("Chain ID must be a positive integer").optional().default(42161),
});

// Schema for FID parameter validation
export const FidParamSchema = z.object({
	fid: z.string().regex(/^\d+$/, "FID must be a numeric string").transform((val) => parseInt(val, 10)),
});

// Export types for TypeScript inference
export type TradeData = z.infer<typeof TradeSchema>;
export type FidParam = z.infer<typeof FidParamSchema>;

// Validation helper function
export function validateTradeData(data: unknown): { success: true; data: TradeData } | { success: false; error: string } {
	try {
		const validatedData = TradeSchema.parse(data);
		return { success: true, data: validatedData };
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(", ");
			return { success: false, error: errorMessages };
		}
		return { success: false, error: "Unknown validation error" };
	}
}

// Validation helper for FID parameter
export function validateFidParam(fid: string): { success: true; data: number } | { success: false; error: string } {
	try {
		const validated = FidParamSchema.parse({ fid });
		return { success: true, data: validated.fid };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { success: false, error: "FID must be a valid number" };
		}
		return { success: false, error: "Unknown validation error" };
	}
}