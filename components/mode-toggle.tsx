"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/components/language-provider"
import { useAppMode } from "@/components/app-mode-provider"
import { Wifi, WifiOff } from "lucide-react"

interface ModeToggleProps {
  onChange?: (mode: "online" | "offline") => void
}

export function ModeToggle({ onChange }: ModeToggleProps) {
  const { appMode, setAppMode } = useAppMode()
  const [isOnline, setIsOnline] = useState(appMode === "online")
  const { t } = useLanguage()

  // Update local state when global app mode changes
  useEffect(() => {
    setIsOnline(appMode === "online")
  }, [appMode])

  const handleToggle = (checked: boolean) => {
    const newMode = checked ? "online" : "offline"
    setIsOnline(checked)
    setAppMode(newMode)

    if (onChange) {
      onChange(newMode)
    }
  }

  return (
    <div className="flex items-center space-x-4 rounded-lg border p-4">
      <div className="flex-1 space-y-1">
        <div className="flex items-center">
          {isOnline ? (
            <Wifi className="mr-2 h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="mr-2 h-4 w-4 text-gray-500" />
          )}
          <p className="text-sm font-medium leading-none">{isOnline ? t("onlineMode") : t("offlineMode")}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {isOnline
            ? t("onlineModeDescription") || "Using cloud AI for more accurate results (requires internet)"
            : t("offlineModeDescription") || "Using on-device AI (works without internet)"}
        </p>
      </div>
      <Switch checked={isOnline} onCheckedChange={handleToggle} />
    </div>
  )
}
