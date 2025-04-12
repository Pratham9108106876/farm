"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { AppMode } from "@/lib/types"

type AppModeContextType = {
  appMode: AppMode
  setAppMode: (mode: AppMode) => void
}

const AppModeContext = createContext<AppModeContextType>({
  appMode: "online",
  setAppMode: () => {},
})

export const useAppMode = () => useContext(AppModeContext)

export const AppModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [appMode, setAppMode] = useState<AppMode>("online")

  // Load the app mode from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem("appMode") as AppMode
    if (savedMode && (savedMode === "online" || savedMode === "offline")) {
      setAppMode(savedMode)
    }
  }, [])

  // Save the app mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("appMode", appMode)
  }, [appMode])

  return <AppModeContext.Provider value={{ appMode, setAppMode }}>{children}</AppModeContext.Provider>
}
