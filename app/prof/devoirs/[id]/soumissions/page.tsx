'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { formatNomComplet } from '@/lib/utils'

interface Soumission {
  id: string
  eleve_id: string
  eleve: { nom: string; prenom?: string }
  contenu?: string
  fichier_url?: string
  note?: number
  commentaire?: string
  corrige: boolean
  submitted_at: string
  corrected_at?: string
}

interface Devoir {
  id: string
  titre: string
  matiere: string
  classe?: string
  date_limite?: string
}

export default function DevoirSoumissionsPage() {
  const router = useRouter()
  const params = useParams()
  const devoirId = params?.id as string
  const [user, setUser] = useState<any>(null)
  const [devoir, setDevoir] = useState<Devoir | null>(null)
  const [soumissions, setSoumissions] = useState<Soumission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          if (devoirId) loadData()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router, devoirId])

  const loadData = async () => {
    try {
      const res = await fetch(`/api/devoirs/${devoirId}/soumissions`)
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 404) router.push('/prof/devoirs')
        return
      }
      setDevoir(data.devoir)
      setSoumissions(data.soumissions || [])
    } catch {
      router.push('/prof/devoirs')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
      </div>
    )
  }

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
            <h2 className="text-xl font-semibold text-slate-800">Soumissions</h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {devoir && (
              <>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 mb-1">{devoir.titre}</h1>
                  <p className="text-sm text-slate-500">
                    {devoir.matiere}
                    {devoir.classe && ` • ${devoir.classe}`}
                  </p>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-800">
                      Élèves ayant soumis ({soumissions.length})
                    </h3>
                  </div>
                  <ul className="divide-y divide-slate-200">
                    {soumissions.length === 0 ? (
                      <li className="px-6 py-12 text-center text-slate-500">
                        Aucun élève n’a encore soumis ce devoir.
                      </li>
                    ) : (
                      soumissions.map((s) => (
                        <li key={s.id}>
                          <Link
                            href={`/prof/correction?devoir=${devoirId}&soumission=${s.id}`}
                            className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900">
                                {formatNomComplet(s.eleve?.nom, s.eleve?.prenom)}
                              </p>
                              <p className="text-sm text-slate-500 mt-0.5">
                                Soumis le {formatDate(s.submitted_at)}
                              </p>
                            </div>
                            <span
                              className={`ml-4 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                                s.corrige ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {s.corrige ? 'Corrigé' : 'À corriger'}
                            </span>
                            <svg
                              className="ml-2 w-5 h-5 text-slate-400 shrink-0"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m9 18 6-6-6-6"></path>
                            </svg>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
