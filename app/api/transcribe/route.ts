import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Language mapping for transcription
const languageMap: Record<string, string> = {
  english: "en",
  hindi: "hi",
  tamil: "ta",
  telugu: "te",
  bengali: "bn",
  marathi: "mr",
  gujarati: "gu",
  punjabi: "pa",
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = (formData.get("language") as string) || "english"

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    console.log("Received audio file:", audioFile.name, "Size:", audioFile.size, "Type:", audioFile.type)

    // Convert audio to base64
    const buffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(buffer).toString("base64")

    console.log("Audio converted to base64, length:", base64Audio.length)

    // Use Gemini to transcribe the audio
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Transcribe the following audio accurately.
      The audio is in ${languageMap[language] || "en"} language.
      Only return the transcribed text, nothing else.
      If you can't hear anything clearly, return what you can make out.
    `

    console.log("Sending transcription request to Gemini API")

    try {
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "audio/wav",
            data: base64Audio,
          },
        },
      ])

      const response = await result.response
      const text = response.text().trim()

      console.log("Transcription result:", text)

      return NextResponse.json({ text })
    } catch (genaiError) {
      console.error("Gemini API error:", genaiError)

      // Fallback to a simpler prompt if the first attempt fails
      try {
        console.log("Trying fallback transcription approach")

        const fallbackResult = await model.generateContent([
          "Please transcribe this audio recording. Just return the text content.",
          {
            inlineData: {
              mimeType: "audio/wav",
              data: base64Audio,
            },
          },
        ])

        const fallbackResponse = await fallbackResult.response
        const fallbackText = fallbackResponse.text().trim()

        console.log("Fallback transcription result:", fallbackText)

        return NextResponse.json({ text: fallbackText })
      } catch (fallbackError) {
        console.error("Fallback transcription failed:", fallbackError)
        throw new Error("Both transcription attempts failed")
      }
    }
  } catch (error) {
    console.error("Error in transcription API:", error)
    return NextResponse.json(
      {
        error: "Failed to transcribe audio",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
