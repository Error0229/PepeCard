"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"

interface ConnectWalletProps {
  account: string
  onConnect: () => void
}

export default function ConnectWallet({ account, onConnect }: ConnectWalletProps) {
  // Format address to show only first 6 and last 4 characters
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  return (
    <Button
      onClick={onConnect}
      variant={account ? "outline" : "default"}
      className={
        account
          ? "border-purple-500 text-purple-200"
          : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
      }
    >
      <Wallet className="mr-2 h-4 w-4" />
      {account ? formatAddress(account) : "Connect Wallet"}
    </Button>
  )
}

