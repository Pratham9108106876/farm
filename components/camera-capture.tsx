"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useLanguage } from "@/components/language-provider"
import { Camera, Upload, RefreshCw, AlertCircle, ImageIcon } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface CameraCaptureProps {
  onCapture: (imageData: string) => void
  onUpload: (file: File) => void
}

export function CameraCapture({ onCapture, onUpload }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isBrowserSupported, setIsBrowserSupported] = useState<boolean>(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { t } = useLanguage()

  // Check if we're in a browser environment that supports camera
  useEffect(() => {
    // Check if we're in a browser and if the required APIs exist
    const isSupported =
      typeof window !== "undefined" &&
      typeof navigator !== "undefined" &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function"

    setIsBrowserSupported(isSupported)

    if (!isSupported) {
      setCameraError("Camera access is not supported in this environment. Please use the upload option instead.")
    } else {
      // Only try to start camera if browser is supported
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    // Don't try to access camera if browser doesn't support it
    if (!isBrowserSupported) return

    try {
      setCameraError(null)

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("Error accessing camera:", error)
      setCameraError(
        error instanceof Error
          ? error.message
          : "Unable to access camera. Please check permissions or try uploading an image instead.",
      )
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const video = videoRef.current

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      const context = canvas.getContext("2d")
      if (context) {
        // Draw the video frame to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Get the image data with high quality
        const imageData = canvas.toDataURL("image/jpeg", 0.9)
        setCapturedImage(imageData)
        onCapture(imageData)
        stopCamera()
      }
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setCapturedImage(result)
        onCapture(result)
      }
      reader.readAsDataURL(file)
      onUpload(file)
    }
  }

  const resetCapture = () => {
    setCapturedImage(null)
    if (isBrowserSupported) {
      startCamera()
    }
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardContent className="p-0 relative">
        {!capturedImage ? (
          <>
            <div className="relative aspect-[4/3] bg-black">
              {cameraError || !isBrowserSupported ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gray-100 dark:bg-gray-800">
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>{t("cameraNotAvailable") || "Camera Not Available"}</AlertTitle>
                    <AlertDescription>
                      {cameraError || t("useUploadInstead") || "Please use the upload option instead."}
                    </AlertDescription>
                  </Alert>
                  <ImageIcon className="h-16 w-16 text-gray-400 mb-2" />
                  <p className="text-center text-sm text-muted-foreground">
                    {t("uploadImageInstruction") || "Upload an image of your plant to diagnose diseases"}
                  </p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  onError={() => setCameraError("Failed to initialize camera stream")}
                />
              )}
              {!cameraError && isBrowserSupported && (
                <div className="absolute inset-0 border-4 border-dashed border-white/50 m-4 pointer-events-none"></div>
              )}
            </div>
            <div className={`grid ${isBrowserSupported ? "grid-cols-2" : "grid-cols-1"} gap-2 p-4`}>
              {isBrowserSupported && !cameraError && (
                <Button onClick={captureImage} className="flex items-center justify-center">
                  <Camera className="mr-2 h-4 w-4" />
                  {t("takePicture")}
                </Button>
              )}
              <Button
                variant={isBrowserSupported && !cameraError ? "outline" : "default"}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center"
              >
                <Upload className="mr-2 h-4 w-4" />
                {t("uploadImage")}
              </Button>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </>
        ) : (
          <>
            <div className="relative aspect-[4/3] bg-black">
              <img
                src={capturedImage || "/placeholder.svg"}
                alt="Captured plant"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4">
              <Button onClick={resetCapture} variant="outline" className="w-full flex items-center justify-center">
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("retakePhoto") || "Retake Photo"}
              </Button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  )
}
