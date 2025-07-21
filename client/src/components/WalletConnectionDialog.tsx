import { useConnect } from "wagmi";
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

	const handleConnect = () => {
		connect({ connector: connectors[0] });
		onOpenChange(false);
	};

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
