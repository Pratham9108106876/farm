"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/components/language-provider"
import { Mic, MicOff, Send, ImageIcon, Loader2, VolumeX, Volume2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  imageUrl?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isImageUploading, setIsImageUploading] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { t, language } = useLanguage()

  // Add initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: t("chatWelcomeMessage") || "Hello! I'm your farming assistant. How can I help you today?",
          timestamp: new Date(),
        },
      ])
    }
  }, [messages.length, t])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Start recording function
  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone",
      })
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("Could not access microphone. Please check permissions.")
      setIsRecording(false)
    }
  }

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
      toast({
        title: "Recording stopped",
        description: "Processing your speech...",
      })
    }
  }

  // Transcribe audio function
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      setIsProcessing(true)
      const formData = new FormData()
      formData.append("audio", audioBlob)
      formData.append("language", language)

      toast({
        title: "Transcribing audio",
        description: "Please wait while we process your speech...",
      })

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to transcribe audio")
      }

      const data = await response.json()
      if (data.text) {
        setInput(data.text)
        toast({
          title: "Transcription complete",
          description: `"${data.text.substring(0, 30)}${data.text.length > 30 ? "..." : ""}"`,
        })
      } else {
        setError("Could not transcribe audio. Please try again.")
        toast({
          title: "Transcription failed",
          description: "We couldn't understand what you said. Please try again or type your message.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Error transcribing audio:", err)
      setError("Failed to process audio. Please try typing your message instead.")
      toast({
        title: "Transcription error",
        description: "There was a problem processing your speech. Please try typing instead.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsImageUploading(true)
      setError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setSelectedImage(result)
        setIsImageUploading(false)
      }
      reader.onerror = () => {
        setError("Failed to read image file")
        setIsImageUploading(false)
      }
      reader.readAsDataURL(file)
    }
  }

  // Send message function
  const sendMessage = async () => {
    if ((!input.trim() && !selectedImage) || isProcessing) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      imageUrl: selectedImage || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setSelectedImage(null)
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          imageUrl: selectedImage,
          language,
          history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString() + "-response",
        role: "assistant",
        content: data.text,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Text-to-speech for the response
      if (data.text) {
        speakText(data.text)
      }
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Failed to get a response. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Text-to-speech function
  const speakText = async (text: string) => {
    if ("speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel()

      setIsSpeaking(true)

      const utterance = new SpeechSynthesisUtterance(text)

      // Set language based on current app language
      switch (language) {
        case "hindi":
          utterance.lang = "hi-IN"
          break
        case "tamil":
          utterance.lang = "ta-IN"
          break
        case "telugu":
          utterance.lang = "te-IN"
          break
        case "bengali":
          utterance.lang = "bn-IN"
          break
        case "marathi":
          utterance.lang = "mr-IN"
          break
        case "gujarati":
          utterance.lang = "gu-IN"
          break
        case "punjabi":
          utterance.lang = "pa-IN"
          break
        default:
          utterance.lang = "en-US"
      }

      utterance.onend = () => {
        setIsSpeaking(false)
      }

      utterance.onerror = (event) => {
        console.error("Speech synthesis error:", event)
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(utterance)
    }
  }

  // Play text-to-speech for a specific message
  const playMessageAudio = (text: string) => {
    if (isSpeaking) {
      stopSpeaking()
    } else {
      speakText(text)
    }
  }

  // Stop speaking
  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage()
  }

  return (
    <main className="flex min-h-screen flex-col pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">{t("chat") || "Chat"}</h1>
      </div>

      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`flex ${message.role === "user" ? "flex-row-reverse" : "flex-row"} items-start gap-2 max-w-[80%]`}
                >
                  <Avatar className={`${message.role === "user" ? "bg-primary" : "bg-secondary"} h-8 w-8`}>
                    <AvatarFallback>{message.role === "user" ? "U" : "AI"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Card className={`${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-card"}`}>
                      <CardContent className="p-3">
                        {message.imageUrl && (
                          <div className="mb-2 rounded-md overflow-hidden">
                            <img
                              src={message.imageUrl || "/placeholder.svg"}
                              alt="Uploaded"
                              className="max-h-48 w-auto object-contain"
                            />
                          </div>
                        )}
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        {message.role === "assistant" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 h-6 px-2 text-xs"
                            onClick={() => playMessageAudio(message.content)}
                          >
                            {isSpeaking ? <VolumeX className="h-3 w-3 mr-1" /> : <Volume2 className="h-3 w-3 mr-1" />}
                            {isSpeaking ? t("stopSpeaking") : t("listen") || "Listen"}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {error && (
          <Alert variant="destructive" className="mx-4 my-2">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedImage && (
          <div className="mx-4 my-2 p-2 border rounded-md bg-muted/50 relative">
            <img src={selectedImage || "/placeholder.svg"} alt="Selected" className="h-16 w-auto object-contain" />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </Button>
          </div>
        )}

        <div className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
              >
                <ImageIcon className="h-5 w-5" />
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("typeMessage") || "Type a message..."}
                disabled={isProcessing}
                className="flex-1"
              />

              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isProcessing}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button type="submit" size="icon" disabled={(!input.trim() && !selectedImage) || isProcessing}>
                {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </div>

            {isSpeaking && (
              <Button type="button" variant="outline" size="sm" onClick={stopSpeaking} className="mt-2">
                <VolumeX className="h-4 w-4 mr-2" />
                {t("stopSpeaking") || "Stop Speaking"}
              </Button>
            )}
          </form>
        </div>
      </div>

      <MobileNav />
    </main>
  )
}
