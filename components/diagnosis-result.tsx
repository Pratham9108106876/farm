"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/language-provider"
import type { DiagnosisResult } from "@/lib/types"
import { AlertTriangle, CheckCircle, Leaf, FlaskRoundIcon as Flask } from "lucide-react"

interface DiagnosisResultCardProps {
  result: DiagnosisResult
}

export function DiagnosisResultCard({ result }: DiagnosisResultCardProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("organic")

  const confidenceColor =
    result.confidence >= 0.8
      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
      : result.confidence >= 0.5
        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"

  const confidenceIcon =
    result.confidence >= 0.8 ? (
      <CheckCircle className="h-4 w-4 mr-1" />
    ) : result.confidence >= 0.5 ? (
      <AlertTriangle className="h-4 w-4 mr-1" />
    ) : (
      <AlertTriangle className="h-4 w-4 mr-1" />
    )

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>{result.disease.name}</CardTitle>
          <Badge className={confidenceColor}>
            <span className="flex items-center">
              {confidenceIcon}
              {Math.round(result.confidence * 100)}%
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">{t("symptoms") || "Symptoms"}</h4>
            <p className="text-sm text-muted-foreground">{result.disease.symptoms}</p>
          </div>

          <div>
            <h4 className="font-medium mb-2">{t("causes") || "Causes"}</h4>
            <p className="text-sm text-muted-foreground">{result.disease.causes}</p>
          </div>

          <Tabs defaultValue="organic" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="organic" className="flex items-center">
                <Leaf className="h-4 w-4 mr-2" />
                {t("organicTreatments")}
              </TabsTrigger>
              <TabsTrigger value="chemical" className="flex items-center">
                <Flask className="h-4 w-4 mr-2" />
                {t("chemicalTreatments")}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="organic" className="space-y-4 mt-4">
              <ul className="list-disc pl-5 space-y-2">
                {result.treatments.organic.map((treatment, index) => (
                  <li key={index} className="text-sm">
                    {treatment}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="chemical" className="space-y-4 mt-4">
              <ul className="list-disc pl-5 space-y-2">
                {result.treatments.chemical.map((treatment, index) => (
                  <li key={index} className="text-sm">
                    {treatment}
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}
