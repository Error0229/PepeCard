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
import AdminControls from "@/components/admin-controls";
import LoadingOverlay from "@/components/loading-overlay";
import GameResultModal from "@/components/game-result-modal";
import FloatingReward from "@/components/floating-reward";

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
    nextReward: "0",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [contractOwner, setContractOwner] = useState<string>("");
  const [gameResult, setGameResult] = useState<{
    open: boolean;
    type: "win" | "lose";
    reward?: string;
  }>({ open: false, type: "win" });
  const [ghostPosition, setGhostPosition] = useState<number | undefined>();
  const [floatingRewards, setFloatingRewards] = useState<
    Array<{
      id: number;
      value: string;
      isGhost: boolean;
      position: { x: number; y: number };
    }>
  >([]);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        setLoading(true);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const userSigner = await browserProvider.getSigner();
        const userAccount = await userSigner.getAddress();

        // Contract address would be provided in a real implementation
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
        if (!contractAddress) {
          throw new Error("Game contract address not configured");
        }
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
        try {
          const gameStateResult = await gameContract.GameState();
          if (gameStateResult[1] > 0) {
            // buyin > 0 means active game
            setGameActive(true);
            setGameState({
              board: gameStateResult[0],
              buyin: ethers.formatUnits(gameStateResult[1], 18),
              accumulation: ethers.formatUnits(gameStateResult[2], 18),
              flips: gameStateResult[3],
              nextReward: ethers.formatUnits(gameStateResult[4], 18),
            });
          }
        } catch (error) {
          // Ignore error if user has no active game
        }

        const owner = await gameContract.owner();
        setContractOwner(owner);
        console.log("Contract owner:", owner);
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
        const gameStateResult = await contract.GameState();
        setGameState({
          board: gameStateResult[0],
          buyin: ethers.formatUnits(gameStateResult[1], 18),
          accumulation: ethers.formatUnits(gameStateResult[2], 18),
          flips: gameStateResult[3],
          nextReward: ethers.formatUnits(gameStateResult[4], 18),
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
  const handleFlipCard = async (index: number, element: HTMLDivElement) => {
    if (!contract || !gameActive) return;

    try {
      setLoading(true);
      const rect = element.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };

      const tx = await contract.FlipCard(index);
      const receipt = await tx.wait();

      const event = receipt.logs
        .map((log: any) => {
          try {
            return contract.interface.parseLog(log);
          } catch (e) {
            return null;
          }
        })
        .find((event: any) => event?.name === "CardFlipped");

      if (event) {
        const isGhost = event.args.ghost;
        if (isGhost) {
          setGhostPosition(index);
          setFloatingRewards((prev) => [
            ...prev,
            {
              id: Date.now(),
              value: "",
              isGhost: true,
              position,
            },
          ]);
        } else {
          setFloatingRewards((prev) => [
            ...prev,
            {
              id: Date.now(),
              value: ethers.formatUnits(event.args.reward, 18),
              isGhost: false,
              position,
            },
          ]);
        }
      }

      await updateGameState();
    } catch (error) {
      console.error("Error flipping card:", error);
      setLoading(false);
      toast({
        variant: "destructive",
        title: "Flip Failed",
        description: "Could not flip the card",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-4 md:p-8 transition-colors">
      <TooltipProvider>
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              PepeCard
            </h1>
            <ThemeSelector />
          </div>

          {!account ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <p className="text-xl text-center">
                Connect your wallet to play PepeCard
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
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-8 flex flex-col gap-8">
                <div className="flex-1 max-w-3xl mx-auto w-full">
                  <GameBoard
                    board={gameState.board}
                    onFlip={handleFlipCard}
                    gameActive={gameActive}
                    loading={loading}
                    isGameOver={!!ghostPosition}
                    ghostPosition={ghostPosition}
                  />
                  {floatingRewards.map((reward) => (
                    <FloatingReward
                      key={reward.id}
                      value={reward.value}
                      isGhost={reward.isGhost}
                      position={reward.position}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
              <div className="xl:col-span-4 space-y-8">
                <PlayerInfo
                  account={account}
                  balance={balance}
                  gameState={gameState}
                  gameActive={gameActive}
                />
                <AdminControls
                  contract={contract}
                  account={account}
                  contractOwner={contractOwner}
                  loading={loading}
                  setLoading={setLoading}
                />
              </div>
            </div>
          )}
          <GameResultModal
            open={gameResult.open}
            onClose={() => setGameResult({ ...gameResult, open: false })}
            result={gameResult.type}
            reward={gameResult.reward}
          />
        </div>
      </TooltipProvider>
    </main>
  );
}
