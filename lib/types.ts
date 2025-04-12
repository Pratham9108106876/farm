export interface User {
  id: number
  name: string
  email: string | null
  phone_number: string | null
  preferred_language: string
  created_at: string
}

export interface Crop {
  id: number
  name: string
  scientific_name: string | null
  description: string | null
  common_in_regions: string[]
}

export interface Disease {
  id: number
  name: string
  crop_id: number
  symptoms: string | null
  causes: string | null
  prevention: string | null
  organic_treatment: string | null
  chemical_treatment: string | null
  image_url: string | null
}

export interface Diagnosis {
  id: number
  user_id: number | null
  crop_id: number | null
  disease_id: number | null
  image_url: string | null
  confidence_score: number | null
  notes: string | null
  created_at: string
  is_offline: boolean
}

export interface DiagnosisResult {
  disease: Disease
  confidence: number
  treatments: {
    organic: string[]
    chemical: string[]
  }
}

export type AppMode = "online" | "offline"
