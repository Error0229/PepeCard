"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface GameBoardProps {
  board: boolean[][]
  onFlip: (index: number) => void
  gameActive: boolean
  loading: boolean
}

export default function GameBoard({ board, onFlip, gameActive, loading }: GameBoardProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  return (
    <div className="relative">
      <div className="grid grid-cols-5 gap-2 md:gap-4 aspect-square">
        {Array.from({ length: 5 }).map((_, rowIndex) =>
          Array.from({ length: 5 }).map((_, colIndex) => {
            const index = rowIndex * 5 + colIndex
            const flipped = board[rowIndex][colIndex]

            return (
              <Card
                key={index}
                className={cn(
                  "relative flex items-center justify-center cursor-pointer transition-all duration-300 transform",
                  flipped ? "bg-muted" : "hover:shadow-lg hover:-translate-y-1",
                  hoverIndex === index && !flipped && gameActive ? "ring-2 ring-primary" : "",
                  !gameActive && !flipped ? "opacity-50 cursor-not-allowed" : "",
                )}
                onClick={() => {
                  if (gameActive && !flipped && !loading) {
                    onFlip(index)
                  }
                }}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  {flipped ? (
                    <span className="text-2xl md:text-4xl">✓</span>
                  ) : (
                    <span className="text-2xl md:text-4xl opacity-20">?</span>
                  )}
                </div>
              </Card>
            )
          }),
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
  )
}

