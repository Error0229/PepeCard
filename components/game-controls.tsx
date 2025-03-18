"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface GameControlsProps {
  contract: ethers.Contract | null;
  account: string;
  balance: string;
  gameActive: boolean;
  updateGameState: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  loading: boolean;
}

export default function GameControls({
  contract,
  account,
  balance,
  gameActive,
  updateGameState,
  setLoading,
  loading,
}: GameControlsProps) {
  const [buyinAmount, setBuyinAmount] = useState("100");
  const [redeemAmount, setRedeemAmount] = useState("");
  const { toast } = useToast();

  const handleStartGame = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      // First check allowance and approve if needed
      const allowance = await contract.allowance(account, contract.target);
      const buyinAmountBN = ethers.parseUnits(buyinAmount, 18);

      if (allowance < buyinAmountBN) {
        const approveTx = await contract.approve(
          contract.target,
          buyinAmountBN
        );
        await approveTx.wait();
      }

      const tx = await contract.StartGame(account, buyinAmountBN);
      await tx.wait();
      await updateGameState();

      toast({
        title: "Game Started",
        description: `Started a new game with ${buyinAmount} PC`,
      });
    } catch (error: any) {
      console.error("Error starting game:", error);
      toast({
        variant: "destructive",
        title: "Start Game Failed",
        description:
          error.reason ||
          "Could not start the game. Check if you have approved token spending.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGame = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.Leave(account);
      await tx.wait();
      await updateGameState();

      toast({
        title: "Game Left",
        description:
          "You've successfully left the game and collected your rewards",
      });
    } catch (error: any) {
      console.error("Error leaving game:", error);
      toast({
        variant: "destructive",
        title: "Leave Game Failed",
        description: error.reason || "Could not leave the game",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!contract || !redeemAmount) return;

    try {
      setLoading(true);
      const tx = await contract.redeem(ethers.parseUnits(redeemAmount, 18));
      await tx.wait();
      await updateGameState();

      toast({
        title: "Tokens Redeemed",
        description: `Successfully redeemed ${redeemAmount} PC tokens`,
      });
      setRedeemAmount("");
    } catch (error: any) {
      console.error("Error redeeming tokens:", error);

      // Check for specific contract error message
      const reason =
        error.reason ||
        error.data?.message ||
        (typeof error.data === "string" ? error.data : null);

      if (reason?.includes("insufficient ETH")) {
        toast({
          variant: "destructive",
          title: "Redemption Failed",
          description:
            "The contract currently has insufficient ETH. Please try redeeming a smaller amount or try again later.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Redemption Failed",
          description: reason || "Could not redeem tokens",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const canStartGame =
    Number(buyinAmount) >= 100 &&
    Number(buyinAmount) <= Number(balance) &&
    !loading &&
    contract;

  const canLeaveGame = !loading && contract && gameActive;
  const canRedeem =
    !loading &&
    contract &&
    Number(redeemAmount) > 0 &&
    Number(redeemAmount) <= Number(balance);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!gameActive ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buyin">Buy-in Amount (PC)</Label>
              <Input
                id="buyin"
                type="number"
                min="100"
                value={buyinAmount}
                onChange={(e) => setBuyinAmount(e.target.value)}
                placeholder="Enter amount (min 100)"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">Minimum: 100 PC</p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    className="w-full"
                    onClick={handleStartGame}
                    disabled={!canStartGame}
                  >
                    {loading ? "Processing..." : "Start Game"}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {!contract
                    ? "Please connect your wallet"
                    : Number(buyinAmount) < 100
                    ? "Minimum buy-in is 100 PC"
                    : Number(buyinAmount) > Number(balance)
                    ? "Insufficient balance"
                    : loading
                    ? "Transaction in progress"
                    : "Start a new game"}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleLeaveGame}
                  disabled={!canLeaveGame}
                >
                  {loading ? "Processing..." : "Leave Game & Collect Rewards"}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {loading
                  ? "Transaction in progress"
                  : "Leave the game and collect your rewards"}
              </p>
            </TooltipContent>
          </Tooltip>
        )}

        <div className="pt-4 border-t space-y-4">
          <div className="space-y-2">
            <Label htmlFor="redeem">Redeem Tokens (PC)</Label>
            <Input
              id="redeem"
              type="number"
              min="1"
              value={redeemAmount}
              onChange={(e) => setRedeemAmount(e.target.value)}
              placeholder="Enter amount to redeem"
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              2% redemption fee applies
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  className="w-full"
                  variant="secondary"
                  onClick={handleRedeem}
                  disabled={!canRedeem}
                >
                  {loading ? "Processing..." : "Redeem for ETH"}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {!contract
                  ? "Please connect your wallet"
                  : !redeemAmount
                  ? "Enter an amount to redeem"
                  : Number(redeemAmount) > Number(balance)
                  ? "Insufficient balance"
                  : loading
                  ? "Transaction in progress"
                  : "Redeem PC tokens for ETH"}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
