import { BrowserProvider, formatEther, BigNumberish, parseEther } from "ethers";

// Extend the Window interface to include the ethereum property
declare global {
  interface Window {
    ethereum?: any
  }
}

// Check if MetaMask is installed
export const isMetaMaskInstalled = () => {
  return typeof window !== "undefined" && window.ethereum !== undefined
}

// Connect to MetaMask
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed")
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
    return accounts[0]
  } catch (error) {
    throw new Error("Failed to connect to MetaMask")
  }
}

// Get Ethereum provider
export const getProvider = () => {
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed")
  }

  return new BrowserProvider(window.ethereum)
}

// Get current account
export const getCurrentAccount = async () => {
  if (!isMetaMaskInstalled()) {
    return null
  }

  const accounts = await window.ethereum.request({ method: "eth_accounts" })
  return accounts.length > 0 ? accounts[0] : null
}

// Listen for account changes
export const listenForAccountChanges = (callback: (accounts: string[]) => void) => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on("accountsChanged", callback)
    return () => window.ethereum.removeListener("accountsChanged", callback)
  }
  return () => { }
}

// Listen for chain changes
export const listenForChainChanges = (callback: (chainId: string) => void) => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on("chainChanged", callback)
    return () => window.ethereum.removeListener("chainChanged", callback)
  }
  return () => { }
}

// Format credit amount from wei to a human readable string
export function formatCredit(amount: BigNumberish): string {
  return formatEther(amount);
}

// Parse credit amount from ether to wei
export function parseCredit(amount: string): BigNumberish {
  return parseEther(amount);
}
