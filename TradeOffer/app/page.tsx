"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import NFTCard from "@/components/nft-card";
import ConnectWallet from "@/components/connect-wallet";
import { contractABI } from "@/lib/contract-abi";

// Contract address - replace with your deployed contract address
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

export default function Home() {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>("");
  const [tokenURI, setTokenURI] = useState<string>("");
  const [credits, setCredits] = useState<number>(0);
  const [tokensInPool, setTokensInPool] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [nftMetadata, setNftMetadata] = useState<{ [key: number]: any }>({});

  // Connect to wallet and initialize contract
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await browserProvider.getSigner();
        const account = await signer.getAddress();
        if (!CONTRACT_ADDRESS) {
          throw new Error("Contract address is not defined");
        }
        const contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          contractABI,
          signer
        );

        setProvider(browserProvider);
        setSigner(signer);
        setContract(contract);
        setAccount(account);

        // Load user data
        await loadUserData(contract, account);
      } else {
        showNotification("error", "Please install MetaMask to use this dApp");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      showNotification("error", "Failed to connect wallet");
    }
  };

  // Load user data (credits and tokens in pool)
  const loadUserData = async (contract: ethers.Contract, account: string) => {
    try {
      setLoading(true);

      // Get user credits - force BigInt conversion
      const userCredits = await contract.credits(account);
      setCredits(Number(userCredits.toString()));

      // Get tokens in pool
      const tokens = await contract.getTokensHeld();
      const tokenNumbers = tokens.map((t: bigint) => Number(t.toString()));
      setTokensInPool(tokenNumbers);

      // Fetch metadata for tokens in pool
      await fetchNFTMetadata(contract, tokenNumbers);

      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
      showNotification("error", "Failed to load user data");
    }
  };

  // Fetch metadata for NFTs
  const fetchNFTMetadata = async (
    contract: ethers.Contract,
    tokenIds: number[]
  ) => {
    const metadata: { [key: number]: any } = {};

    for (const tokenId of tokenIds) {
      try {
        const uri = await contract.tokenURI(tokenId);
        // If URI is IPFS, convert to HTTP gateway URL
        const formattedUri = uri.startsWith("ipfs://")
          ? uri.replace("ipfs://", "https://ipfs.io/ipfs/")
          : uri;

        const response = await fetch(formattedUri);
        const data = await response.json();
        metadata[tokenId] = data;
      } catch (error) {
        console.error(`Error fetching metadata for token ${tokenId}:`, error);
        metadata[tokenId] = {
          name: `Token #${tokenId}`,
          description: "Metadata unavailable",
        };
      }
    }

    setNftMetadata(metadata);
  };

  // Mint NFT
  const mintNFT = async () => {
    if (!contract || !tokenURI) return;

    try {
      setLoading(true);
      const tx = await contract.mintNFT(tokenURI);
      await tx.wait();

      showNotification(
        "success",
        "NFT minted successfully! You earned 1 claim credit."
      );
      setTokenURI("");

      // Refresh user data
      await loadUserData(contract, account);
    } catch (error) {
      console.error("Error minting NFT:", error);
      showNotification("error", "Failed to mint NFT");
    } finally {
      setLoading(false);
    }
  };

  // Claim random NFT
  const claimRandomNFT = async () => {
    if (!contract || !signer) return;

    try {
      setLoading(true);
      const price = ethers.parseEther("0.001");
      const tx = await signer.sendTransaction({
        to: CONTRACT_ADDRESS,
        value: price,
      });
      await tx.wait();

      showNotification("success", "You claimed a random NFT!");

      // Refresh user data
      await loadUserData(contract, account);
    } catch (error) {
      console.error("Error claiming NFT:", error);
      showNotification("error", "Failed to claim NFT");
    } finally {
      setLoading(false);
    }
  };

  // Show notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (contract) {
            loadUserData(contract, accounts[0]);
          }
        } else {
          setAccount("");
          setCredits(0);
          setTokensInPool([]);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners("accountsChanged");
      }
    };
  }, [contract]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            ⚠️Trade Offer⚠️
          </h1>
          <p className="text-gray-300 mb-6">
            I receive: 1 NFT. You receive: 1 NFT.
          </p>

          <div className="flex justify-center mb-4">
            <ConnectWallet account={account} onConnect={connectWallet} />
          </div>

          {account && (
            <div className="flex justify-center items-center gap-2 text-sm">
              <span className="text-gray-300">Your claim credits:</span>
              <Badge
                variant="outline"
                className="bg-purple-900/50 text-purple-200 border-purple-500"
              >
                {credits} credits
              </Badge>
            </div>
          )}
        </header>

        {notification && (
          <Alert
            variant={notification.type === "error" ? "destructive" : "default"}
            className="mb-6 mx-auto max-w-md"
          >
            {notification.type === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <AlertTitle>
              {notification.type === "error" ? "Error" : "Success"}
            </AlertTitle>
            <AlertDescription>{notification.message}</AlertDescription>
          </Alert>
        )}

        {account ? (
          <Tabs defaultValue="mint" className="mx-auto max-w-4xl">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="mint">Mint NFT</TabsTrigger>
              <TabsTrigger value="pool">
                NFT Pool ({tokensInPool.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="mint">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Mint a New NFT</CardTitle>
                  <CardDescription className="text-gray-400">
                    Mint an NFT to earn a claim credit. The NFT will be added to
                    the pool.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="tokenURI"
                        className="text-sm font-medium text-gray-300"
                      >
                        Token URI (metadata URL)
                      </label>
                      <Input
                        id="tokenURI"
                        placeholder="https://example.com/metadata.json or ipfs://..."
                        value={tokenURI}
                        onChange={(e) => setTokenURI(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                      <p className="text-xs text-gray-400">
                        The URI should point to a JSON file with your NFT
                        metadata (name, description, image URL, etc.)
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={mintNFT}
                    disabled={!tokenURI || loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Minting...
                      </>
                    ) : (
                      "Mint NFT"
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card className="mt-8 bg-gray-800/50 border-gray-700">
                <CardHeader>
                  <CardTitle>Claim a Random NFT</CardTitle>
                  <CardDescription className="text-gray-400">
                    Use your claim credits to get a random NFT from the pool.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-300">
                          Price:
                        </span>
                        <span className="text-sm font-bold text-white">
                          0.001 ETH
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-300">
                          Your credits:
                        </span>
                        <span className="text-sm font-bold text-white">
                          {credits}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={claimRandomNFT}
                    disabled={
                      credits <= 0 || tokensInPool.length === 0 || loading
                    }
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      "Claim Random NFT"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="pool">
              <div className="space-y-6">
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-xl font-bold mb-2">
                    NFTs Available in Pool
                  </h3>
                  <p className="text-gray-400 mb-4">
                    These NFTs are currently held by the contract and available
                    for claiming.
                  </p>

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                    </div>
                  ) : tokensInPool.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">
                      <p>
                        No NFTs in the pool yet. Mint some NFTs to add them to
                        the pool!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tokensInPool.map((tokenId) => (
                        <NFTCard
                          key={tokenId}
                          tokenId={tokenId}
                          metadata={nftMetadata[tokenId]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12 bg-gray-800/50 border border-gray-700 rounded-lg max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-400 mb-6">
              Connect your Ethereum wallet to mint NFTs and claim from the pool.
            </p>
            <Button
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Connect Wallet
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
