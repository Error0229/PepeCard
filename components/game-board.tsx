"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import FloatingReward from "./floating-reward";

interface GameBoardProps {
  board: boolean[][];
  onFlip: (index: number, element: HTMLDivElement) => void;
  gameActive: boolean;
  loading: boolean;
  isGameOver?: boolean;
  ghostPosition?: number;
}

export default function GameBoard({
  board,
  onFlip,
  gameActive,
  loading,
  isGameOver = false,
  ghostPosition,
}: GameBoardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  return (
    <div className="relative aspect-square w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-5 gap-2 md:gap-4 h-full">
        {Array.from({ length: 5 }).map((_, rowIndex) =>
          Array.from({ length: 5 }).map((_, colIndex) => {
            const index = rowIndex * 5 + colIndex;
            const flipped = board[rowIndex][colIndex];
            const isGhost = isGameOver && ghostPosition === index;

            return (
              <Card
                key={index}
                ref={(el) => {
                  cardsRef.current[index] = el;
                }}
                className={cn(
                  "relative flex items-center justify-center cursor-pointer transition-all duration-300 transform",
                  flipped ? "bg-muted" : "hover:shadow-lg hover:-translate-y-1",
                  hoverIndex === index && !flipped && gameActive
                    ? "ring-2 ring-primary"
                    : "",
                  !gameActive && !flipped
                    ? "opacity-50 cursor-not-allowed"
                    : "",
                  isGhost ? "bg-red-500/10" : ""
                )}
                onClick={() => {
                  if (
                    gameActive &&
                    !flipped &&
                    !loading &&
                    cardsRef.current[index]
                  ) {
                    onFlip(index, cardsRef.current[index]!);
                  }
                }}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {flipped ? (
                    <span className="text-2xl md:text-4xl">
                      {isGhost ? "💀" : "✓"}
                    </span>
                  ) : (
                    <span className="text-2xl md:text-4xl opacity-20">?</span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      )}

      {!gameActive && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
          <div className="text-xl font-medium text-center p-4 rounded-lg">
            {board[0][0] ? "Game Over" : "Start a game to play"}
          </div>
        </div>
      )}
    </div>
  );
}
