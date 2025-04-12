"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/components/language-provider"
import type { Crop } from "@/lib/types"

interface CropSelectorProps {
  onSelect: (cropId: number) => void
}

export function CropSelector({ onSelect }: CropSelectorProps) {
  const [open, setOpen] = useState(false)
  const [crops, setCrops] = useState<Crop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const fetchCrops = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/crops")

        if (!response.ok) {
          throw new Error(`Failed to fetch crops: ${response.status}`)
        }

        const data = await response.json()

        if (data && Array.isArray(data) && data.length > 0) {
          setCrops(data)
        } else {
          // Fallback to common crops if API returns empty data
          setCrops([
            {
              id: 1,
              name: "Rice",
              scientific_name: "Oryza sativa",
              description: "Staple food crop",
              common_in_regions: ["South India", "East India"],
            },
            {
              id: 2,
              name: "Wheat",
              scientific_name: "Triticum",
              description: "Cereal grain",
              common_in_regions: ["North India"],
            },
            {
              id: 3,
              name: "Cotton",
              scientific_name: "Gossypium",
              description: "Fiber crop",
              common_in_regions: ["Central India", "West India"],
            },
            {
              id: 4,
              name: "Sugarcane",
              scientific_name: "Saccharum officinarum",
              description: "Sugar crop",
              common_in_regions: ["North India", "South India"],
            },
            {
              id: 5,
              name: "Maize",
              scientific_name: "Zea mays",
              description: "Cereal grain",
              common_in_regions: ["All India"],
            },
          ])
        }
      } catch (error) {
        console.error("Error fetching crops:", error)
        setError("Failed to load crops. Using default options.")

        // Fallback to common crops if API fails
        setCrops([
          {
            id: 1,
            name: "Tomato",
            scientific_name: "Solanum lycopersicum",
            description: "Common garden vegetable with red fruits",
            common_in_regions: ["Worldwide"],
          },
          {
            id: 2,
            name: "Potato",
            scientific_name: "Solanum tuberosum",
            description: "Root vegetable and a staple food",
            common_in_regions: ["Worldwide"],
          },
          {
            id: 3,
            name: "Rice",
            scientific_name: "Oryza sativa",
            description: "Staple food for more than half of the world population",
            common_in_regions: ["Asia"],
          },
          {
            id: 4,
            name: "Wheat",
            scientific_name: "Triticum aestivum",
            description: "Cereal grain cultivated worldwide",
            common_in_regions: ["Worldwide"],
          },
          {
            id: 5,
            name: "Corn",
            scientific_name: "Zea mays",
            description: "Cereal grain domesticated in Mesoamerica",
            common_in_regions: ["Americas"],
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchCrops()
  }, [])

  const handleSelect = (crop: Crop) => {
    setSelectedCrop(crop)
    setOpen(false)
    onSelect(crop.id)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedCrop ? selectedCrop.name : loading ? "Loading crops..." : t("selectCrop")}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`${t("selectCrop")}...`} />
          <CommandList>
            <CommandEmpty>No crop found.</CommandEmpty>
            <CommandGroup>
              {crops.map((crop) => (
                <CommandItem key={crop.id} value={crop.name} onSelect={() => handleSelect(crop)}>
                  <Check className={cn("mr-2 h-4 w-4", selectedCrop?.id === crop.id ? "opacity-100" : "opacity-0")} />
                  {crop.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
