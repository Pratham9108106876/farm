import { NextResponse } from "next/server"
import sql from "@/lib/db"
import { initializeDatabase, getMockCrops } from "@/lib/db-init"

// Initialize database flag
let isDatabaseInitialized = false

export async function GET() {
  try {
    // Try to initialize the database if not already done
    if (!isDatabaseInitialized) {
      isDatabaseInitialized = await initializeDatabase()
    }

    // Try to fetch crops from database
    let crops
    try {
      crops = await sql`SELECT * FROM crops ORDER BY name`

      // If no crops found, use mock data
      if (!crops || crops.length === 0) {
        console.log("No crops found in database, using mock data")
        crops = getMockCrops()
      }
    } catch (dbError) {
      console.error("Database error fetching crops:", dbError)
      // Use mock data if database query fails
      console.log("Using mock crops data due to database error")
      crops = getMockCrops()
    }

    // Return the crops data
    return NextResponse.json(crops)
  } catch (error) {
    console.error("Error in crops API:", error)

    // Return mock data in case of any error
    return NextResponse.json(getMockCrops())
  }
}
