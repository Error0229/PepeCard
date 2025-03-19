"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingRewardProps {
  value: string;
  isGhost?: boolean;
  position: { x: number; y: number };
}

export default function FloatingReward({
  value,
  isGhost,
  position,
}: FloatingRewardProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 1 }}
          animate={{ opacity: 1, y: -50, scale: 1.2 }}
          exit={{ opacity: 0, y: -100, scale: 0.8 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className={`fixed ${
            isGhost ? "text-red-500" : "text-green-500"
          } font-bold text-2xl pointer-events-none z-50`}
          style={{
            left: position.x + window.scrollX,
            top: position.y + window.scrollY,
            transform: "translate(-50%, -50%)",
          }}
        >
          {isGhost ? "💀" : `+${Number(value).toLocaleString()} PC`}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
