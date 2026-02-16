'use client'

import { useEffect } from 'react'

interface NotificationSeenProps {
  sectionKey: string
  /** Valeur actuelle (ex: nombre d'éléments) pour détecter le nouveau contenu plus tard */
  seenValue?: number
}

export default function NotificationSeen({ sectionKey, seenValue }: NotificationSeenProps) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(`notification_${sectionKey}`, 'hidden')
    if (seenValue != null) {
      localStorage.setItem(`notification_${sectionKey}_count`, String(seenValue))
    }
  }, [sectionKey, seenValue])

  return null
}

