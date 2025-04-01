"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Wallet } from "lucide-react";
import { useContract } from "@/hooks/use-contract";
import { connectWallet } from "@/lib/ethereum";

export default function RegisterPage() {
  const {
    account,
    isRegistered,
    register,
    loading,
    error: contractError,
  } = useContract();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // If already registered, set success state
    if (isRegistered) {
      setSuccess(true);
    }
  }, [isRegistered]);

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleRegister = async () => {
    if (!account) {
      setError("Please connect your wallet first");
      return;
    }

    setIsRegistering(true);
    setError("");

    try {
      await register();
      setSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        "Failed to register. Make sure you have a wallet connected and haven't registered before."
      );
    } finally {
      setIsRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center">Loading...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contractError) {
    return (
      <div className="container flex h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              Failed to connect to the blockchain
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{contractError}</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Link href="/" className="w-full">
              <Button variant="outline" className="w-full">
                Back to Home
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container flex h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Student Registration</CardTitle>
          <CardDescription>
            Register to receive initial tokens for course bidding
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success ? (
            <Alert className="mb-4">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Registration Successful</AlertTitle>
              <AlertDescription>
                You have been registered and received 25 ETH initial tokens.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              <p>
                By registering, you will receive 25 ETH initial tokens that you
                can use to bid on courses. Each student can only register once
                per semester.
              </p>

              {!account && (
                <Alert className="mb-4">
                  <Wallet className="h-4 w-4" />
                  <AlertTitle>Wallet Required</AlertTitle>
                  <AlertDescription>
                    You need to connect your Ethereum wallet to register.
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-sm text-muted-foreground">
                Note: Registration is a blockchain transaction that requires gas
                fees.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>

          {success ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          ) : !account ? (
            <Button onClick={handleConnect}>Connect Wallet</Button>
          ) : (
            <Button onClick={handleRegister} disabled={isRegistering}>
              {isRegistering ? "Registering..." : "Register"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
