'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface NotificationDotProps {
  sectionKey: string
  hasItems: boolean
  /** Nombre actuel d'éléments : si > nombre vu, le point réapparaît */
  count?: number
  /** Classe CSS du point (ex: bg-red-500, bg-amber-500) */
  className?: string
}

export default function NotificationDot({ sectionKey, hasItems, count, className = 'bg-red-500' }: NotificationDotProps) {
  const [visible, setVisible] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!hasItems) {
      setVisible(false)
      localStorage.removeItem(`notification_${sectionKey}`)
      localStorage.removeItem(`notification_${sectionKey}_count`)
      return
    }

    const stored = localStorage.getItem(`notification_${sectionKey}`)
    const storedCount = parseInt(localStorage.getItem(`notification_${sectionKey}_count`) || '0', 10)

    // Déjà vu : la pastille réapparaît s'il y a du nouveau (count > storedCount)
    if (stored === 'hidden') {
      if (count != null && count > storedCount) {
        setVisible(true)
      } else {
        setVisible(false)
      }
      return
    }
    setVisible(true)
    localStorage.setItem(`notification_${sectionKey}`, 'visible')
  }, [sectionKey, hasItems, count, pathname])

  if (!visible) return null

  return (
    <span className={`absolute top-0 right-0 h-3 w-3 rounded-full ${className}`} />
  )
}

