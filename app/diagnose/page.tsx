"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MobileNav } from "@/components/mobile-nav"
import { CameraCapture } from "@/components/camera-capture"
import { CropSelector } from "@/components/crop-selector"
import { ModeToggle } from "@/components/mode-toggle"
import { useLanguage } from "@/components/language-provider"
import { useAppMode } from "@/components/app-mode-provider"
import { Loader2, AlertCircle, WifiOff } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { AppMode } from "@/lib/types"

export default function DiagnosePage() {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [selectedCropId, setSelectedCropId] = useState<number | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { t } = useLanguage()
  const { appMode, setAppMode } = useAppMode()

  const handleCapture = (imageData: string) => {
    setError(null)
    setCapturedImage(imageData)
    // Also store in session storage immediately in case we need it
    if (typeof window !== "undefined") {
      sessionStorage.setItem("capturedImage", imageData)
    }
  }

  const handleUpload = (file: File) => {
    setError(null)
    setUploadedFile(file)
  }

  const handleCropSelect = (cropId: number) => {
    setError(null)
    setSelectedCropId(cropId)
  }

  const handleModeChange = (mode: AppMode) => {
    setError(null)
    setAppMode(mode)
  }

  const analyzePlant = async () => {
    if (!capturedImage) return

    setIsAnalyzing(true)
    setError(null)

    try {
      // Determine which API endpoint to use based on the selected mode
      const apiEndpoint = appMode === "online" ? "/api/diagnose/online" : "/api/diagnose/offline"

      console.log(`Sending request to ${apiEndpoint}${appMode === "offline" ? ` with cropId: ${selectedCropId}` : ""}`)

      // For offline mode, we need a crop ID
      if (appMode === "offline" && !selectedCropId) {
        throw new Error("Please select a crop for offline diagnosis")
      }

      // Make the API call with appropriate parameters
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: capturedImage,
          ...(appMode === "offline" && { cropId: selectedCropId }),
        }),
      })

      // If the response is not OK, try to get the error details from the response
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        console.error("API error response:", errorData)

        if (errorData && errorData.error) {
          throw new Error(`${errorData.error}: ${errorData.message || ""}`)
        } else {
          throw new Error(`API request failed with status ${response.status}`)
        }
      }

      const result = await response.json()
      console.log("Diagnosis result:", result)

      // Store result in session storage for the results page
      if (typeof window !== "undefined") {
        // Add a flag to indicate if this was from offline mode
        if (appMode === "offline" || result.isOffline) {
          result.isOffline = true
        }

        sessionStorage.setItem("diagnosisResult", JSON.stringify(result))
        // Ensure the image is stored
        if (capturedImage) {
          sessionStorage.setItem("capturedImage", capturedImage)
        }
      }

      router.push("/diagnose/results")
    } catch (error) {
      console.error("Error analyzing plant:", error)

      // If online mode fails, suggest switching to offline mode
      if (appMode === "online") {
        setError(
          `Failed to analyze the plant image online: ${error instanceof Error ? error.message : "Unknown error"}. Try switching to offline mode.`,
        )
      } else {
        setError(error instanceof Error ? error.message : "Failed to analyze the plant image")
      }
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Function to switch to offline mode and retry analysis
  const switchToOfflineAndRetry = () => {
    setAppMode("offline")
    setError(null)

    // Wait a moment for state to update, then retry
    setTimeout(() => {
      if (capturedImage && selectedCropId) {
        analyzePlant()
      }
    }, 100)
  }

  return (
    <main className="flex min-h-screen flex-col pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">{t("diagnose")}</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <ModeToggle onChange={handleModeChange} />

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="space-y-2">
              <p>{error}</p>
              {appMode === "online" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchToOfflineAndRetry}
                  className="mt-2 flex items-center"
                >
                  <WifiOff className="mr-2 h-4 w-4" />
                  {t("switchToOfflineAndRetry") || "Switch to Offline Mode & Retry"}
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        <CameraCapture onCapture={handleCapture} onUpload={handleUpload} />

        <Card>
          <CardContent className="p-4 space-y-4">
            {appMode === "offline" && (
              <>
                <h2 className="font-medium">{t("selectCrop")}</h2>
                <CropSelector onSelect={handleCropSelect} />
              </>
            )}

            <Button
              onClick={analyzePlant}
              disabled={!capturedImage || (appMode === "offline" && !selectedCropId) || isAnalyzing}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("loading")}
                </>
              ) : (
                `${t("analyzePlant")} (${appMode === "online" ? t("onlineMode") : t("offlineMode")})`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </main>
  )
}
