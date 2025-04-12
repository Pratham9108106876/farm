import { NextResponse } from "next/server"
import sql from "@/lib/db"
import { initializeDatabase, getMockCrops, getMockDiseases } from "@/lib/db-init"
import type { Disease } from "@/lib/types"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

// Initialize the Gemini API client with the provided API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

// Initialize database flag
let isDatabaseInitialized = false

// Function to save base64 image to disk and return the file path
async function saveBase64ImageToFile(base64Image: string): Promise<string> {
  try {
    // Strip the data URL prefix if present
    const base64Data = base64Image.includes(",") ? base64Image.split(",")[1] : base64Image

    // Create unique filename
    const filename = `${uuidv4()}.jpg`

    // Define the upload directory - make sure this exists and is writable
    const uploadDir = path.join(process.cwd(), "public", "uploads")

    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }

    const filepath = path.join(uploadDir, filename)

    // Write the file
    fs.writeFileSync(filepath, Buffer.from(base64Data, "base64"))

    // Return the public URL path
    return `/uploads/${filename}`
  } catch (error) {
    console.error("Error saving image:", error)
    throw new Error("Failed to save image")
  }
}

export async function POST(request: Request) {
  try {
    // Log the start of the request
    console.log("Starting plant diagnosis...")

    // Try to initialize the database if not already done
    if (!isDatabaseInitialized) {
      isDatabaseInitialized = await initializeDatabase()
    }

    const { image, cropId } = await request.json()

    if (!image) {
      console.log("Missing required image")
      return NextResponse.json({ error: "Missing required image" }, { status: 400 })
    }

    // Save the image file and get a URL
    let imageUrl
    try {
      imageUrl = await saveBase64ImageToFile(image)
      console.log("Image saved to:", imageUrl)
    } catch (imageError) {
      console.error("Failed to save image:", imageError)
      // Continue with analysis but we'll store a placeholder
      imageUrl = "/placeholder-image.jpg"
    }

    // Extract base64 data from the image string
    let base64Image
    try {
      const parts = image.split(",")
      base64Image = parts.length === 2 ? parts[1] : image

      // Validate base64 data
      if (!base64Image || base64Image.length < 100) {
        throw new Error("Invalid or empty image data")
      }

      console.log("Image data validated, length:", base64Image.length)
    } catch (imageFormatError) {
      console.error("Image format error:", imageFormatError)
      return NextResponse.json(
        {
          error: "Invalid image format",
          details: imageFormatError instanceof Error ? imageFormatError.message : String(imageFormatError),
        },
        { status: 400 },
      )
    }

    // Proceed with AI analysis
    try {
      // Create a model instance - using the newer gemini-1.5-flash model
      console.log("Initializing Gemini model (gemini-1.5-flash)")
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // First, identify the crop from the image
      console.log("Identifying crop from image...")
      const cropIdentificationPrompt = `
        Analyze this image and identify the crop or plant species shown.
        Return your answer as JSON in this format:
        {
          "cropName": "Name of the crop",
          "confidence": 0.85
        }
      `

      const cropResult = await model.generateContent([
        cropIdentificationPrompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ])

      const cropResponse = await cropResult.response
      const cropTextResponse = cropResponse.text()
      console.log("Crop identification response:", cropTextResponse)

      // Parse the JSON response for crop identification
      let cropIdentification
      try {
        const jsonMatch = cropTextResponse.match(/\{[\s\S]*\}/)
        const jsonText = jsonMatch ? jsonMatch[0] : "{}"
        cropIdentification = JSON.parse(jsonText)
        console.log("Identified crop:", cropIdentification.cropName)
      } catch (parseError) {
        console.error("Error parsing crop identification:", parseError)
        cropIdentification = { cropName: "Unknown", confidence: 0.5 }
      }

      // Find matching crop in database or create a new one
      let cropInfo
      try {
        cropInfo = await sql`
          SELECT id, name, scientific_name FROM crops
          WHERE LOWER(name) = LOWER(${cropIdentification.cropName})
          LIMIT 1
        `

        if (!cropInfo || cropInfo.length === 0) {
          console.log("Crop not found in database, creating new entry")
          // Create a new crop entry
          cropInfo = await sql`
            INSERT INTO crops (name, description)
            VALUES (${cropIdentification.cropName}, 'Auto-detected crop')
            RETURNING id, name, scientific_name
          `
        }
      } catch (dbError) {
        console.error("Database error with crop:", dbError)
        // Use mock data as fallback
        const mockCrops = getMockCrops()
        cropInfo = [{ id: 999, name: cropIdentification.cropName, scientific_name: null }]
      }

      const cropId = cropInfo[0].id
      console.log(`Using crop ID: ${cropId}`)

      // Get all possible diseases for this crop
      let diseases
      try {
        diseases = await sql<Disease[]>`
          SELECT * FROM diseases
          WHERE crop_id = ${cropId}
        `

        if (!diseases || diseases.length === 0) {
          // If no diseases found for this crop, get all diseases
          diseases = await sql<Disease[]>`
            SELECT * FROM diseases
            LIMIT 10
          `

          if (!diseases || diseases.length === 0) {
            // If still no diseases, use mock data
            console.log("No diseases found in database, using mock data")
            diseases = getMockDiseases(1) // Use generic diseases
          }
        }
      } catch (dbError) {
        console.error("Database error fetching diseases:", dbError)
        // Use mock data if database query fails
        console.log("Using mock disease data due to database error")
        diseases = getMockDiseases(1) // Use generic diseases
      }

      console.log(`Found ${diseases.length} possible diseases`)

      // Prepare prompt with context about the crop and possible diseases
      const prompt = `
        Analyze this image of a ${cropIdentification.cropName} plant and identify any diseases.
        
        Possible diseases include:
        ${diseases.map((d) => `- ${d.name}: ${d.symptoms || "Unknown symptoms"}`).join("\n")}
        
        Please identify the most likely disease and provide:
        1. The name of the disease
        2. Your confidence level (0-1)
        3. Detailed reasoning based on visual symptoms
        
        Format your response as JSON like this:
        {
          "diseaseName": "Disease name",
          "confidence": 0.85,
          "reasoning": "Detailed explanation of visual symptoms",
          "treatments": {
            "organic": ["Treatment 1", "Treatment 2"],
            "chemical": ["Treatment 1", "Treatment 2"]
          }
        }
      `

      console.log("Sending disease diagnosis request to Gemini API")

      // Process with Gemini API
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ])

      console.log("Received response from Gemini")
      const response = await result.response
      const textResponse = response.text()
      console.log("Gemini raw response:", textResponse)

      // Parse the JSON response from Gemini
      let geminiAnalysis
      try {
        // Extract JSON from the response text (it might be wrapped in markdown code blocks)
        const jsonMatch =
          textResponse.match(/```json\n([\s\S]*?)\n```/) ||
          textResponse.match(/```\n([\s\S]*?)\n```/) ||
          textResponse.match(/\{[\s\S]*\}/)

        let jsonText
        if (jsonMatch) {
          jsonText = jsonMatch[0].startsWith("{") ? jsonMatch[0] : jsonMatch[1]
          console.log("Extracted JSON content")
        } else {
          throw new Error("Could not extract JSON from Gemini response")
        }

        console.log("Attempting to parse:", jsonText)
        geminiAnalysis = JSON.parse(jsonText)
        console.log("Successfully parsed JSON response")
      } catch (parseError) {
        console.error("Error parsing Gemini response:", parseError)

        // Fall back to a simplified detection
        geminiAnalysis = {
          diseaseName: diseases[0].name,
          confidence: 0.7,
          reasoning: "Could not parse AI response. Using fallback diagnosis.",
          treatments: {
            organic: diseases[0].organic_treatment
              ? diseases[0].organic_treatment.split(";").map((t) => t.trim())
              : ["Apply neem oil", "Use organic compost"],
            chemical: diseases[0].chemical_treatment
              ? diseases[0].chemical_treatment.split(";").map((t) => t.trim())
              : ["Apply fungicide", "Use appropriate pesticides"],
          },
        }
        console.log("Using fallback analysis")
      }

      // Find the matching disease from our database
      console.log("Finding matching disease in database")
      const matchedDisease =
        diseases.find((d) => d.name.toLowerCase() === geminiAnalysis.diseaseName?.toLowerCase()) || diseases[0] // Fallback to first disease if no match

      console.log("Matched disease:", matchedDisease.name)

      // Construct the result
      const diagnosisResult = {
        disease: matchedDisease,
        detectedCrop: {
          id: cropId,
          name: cropInfo[0].name,
          scientific_name: cropInfo[0].scientific_name,
        },
        confidence: geminiAnalysis.confidence || 0.7,
        reasoning: geminiAnalysis.reasoning || "Visual analysis complete",
        treatments: {
          organic:
            geminiAnalysis.treatments?.organic ||
            (matchedDisease.organic_treatment
              ? matchedDisease.organic_treatment.split(";").map((t) => t.trim())
              : ["Apply neem oil", "Use organic compost"]),
          chemical:
            geminiAnalysis.treatments?.chemical ||
            (matchedDisease.chemical_treatment
              ? matchedDisease.chemical_treatment.split(";").map((t) => t.trim())
              : ["Apply fungicide", "Use appropriate pesticides"]),
        },
      }

      console.log("Final diagnosis result prepared")

      // Save the diagnosis to the database - now with imageUrl instead of raw base64
      try {
        console.log("Saving diagnosis to database")
        await sql`
          INSERT INTO diagnoses (
            crop_id, 
            disease_id, 
            image_url, 
            confidence_score, 
            notes,
            is_offline
          ) VALUES (
            ${cropId}, 
            ${matchedDisease.id}, 
            ${imageUrl}, 
            ${diagnosisResult.confidence}, 
            ${geminiAnalysis.reasoning || null},
            false
          )
        `
        console.log("Diagnosis saved to database")
      } catch (dbError) {
        console.error("Database error saving diagnosis:", dbError)
        // Continue with the response even if DB save fails
      }

      return NextResponse.json(diagnosisResult)
    } catch (aiError) {
      console.error("AI processing error:", aiError)

      // If we get an error with the AI model, try to provide a fallback response
      try {
        console.log("AI processing failed, providing fallback diagnosis")
        // Get a generic crop and disease
        const mockCrops = getMockCrops()
        const fallbackCrop = mockCrops[0]
        const fallbackDiseases = getMockDiseases(fallbackCrop.id)
        const fallbackDisease = fallbackDiseases[0]

        const fallbackResult = {
          disease: fallbackDisease,
          detectedCrop: fallbackCrop,
          confidence: 0.6,
          reasoning: "AI analysis failed. Using fallback diagnosis based on common diseases.",
          treatments: {
            organic: fallbackDisease.organic_treatment
              ? fallbackDisease.organic_treatment.split(";").map((t) => t.trim())
              : ["Apply neem oil", "Use organic compost", "Remove affected leaves"],
            chemical: fallbackDisease.chemical_treatment
              ? fallbackDisease.chemical_treatment.split(";").map((t) => t.trim())
              : ["Apply fungicide", "Use appropriate pesticides"],
          },
          isOffline: true, // Mark as offline since we're not using the AI
        }

        return NextResponse.json(fallbackResult)
      } catch (fallbackError) {
        // If even the fallback fails, return the error
        return NextResponse.json(
          {
            error: "AI processing failed",
            message: aiError instanceof Error ? aiError.message : String(aiError),
            stack:
              process.env.NODE_ENV === "development"
                ? aiError instanceof Error
                  ? aiError.stack
                  : undefined
                : undefined,
          },
          { status: 500 },
        )
      }
    }
  } catch (error) {
    console.error("Error diagnosing plant:", error)
    return NextResponse.json(
      {
        error: "Failed to diagnose plant",
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}
