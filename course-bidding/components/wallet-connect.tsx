"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { connectWallet, getCurrentAccount, listenForAccountChanges } from "@/lib/ethereum"

export function WalletConnect() {
  const [account, setAccount] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check if already connected
    const checkConnection = async () => {
      try {
        const currentAccount = await getCurrentAccount()
        setAccount(currentAccount)
      } catch (err) {
        console.error("Failed to get current account:", err)
      }
    }

    checkConnection()

    // Listen for account changes
    const unsubscribe = listenForAccountChanges((accounts) => {
      setAccount(accounts.length > 0 ? accounts[0] : null)
    })

    return unsubscribe
  }, [])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const connectedAccount = await connectWallet()
      setAccount(connectedAccount)
    } catch (err) {
      console.error("Connection error:", err)
      setError(err instanceof Error ? err.message : "Failed to connect wallet")
    } finally {
      setIsConnecting(false)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <div>
      {account ? (
        <Button variant="outline" className="font-mono">
          {formatAddress(account)}
        </Button>
      ) : (
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
      )}
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}

