import { useConnect } from "wagmi";
import { useState, useEffect } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";

interface WalletConnectionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function WalletConnectionDialog({
	open,
	onOpenChange,
}: WalletConnectionDialogProps) {
	const { connect, connectors, isPending } = useConnect();
	const [isInMiniApp, setIsInMiniApp] = useState<boolean | null>(null);

	useEffect(() => {
		const checkMiniAppContext = async () => {
			try {
				const isMiniApp = await sdk.isInMiniApp();
				setIsInMiniApp(isMiniApp);
			} catch (error) {
				console.error("Error checking Mini App context:", error);
				setIsInMiniApp(false);
			}
		};

		if (open) {
			checkMiniAppContext();
		}
	}, [open]);

	const handleConnect = () => {
		connect({ connector: connectors[0] });
		onOpenChange(false);
	};



	// Show loading state while checking context
	if (isInMiniApp === null) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Loading...</DialogTitle>
						<DialogDescription>
							Checking app context...
						</DialogDescription>
					</DialogHeader>
				</DialogContent>
			</Dialog>
		);
	}

	// If not in Mini App, show message to open in Farcaster
	if (!isInMiniApp) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Open in Farcaster</DialogTitle>
						<DialogDescription>
							ArbSwap needs to be opened inside Farcaster to connect your wallet and swap tokens.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<a
							href="https://farcaster.xyz/miniapps/6z0JI9WJ6uWA/arbswap"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
						>
							Open ArbSwap in Farcaster
						</a>
						<Button
							variant="outline"
							onClick={() => onOpenChange(false)}
							className="w-full"
						>
							Cancel
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	// If in Mini App, show normal wallet connection dialog
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Connect Your Wallet</DialogTitle>
					<DialogDescription>
						You need to connect your wallet to swap tokens on ArbSwap.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<Button
						onClick={handleConnect}
						disabled={isPending}
						className="w-full"
					>
						{isPending ? "Connecting..." : "Connect Wallet"}
					</Button>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						className="w-full"
					>
						Cancel
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
