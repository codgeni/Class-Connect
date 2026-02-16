'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Devoir {
  id: string
  titre: string
  description?: string
  matiere: string
  classe?: string
  date_limite?: string
  points: number
  type_rendu?: string
  fichiers_joints?: string[]
  created_at: string
  prof?: { nom: string; prenom?: string }
}

export default function DevoirDetailPage() {
  const router = useRouter()
  const params = useParams()
  const devoirId = params?.id as string
  const [user, setUser] = useState<any>(null)
  const [devoir, setDevoir] = useState<Devoir | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          if (devoirId) loadDevoir()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router, devoirId])

  const loadDevoir = async () => {
    try {
      const res = await fetch(`/api/devoirs/${devoirId}`)
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403 || res.status === 404) router.push('/prof/devoirs')
        return
      }
      setDevoir(data.devoir)
    } catch {
      router.push('/prof/devoirs')
    }
  }

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

  if (!devoir) return null

  const dateEcheance = devoir.date_limite
    ? new Date(devoir.date_limite).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Link
              href="/prof/devoirs"
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Retour aux devoirs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 19-7-7 7-7"></path>
                <path d="M19 12H5"></path>
              </svg>
            </Link>
            <h2 className="text-xl font-semibold text-slate-800">Détails du devoir</h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">{devoir.titre}</h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">{devoir.matiere}</span>
                  {devoir.classe && <span>{devoir.classe}</span>}
                  {dateEcheance && (
                    <span className="flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      </svg>
                      Échéance : {dateEcheance}
                    </span>
                  )}
                  {devoir.points > 0 && <span>{devoir.points} points</span>}
                </div>
              </div>

              {devoir.description && (
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Instructions</h3>
                  <p className="text-slate-600 whitespace-pre-wrap">{devoir.description}</p>
                </div>
              )}

              {devoir.type_rendu && (
                <div className="px-6 py-3 border-b border-slate-100 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">Type de rendu :</span>{' '}
                  {devoir.type_rendu === 'fichier' ? 'Fichier' : devoir.type_rendu === 'texte' ? 'Texte' : 'Fichier et texte'}
                </div>
              )}

              {devoir.fichiers_joints && devoir.fichiers_joints.length > 0 && (
                <div className="p-6 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Fichiers joints</h3>
                  <ul className="space-y-1">
                    {devoir.fichiers_joints.map((item: string, i: number) => {
                      const isUrl = typeof item === 'string' && item.startsWith('http')
                      const label = isUrl ? decodeURIComponent(item.split('/').pop() || 'Fichier') : item
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400 shrink-0">
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                          </svg>
                          {isUrl ? (
                            <a href={item} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                              {label}
                            </a>
                          ) : (
                            label
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              <div className="p-6 bg-slate-50">
                <Link
                  href={`/prof/devoirs/${devoir.id}/soumissions`}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Voir les soumissions
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6"></path>
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
