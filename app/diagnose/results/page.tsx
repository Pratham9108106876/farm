"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MobileNav } from "@/components/mobile-nav"
import { DiagnosisResultCard } from "@/components/diagnosis-result"
import { useLanguage } from "@/components/language-provider"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { DiagnosisResult } from "@/lib/types"
import { ArrowLeft, Save, Share2, AlertCircle } from "lucide-react"

export default function ResultsPage() {
  const [result, setResult] = useState<DiagnosisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    // Get diagnosis result from session storage
    const storedResult = sessionStorage.getItem("diagnosisResult")
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult))
      } catch (e) {
        setError("Could not parse diagnosis result")
        console.error("Error parsing diagnosis result:", e)
      }
    } else {
      // If no result, redirect back to diagnose page
      router.push("/diagnose")
    }
  }, [router])

  const handleSave = async () => {
    if (!result) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      const response = await fetch("/api/diagnoses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          result,
          imageUrl: sessionStorage.getItem("capturedImage"),
          isOffline: result.isOffline || false,
          notes: result.reasoning || "",
        }),
      })

      if (response.ok) {
        setSaveSuccess(true)
        // Wait a moment to show success message
        setTimeout(() => {
          router.push("/history")
        }, 1500)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save diagnosis")
      }
    } catch (error) {
      console.error("Error saving diagnosis:", error)
      setError(error instanceof Error ? error.message : "Failed to save diagnosis")
    } finally {
      setIsSaving(false)
    }
  }

  const handleShare = () => {
    if (!result) return

    // Use Web Share API if available
    if (navigator.share) {
      navigator.share({
        title: `Plant Disease: ${result.disease.name}`,
        text: `I found ${result.disease.name} in my plant using Farmers AI Assistant.`,
        url: window.location.href,
      })
    } else {
      // Fallback for browsers that don't support Web Share API
      alert("Sharing is not supported in this browser.")
    }
  }

  if (!result) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>{t("loading")}</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col pb-16">
      <div className="p-4 border-b flex items-center">
        <Button variant="ghost" size="icon" onClick={() => router.push("/diagnose")} className="mr-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">{t("diagnosisResults")}</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {saveSuccess && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-800 dark:text-green-200">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Diagnosis saved successfully. Redirecting to history...</AlertDescription>
          </Alert>
        )}

        <div className="aspect-[4/3] bg-black rounded-lg overflow-hidden mb-4">
          <img
            src={sessionStorage.getItem("capturedImage") || ""}
            alt="Plant image"
            className="w-full h-full object-cover"
          />
        </div>

        <DiagnosisResultCard result={result} />

        {result.detectedCrop && (
          <div className="rounded-lg border p-4 mt-2">
            <h3 className="font-medium mb-2">{t("detectedCrop")}</h3>
            <p className="text-sm text-muted-foreground">
              <strong>{t("name") || "Name"}:</strong> {result.detectedCrop.name}
              {result.detectedCrop.scientific_name && (
                <span className="block italic">{result.detectedCrop.scientific_name}</span>
              )}
            </p>
          </div>
        )}

        {result.reasoning && (
          <div className="rounded-lg border p-4 mt-2">
            <h3 className="font-medium mb-2">{t("analysisDetails")}</h3>
            <p className="text-sm text-muted-foreground">{result.reasoning}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mt-6">
          <Button onClick={handleSave} className="flex items-center justify-center" disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? t("loading") : t("save")}
          </Button>
          <Button variant="outline" onClick={handleShare} className="flex items-center justify-center">
            <Share2 className="mr-2 h-4 w-4" />
            {t("share")}
          </Button>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
