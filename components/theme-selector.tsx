"use client"

import { useTheme } from "@/lib/theme-context"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex gap-4 justify-center">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setTheme("halloween")}
          variant={theme === "halloween" ? "default" : "outline"}
          className={`${theme === "halloween" ? "halloween-glow" : ""} relative overflow-hidden`}
        >
          Halloween
        </Button>
      </motion.div>

      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setTheme("galaxy")}
          variant={theme === "galaxy" ? "default" : "outline"}
          className={`${theme === "galaxy" ? "galaxy-glow" : ""} relative overflow-hidden`}
        >
          Galaxy
        </Button>
      </motion.div>
    </div>
  )
}
