"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TokenPurchaseProps {
  provider: ethers.BrowserProvider | null;
  account: string;
  updateGameState: () => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function TokenPurchase({
  provider,
  account,
  updateGameState,
  loading,
  setLoading,
}: TokenPurchaseProps) {
  const [ethAmount, setEthAmount] = useState("");
  const { toast } = useToast();

  const isDisabled = !ethAmount || loading || !provider;
  const getTooltipMessage = () => {
    if (!provider) return "Please connect your wallet first";
    if (!ethAmount) return "Enter an amount of ETH to purchase tokens";
    if (loading) return "Transaction in progress";
    return "Purchase PC tokens with ETH";
  };

  const handlePurchase = async () => {
    if (!provider || !ethAmount) return;

    try {
      setLoading(true);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: "0xb1EF27DD560763F3d66722ee79321458BcD32f4F", // Contract address
        value: ethers.parseEther(ethAmount),
      });
      await tx.wait();
      await updateGameState();

      toast({
        title: "Purchase Successful",
        description: `Received ${Number(ethAmount)} PC tokens`,
      });
      setEthAmount("");
    } catch (error) {
      console.error("Error purchasing tokens:", error);
      toast({
        variant: "destructive",
        title: "Purchase Failed",
        description: "Could not purchase tokens",
      });
    } finally {
      setLoading(false);
    }
  };

  const expectedTokens = ethAmount ? Number(ethAmount) * 10000 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Purchase Tokens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ethAmount">ETH Amount</Label>
          <Input
            id="ethAmount"
            type="number"
            value={ethAmount}
            onChange={(e) => setEthAmount(e.target.value)}
            placeholder="Enter ETH amount"
            step="0.01"
            min="0"
            disabled={loading}
          />
          {ethAmount && (
            <p className="text-sm text-muted-foreground">
              You will receive: {expectedTokens.toLocaleString()} PC
            </p>
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                className="w-full"
                onClick={handlePurchase}
                disabled={isDisabled}
              >
                {loading ? "Processing..." : "Purchase Tokens"}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{getTooltipMessage()}</p>
          </TooltipContent>
        </Tooltip>
        <p className="text-xs text-muted-foreground text-center">
          Rate: 1 ETH = 1 PC
        </p>
      </CardContent>
    </Card>
  );
}
