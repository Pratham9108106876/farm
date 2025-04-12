"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { MobileNav } from "@/components/mobile-nav"
import { LanguageSelector } from "@/components/language-selector"
import { ModeToggle } from "@/components/mode-toggle"
import { useLanguage } from "@/components/language-provider"
import { Download, Trash2, HardDrive, Database } from "lucide-react"

export default function SettingsPage() {
  const [offlineDataDownloaded, setOfflineDataDownloaded] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const { t } = useLanguage()

  const handleDownloadOfflineData = () => {
    // Simulate downloading offline data
    setTimeout(() => {
      setOfflineDataDownloaded(true)
      localStorage.setItem("offlineDataDownloaded", "true")
    }, 2000)
  }

  const handleClearData = () => {
    // Clear local storage and cached data
    localStorage.clear()
    sessionStorage.clear()
    setOfflineDataDownloaded(false)
    alert("All local data has been cleared")
  }

  return (
    <main className="flex min-h-screen flex-col pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">{t("settings")}</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Language</CardTitle>
            <CardDescription>Select your preferred language</CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSelector />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>App Mode</CardTitle>
            <CardDescription>Choose between online and offline mode</CardDescription>
          </CardHeader>
          <CardContent>
            <ModeToggle />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offline Data</CardTitle>
            <CardDescription>Download data for offline use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4" />
                <Label htmlFor="offline-data">Offline model (~50MB)</Label>
              </div>
              <Button
                variant={offlineDataDownloaded ? "outline" : "default"}
                onClick={handleDownloadOfflineData}
                disabled={offlineDataDownloaded}
              >
                {offlineDataDownloaded ? (
                  "Downloaded"
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <Label htmlFor="crop-data">Crop database (~5MB)</Label>
              </div>
              <Button variant="outline" onClick={() => {}}>
                <Download className="mr-2 h-4 w-4" />
                Update
              </Button>
            </div>

            <Button variant="destructive" className="w-full mt-4" onClick={handleClearData}>
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Local Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage notification settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications">Enable notifications</Label>
              <Switch id="notifications" checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>Manage location settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="location">Enable location</Label>
              <Switch id="location" checked={locationEnabled} onCheckedChange={setLocationEnabled} />
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </main>
  )
}
