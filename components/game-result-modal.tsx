"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

interface GameResultModalProps {
  open: boolean;
  onClose: () => void;
  result: "win" | "lose";
  reward?: string;
}

export default function GameResultModal({
  open,
  onClose,
  result,
  reward,
}: GameResultModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open && result === "win") {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [open, result]);

  return (
    <>
      {showConfetti && <Confetti recycle={false} />}
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle
              className={
                result === "win"
                  ? "text-green-500 text-2xl"
                  : "text-red-500 text-2xl"
              }
            >
              {result === "win" ? "Congratulations! 🎉" : "Game Over! 💀"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center text-lg">
              {result === "win"
                ? `You've collected ${reward} PC tokens!`
                : "You hit the ghost card!"}
            </p>
            <div className="flex justify-center">
              <Button onClick={onClose}>
                {result === "win" ? "Collect Rewards" : "Try Again"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
