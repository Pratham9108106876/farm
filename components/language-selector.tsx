"use client"

import { Check, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/components/language-provider"

const languages = [
  { value: "english", label: "English" },
  { value: "hindi", label: "हिंदी (Hindi)" },
  { value: "tamil", label: "தமிழ் (Tamil)" },
  { value: "telugu", label: "తెలుగు (Telugu)" },
  { value: "bengali", label: "বাংলা (Bengali)" },
  { value: "marathi", label: "मराठी (Marathi)" },
  { value: "gujarati", label: "ગુજરાતી (Gujarati)" },
  { value: "punjabi", label: "ਪੰਜਾਬੀ (Punjabi)" },
]

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Globe className="mr-2 h-4 w-4" />
          {languages.find((l) => l.value === language)?.label || "English"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandList>
            <CommandGroup>
              {languages.map((lang) => (
                <CommandItem
                  key={lang.value}
                  onSelect={() => setLanguage(lang.value as any)}
                  className="flex items-center"
                >
                  <Check className={cn("mr-2 h-4 w-4", language === lang.value ? "opacity-100" : "opacity-0")} />
                  {lang.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
