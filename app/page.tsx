"use client";

import { useState } from "react";
import { ethers } from "ethers";
import GameBoard from "@/components/game-board";
import GameControls from "@/components/game-controls";
import PlayerInfo from "@/components/player-info";
import ThemeSelector from "@/components/theme-selector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { contractABI } from "@/lib/contract-abi";
import TokenPurchase from "@/components/token-purchase";
import { TooltipProvider } from "@/components/ui/tooltip";

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [gameActive, setGameActive] = useState(false);
  const [gameState, setGameState] = useState({
    board: Array(5).fill(Array(5).fill(false)),
    buyin: "0",
    accumulation: "0",
    flips: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        setLoading(true);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const userSigner = await browserProvider.getSigner();
        const userAccount = await userSigner.getAddress();

        // Contract address would be provided in a real implementation
        const contractAddress = "0x74C34f8916169606e183962f5317DeFc4A3D7F91";
        const gameContract = new ethers.Contract(
          contractAddress,
          contractABI,
          userSigner
        );

        setProvider(browserProvider);
        setSigner(userSigner);
        setContract(gameContract);
        setAccount(userAccount);

        // Get token balance
        const tokenBalance = await gameContract.balanceOf(userAccount);
        setBalance(ethers.formatUnits(tokenBalance, 18));

        // Check if user has an active game
        const gameStateResult = await gameContract.GameState(userAccount);
        if (gameStateResult[1] > 0) {
          // buyin > 0 means active game
          setGameActive(true);
          setGameState({
            board: gameStateResult[0],
            buyin: ethers.formatUnits(gameStateResult[1], 18),
            accumulation: ethers.formatUnits(gameStateResult[2], 18),
            flips: gameStateResult[3],
          });
        }

        setLoading(false);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${userAccount.slice(
            0,
            6
          )}...${userAccount.slice(-4)}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "MetaMask is not installed!",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: "Could not connect to wallet",
      });
    }
  };

  // Update game state
  const updateGameState = async () => {
    if (contract && account) {
      try {
        const gameStateResult = await contract.GameState(account);
        setGameState({
          board: gameStateResult[0],
          buyin: ethers.formatUnits(gameStateResult[1], 18),
          accumulation: ethers.formatUnits(gameStateResult[2], 18),
          flips: gameStateResult[3],
        });

        // Update token balance
        const tokenBalance = await contract.balanceOf(account);
        setBalance(ethers.formatUnits(tokenBalance, 18));

        setGameActive(gameStateResult[1] > 0);
      } catch (error) {
        console.error("Error updating game state:", error);
      }
    }
  };

  // Handle card flip
  const handleFlipCard = async (index: number) => {
    if (!contract || !gameActive) return;

    try {
      setLoading(true);
      const tx = await contract.FlipCard(account, index);
      await tx.wait();

      // Update game state after flip
      await updateGameState();
      setLoading(false);
    } catch (error) {
      console.error("Error flipping card:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Flip Failed",
        description: "Could not flip the card",
      });
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 transition-colors">
      <TooltipProvider>
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PepeCard
            </h1>
            <ThemeSelector />
          </div>

          {!account ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <p className="text-xl text-center">
                Connect your wallet to play Blucker
              </p>
              <Button
                size="lg"
                onClick={connectWallet}
                disabled={loading}
                className="px-8"
              >
                {loading ? "Connecting..." : "Connect Wallet"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <GameBoard
                  board={gameState.board}
                  onFlip={handleFlipCard}
                  gameActive={gameActive}
                  loading={loading}
                />
              </div>
              <div className="space-y-6">
                <PlayerInfo
                  account={account}
                  balance={balance}
                  gameState={gameState}
                  gameActive={gameActive}
                />
                <GameControls
                  contract={contract}
                  account={account}
                  balance={balance}
                  gameActive={gameActive}
                  updateGameState={updateGameState}
                  setLoading={setLoading}
                  loading={loading}
                />
                <TokenPurchase
                  provider={provider}
                  account={account}
                  updateGameState={updateGameState}
                  loading={loading}
                  setLoading={setLoading}
                />
              </div>
            </div>
          )}
        </div>
      </TooltipProvider>
    </main>
  );
}
