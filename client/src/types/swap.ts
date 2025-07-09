export type SwapTokenDetails = {
  /**
   * Array of tx identifiers in order of execution.
   * Some swaps will have both an approval and swap tx.
   */
  transactions: `0x${string}`[];
};

export type SwapTokenErrorDetails = {
  /**
   * Error code.
   */
  error: string;
  /**
   * Error message.
   */
  message?: string;
};

export type SwapErrorReason = "rejected_by_user" | "swap_failed";

export type SwapTokenResult =
  | {
      success: true;
      swap: SwapTokenDetails;
    }
  | {
      success: false;
      reason: SwapErrorReason;
      error?: SwapTokenErrorDetails;
    };