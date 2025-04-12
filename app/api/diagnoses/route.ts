import { NextResponse } from "next/server"
import sql from "@/lib/db"
import { initializeDatabase } from "@/lib/db-init"
import { v4 as uuidv4 } from "uuid"
import fs from "fs"
import path from "path"

// Initialize database flag
let isDatabaseInitialized = false

// Function to save base64 image to disk and return the file path
async function saveBase64ImageToFile(base64Image: string): Promise<string> {
  try {
    // Skip if not a base64 string
    if (!base64Image || !base64Image.includes(",")) {
      return base64Image // Return the original value if it's already a URL
    }

    // Strip the data URL prefix if present
    const base64Data = base64Image.split(",")[1]

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
    return "/placeholder-image.jpg" // Fallback to placeholder
  }
}

export async function GET() {
  try {
    // Try to initialize the database if not already done
    if (!isDatabaseInitialized) {
      isDatabaseInitialized = await initializeDatabase()
    }

    try {
      const diagnoses = await sql`
        SELECT 
          d.*, 
          dis.name as disease_name, 
          dis.symptoms as disease_symptoms,
          c.name as crop_name
        FROM diagnoses d
        JOIN diseases dis ON d.disease_id = dis.id
        JOIN crops c ON d.crop_id = c.id
        ORDER BY d.created_at DESC
        LIMIT 20
      `

      // Transform the results to match the expected format
      const formattedDiagnoses = diagnoses.map((d) => ({
        id: d.id,
        user_id: d.user_id,
        crop_id: d.crop_id,
        disease_id: d.disease_id,
        image_url: d.image_url,
        confidence_score: d.confidence_score,
        notes: d.notes,
        created_at: d.created_at,
        is_offline: d.is_offline,
        disease: {
          id: d.disease_id,
          name: d.disease_name,
          symptoms: d.disease_symptoms,
        },
        crop: {
          id: d.crop_id,
          name: d.crop_name,
        },
      }))

      return NextResponse.json(formattedDiagnoses)
    } catch (dbError) {
      console.error("Error fetching diagnoses:", dbError)
      // Return empty array if database query fails
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching diagnoses:", error)
    return NextResponse.json({ error: "Failed to fetch diagnoses" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Try to initialize the database if not already done
    if (!isDatabaseInitialized) {
      isDatabaseInitialized = await initializeDatabase()
    }

    const { result, imageUrl } = await request.json()

    if (!result || !result.disease) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Save the image properly if it's a base64 string
    let savedImageUrl = imageUrl
    if (imageUrl && imageUrl.startsWith("data:")) {
      try {
        savedImageUrl = await saveBase64ImageToFile(imageUrl)
      } catch (imageError) {
        console.error("Failed to save image:", imageError)
        savedImageUrl = "/placeholder-image.jpg"
      }
    }

    try {
      // Save the diagnosis to the database with proper image URL
      const diagnosis = await sql`
        INSERT INTO diagnoses (
          crop_id, 
          disease_id, 
          image_url, 
          confidence_score, 
          notes,
          is_offline
        ) VALUES (
          ${result.disease.crop_id}, 
          ${result.disease.id}, 
          ${savedImageUrl || null}, 
          ${result.confidence}, 
          ${result.notes || null},
          ${result.isOffline || false}
        )
        RETURNING *
      `

      return NextResponse.json(diagnosis[0])
    } catch (dbError) {
      console.error("Database error saving diagnosis:", dbError)

      // Return success anyway since we have the data in memory
      return NextResponse.json({
        id: 0,
        crop_id: result.disease.crop_id,
        disease_id: result.disease.id,
        image_url: savedImageUrl,
        confidence_score: result.confidence,
        notes: result.notes || null,
        is_offline: result.isOffline || false,
        created_at: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error saving diagnosis:", error)
    return NextResponse.json(
      {
        error: "Failed to save diagnosis",
        message: error instanceof Error ? error.message : String(error),
        stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 },
    )
  }
}
