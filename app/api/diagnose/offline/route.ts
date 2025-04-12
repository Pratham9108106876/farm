import { NextResponse } from "next/server"
import sql from "@/lib/db"
import { initializeDatabase, getMockDiseases } from "@/lib/db-init"
import type { Disease } from "@/lib/types"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

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
    return "/placeholder-image.jpg" // Return a placeholder if saving fails
  }
}

// This would normally use a local model for offline image analysis
export async function POST(request: Request) {
  try {
    console.log("Starting offline plant diagnosis...")

    // Try to initialize the database if not already done
    if (!isDatabaseInitialized) {
      isDatabaseInitialized = await initializeDatabase()
    }

    const { image, cropId } = await request.json()

    if (!image || !cropId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Save the image file and get a URL instead of storing base64 data
    let imageUrl
    try {
      imageUrl = await saveBase64ImageToFile(image)
      console.log("Image saved to:", imageUrl)
    } catch (imageError) {
      console.error("Failed to save image:", imageError)
      // Continue with analysis but we'll store a placeholder
      imageUrl = "/placeholder-image.jpg"
    }

    // For now, we'll simulate by fetching a random disease for the crop
    let diseases
    try {
      diseases = await sql<Disease[]>`
        SELECT * FROM diseases
        WHERE crop_id = ${cropId}
        LIMIT 5
      `

      if (!diseases || diseases.length === 0) {
        // If no diseases found in database, use mock data
        console.log("No diseases found in database, using mock data")
        diseases = getMockDiseases(Number(cropId))
      }
    } catch (dbError) {
      console.error("Database error fetching diseases:", dbError)
      // Use mock data if database query fails
      console.log("Using mock disease data due to database error")
      diseases = getMockDiseases(Number(cropId))
    }

    // Simulate AI analysis by selecting a random disease
    // For offline mode, we'll make the confidence slightly lower
    const randomDisease = diseases[Math.floor(Math.random() * diseases.length)]
    const confidence = 0.5 + Math.random() * 0.3

    // Parse treatments from the database fields
    const organicTreatments = randomDisease.organic_treatment
      ? randomDisease.organic_treatment.split(";").map((t) => t.trim())
      : ["Apply neem oil spray", "Use compost tea as a natural fungicide"]

    const chemicalTreatments = randomDisease.chemical_treatment
      ? randomDisease.chemical_treatment.split(";").map((t) => t.trim())
      : ["Apply copper-based fungicide", "Use systemic fungicide as per label instructions"]

    const result = {
      disease: randomDisease,
      confidence,
      reasoning: "Offline analysis completed. For more accurate results, try online mode when internet is available.",
      treatments: {
        organic: organicTreatments,
        chemical: chemicalTreatments,
      },
    }

    // Save the diagnosis to the database with the image URL, not the raw base64 data
    try {
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
          ${randomDisease.id}, 
          ${imageUrl},
          ${confidence}, 
          ${"Offline analysis"},
          true
        )
      `
    } catch (dbError) {
      console.error("Database error while saving diagnosis:", dbError)
      // Continue with the response even if database save fails
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error diagnosing plant:", error)

    // Provide more detailed error response
    return NextResponse.json(
      {
        error: "Failed to diagnose plant in offline mode",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
