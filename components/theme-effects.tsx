"use client"

import { useTheme } from "@/lib/theme-context"
import { useEffect, useState } from "react"

export function ThemeEffects() {
  const { theme } = useTheme()
  const [bats, setBats] = useState<Array<{ id: number; left: number; top: number; delay: number }>>([])

  useEffect(() => {
    if (theme === "halloween") {
      const newBats = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        left: Math.random() * 80 + 10,
        top: Math.random() * 60 + 20,
        delay: Math.random() * 3,
      }))
      setBats(newBats)
    } else {
      setBats([])
    }
  }, [theme])

  if (theme === "halloween") {
    return (
      <>
        {bats.map((bat) => (
          <div
            key={bat.id}
            className="halloween-bat"
            style={{
              left: `${bat.left}%`,
              top: `${bat.top}%`,
              animationDelay: `${bat.delay}s`,
            }}
          >
            🦇
          </div>
        ))}
      </>
    )
  }

  return null
}
