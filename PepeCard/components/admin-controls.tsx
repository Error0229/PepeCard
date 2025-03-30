"use client";

import { ethers } from "ethers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AdminControlsProps {
  contract: ethers.Contract | null;
  account: string;
  contractOwner: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export default function AdminControls({
  contract,
  account,
  contractOwner,
  loading,
  setLoading,
}: AdminControlsProps) {
  const { toast } = useToast();
  if (!contract) return null;

  const handleTakeOut = async () => {
    try {
      setLoading(true);
      const tx = await contract.TakeOut();
      await tx.wait();
      toast({
        title: "Success",
        description: "Successfully withdrawn ETH balance",
      });
    } catch (error: any) {
      console.error("TakeOut error:", error);
      const msg =
        error.reason +
        " Your account: " +
        account +
        " Contract owner: " +
        contractOwner;
      toast({
        variant: "destructive",
        title: "Error",
        description: msg,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFreeToken = async () => {
    try {
      setLoading(true);
      const tx = await contract.FreeToken();
      await tx.wait();
      toast({
        title: "Success",
        description: "Successfully minted free tokens",
      });
    } catch (error: any) {
      console.error("FreeToken error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.reason || "Failed to mint tokens",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                className="w-full"
                onClick={handleTakeOut}
                disabled={loading}
                variant="secondary"
              >
                Take Out ETH
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Withdraw contract's ETH balance</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                className="w-full"
                onClick={handleFreeToken}
                disabled={loading}
                variant="secondary"
              >
                Mint Free Tokens
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mint 10,000 PC tokens</p>
          </TooltipContent>
        </Tooltip>
      </CardContent>
    </Card>
  );
}
