"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/components/language-provider"
import { Home, Camera, History, Settings, MessageSquare } from "lucide-react"

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { t } = useLanguage()

  const routes = [
    {
      href: "/",
      label: t("home"),
      icon: <Home className="h-5 w-5" />,
      active: pathname === "/",
    },
    {
      href: "/diagnose",
      label: t("diagnose"),
      icon: <Camera className="h-5 w-5" />,
      active: pathname === "/diagnose",
    },
    {
      href: "/chat",
      label: t("chat") || "Chat",
      icon: <MessageSquare className="h-5 w-5" />,
      active: pathname === "/chat",
    },
    {
      href: "/history",
      label: t("history"),
      icon: <History className="h-5 w-5" />,
      active: pathname === "/history",
    },
    {
      href: "/settings",
      label: t("settings"),
      icon: <Settings className="h-5 w-5" />,
      active: pathname === "/settings",
    },
  ]

  return (
    <>
      <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-gray-900 dark:border-gray-700">
        <div className="grid h-full grid-cols-5 mx-auto">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-2 hover:bg-gray-50 dark:hover:bg-gray-800",
                route.active && "bg-gray-50 dark:bg-gray-800",
              )}
            >
              {route.icon}
              <span className="text-xs mt-1 text-center">{route.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
