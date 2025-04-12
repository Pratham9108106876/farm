import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Gemini API client with the provided API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Language mapping for Gemini
const languageMap: Record<string, string> = {
  english: "English",
  hindi: "Hindi",
  tamil: "Tamil",
  telugu: "Telugu",
  bengali: "Bengali",
  marathi: "Marathi",
  gujarati: "Gujarati",
  punjabi: "Punjabi",
}

export async function POST(request: Request) {
  try {
    const { message, imageUrl, language = "english", history = [] } = await request.json()

    // Validate inputs
    if (!message && !imageUrl) {
      return NextResponse.json({ error: "Message or image is required" }, { status: 400 })
    }

    // Create a model instance - using gemini-1.5-flash for multimodal capabilities
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Prepare the prompt with farming context and language preference
    const systemPrompt = `
      You are a helpful farming assistant that specializes in agricultural advice, 
      plant disease identification, crop management, and sustainable farming practices.
      
      Please respond in ${languageMap[language] || "English"}.
      
      If the user provides an image of a plant:
      1. Identify the crop/plant in the image
      2. Check for any visible diseases or pest damage
      3. Provide diagnosis and treatment recommendations
      4. Suggest preventive measures
      
      For text questions:
      - Provide concise, practical advice for farmers
      - Focus on sustainable and accessible solutions
      - Consider local farming contexts in India
      - Explain agricultural concepts in simple terms
      
      Always be respectful, helpful, and provide actionable advice.
    `

    // Prepare the content parts for the API call
    const contentParts = []

    // Add system prompt and conversation history
    contentParts.push(systemPrompt)

    // Add conversation history
    if (history.length > 0) {
      const historyText = history
        .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
        .join("\n\n")
      contentParts.push(`Previous conversation:\n${historyText}`)
    }

    // Add the current message
    contentParts.push(`User: ${message || "Please analyze this image"}`)

    // Add image if provided
    if (imageUrl) {
      // Extract base64 data from the image string
      const base64Image = imageUrl.split(",")[1]

      contentParts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image,
        },
      })
    }

    // Generate content with Gemini
    const result = await model.generateContent(contentParts)
    const response = await result.response
    const text = response.text()

    return NextResponse.json({ text })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      {
        error: "Failed to process request",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
