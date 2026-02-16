'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Link from 'next/link'

interface Cours {
  id: string
  titre: string
  description?: string
  matiere: string
  classe?: string
  contenu?: string
  fichier_url?: string
  created_at: string
  prof?: {
    nom: string
  }
}

export default function FicheCoursDetailPage() {
  const router = useRouter()
  const params = useParams()
  const coursId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [cours, setCours] = useState<Cours | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadCours()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router, coursId])

  const loadCours = async () => {
    try {
      const res = await fetch(`/api/cours/${coursId}`)
      const data = await res.json()
      
      if (res.ok && data.cours) {
        setCours(data.cours)
      } else {
        alert('Fiche de cours non trouvée')
        router.push('/prof/fiches-cours')
      }
    } catch (err) {
      console.error(err)
      alert('Erreur de connexion')
      router.push('/prof/fiches-cours')
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  if (!cours) {
    return null
  }

  const dateFormatted = new Date(cours.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/prof/fiches-cours"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Retour"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 19-7-7 7-7"></path>
                  <path d="M19 12H5"></path>
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{cours.titre}</h1>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                    </svg>
                    {cours.matiere}
                  </span>
                  {cours.classe && (
                    <span className="flex items-center gap-1.5">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      {cours.classe}
                    </span>
                  )}
                  <span className="text-slate-400">•</span>
                  <span>Publié le {dateFormatted}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              {cours.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-3">Description</h2>
                  <p className="text-slate-600 leading-relaxed">{cours.description}</p>
                </div>
              )}

              {cours.contenu ? (
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Contenu</h2>
                  <div className="prose max-w-none">
                    <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {cours.contenu}
                    </div>
                  </div>
                </div>
              ) : cours.fichier_url ? (
                <div>
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Fichier joint</h2>
                  {cours.fichier_url.startsWith('http') ? (
                    <a
                      href={cours.fichier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Ouvrir / Télécharger le fichier
                    </a>
                  ) : (
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <p className="text-sm font-medium text-slate-700">{cours.fichier_url}</p>
                      <p className="text-xs text-slate-500 mt-1">Fichier (lien non disponible)</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">Aucun contenu disponible pour cette fiche de cours</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
