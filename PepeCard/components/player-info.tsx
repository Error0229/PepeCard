"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlayerInfoProps {
  account: string;
  balance: string;
  gameState: {
    buyin: string;
    accumulation: string;
    flips: number;
    nextReward: string; // Add this
  };
  gameActive: boolean;
}

export default function PlayerInfo({
  account,
  balance,
  gameState,
  gameActive,
}: PlayerInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Account</div>
          <div className="font-mono text-sm truncate">{account}</div>
        </div>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">Token Balance</div>
          <div className="text-2xl font-bold">
            {Number.parseFloat(balance).toLocaleString()} PC
          </div>
        </div>

        {gameActive && (
          <>
            <div className="pt-4 border-t space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Buy-in</div>
                  <div className="text-lg font-semibold">
                    {Number.parseFloat(gameState.buyin).toLocaleString()} PC
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    Safe Flips
                  </div>
                  <div className="text-lg font-semibold">{gameState.flips}</div>
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Accumulated Rewards
                </div>
                <div className="text-2xl font-bold text-primary">
                  {Number.parseFloat(gameState.accumulation).toLocaleString()}{" "}
                  PC
                </div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">
                  Next Card Reward
                </div>
                <div className="text-lg font-semibold text-green-500">
                  +{Number.parseFloat(gameState.nextReward).toLocaleString()} PC
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
