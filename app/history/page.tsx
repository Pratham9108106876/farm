"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { MobileNav } from "@/components/mobile-nav"
import { useLanguage } from "@/components/language-provider"
import type { Diagnosis, Disease, Crop } from "@/lib/types"
import { Calendar, Wifi, WifiOff } from "lucide-react"

interface DiagnosisWithDetails extends Diagnosis {
  disease: Disease
  crop: Crop
}

export default function HistoryPage() {
  const [diagnoses, setDiagnoses] = useState<DiagnosisWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  useEffect(() => {
    const fetchDiagnoses = async () => {
      try {
        const response = await fetch("/api/diagnoses")
        if (response.ok) {
          const data = await response.json()
          setDiagnoses(data)
        }
      } catch (error) {
        console.error("Error fetching diagnoses:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDiagnoses()
  }, [])

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <p>{t("loading")}</p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col pb-16">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">{t("history")}</h1>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {diagnoses.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{t("noResults")}</p>
            <Link href="/diagnose" className="text-primary mt-2 block">
              Start diagnosing plants
            </Link>
          </div>
        ) : (
          diagnoses.map((diagnosis) => (
            <Link href={`/history/${diagnosis.id}`} key={diagnosis.id}>
              <Card className="mb-4 hover:bg-accent/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {diagnosis.image_url && (
                      <div className="w-20 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={diagnosis.image_url || "/placeholder.svg"}
                          alt={diagnosis.disease.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium">{diagnosis.disease.name}</h3>
                      <p className="text-sm text-muted-foreground">{diagnosis.crop.name}</p>
                      <div className="flex items-center mt-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(diagnosis.created_at), "MMM d, yyyy")}
                        {diagnosis.is_offline ? (
                          <span className="ml-2 flex items-center">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Offline
                          </span>
                        ) : (
                          <span className="ml-2 flex items-center">
                            <Wifi className="h-3 w-3 mr-1" />
                            Online
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <MobileNav />
    </main>
  )
}
