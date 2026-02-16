'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { formatNomComplet, getFichierUrls } from '@/lib/utils'

interface Devoir {
  id: string
  titre: string
  description?: string
  matiere: string
  classe?: string
  date_limite?: string
  fichiers_joints?: string[]
  prof: { nom: string; prenom?: string }
}

interface Soumission {
  id: string
  contenu?: string
  fichier_url?: string
  note?: number
  commentaire?: string
  corrige: boolean
  submitted_at: string
  corrected_at?: string
}

export default function DevoirDetailPage() {
  const router = useRouter()
  const params = useParams()
  const devoirId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [devoir, setDevoir] = useState<Devoir | null>(null)
  const [soumission, setSoumission] = useState<Soumission | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'eleve') setUser(data.user)
        else router.push('/login')
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (user?.id && devoirId) loadData()
  }, [user?.id, devoirId])

  const loadData = async () => {
    try {
      const res = await fetch(`/api/devoirs/${devoirId}`)
      const data = await res.json()
      if (!res.ok) {
        router.push('/eleve/devoirs')
        return
      }
      setDevoir(data.devoir)

      const subRes = await fetch(`/api/soumissions/eleve?devoir_id=${devoirId}`)
      if (subRes.ok) {
        const subData = await subRes.json()
        if (subData.soumission) setSoumission(subData.soumission)
        else {
          router.push(`/eleve/devoirs/${devoirId}/soumettre`)
          return
        }
      } else {
        router.push(`/eleve/devoirs/${devoirId}/soumettre`)
        return
      }
    } catch {
      router.push('/eleve/devoirs')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !user || !devoir || !soumission) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const dateLimite = devoir.date_limite
    ? new Date(devoir.date_limite).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : null
  const profNom = formatNomComplet(devoir.prof?.nom, devoir.prof?.prenom)

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/eleve/devoirs"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Retour"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
                </svg>
              </Link>
              <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">{devoir.titre}</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${soumission.corrige ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
              {soumission.corrige ? 'Corrigé' : 'Soumis'}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Informations du devoir */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Informations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Matière</p>
                  <p className="font-medium text-slate-800">{devoir.matiere}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Classe</p>
                  <p className="font-medium text-slate-800">{devoir.classe || '–'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Professeur</p>
                  <p className="font-medium text-slate-800">{profNom}</p>
                </div>
                {dateLimite && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date limite</p>
                    <p className="font-medium text-slate-800">{dateLimite}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions du devoir */}
            {devoir.description && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Instructions du devoir</h3>
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {devoir.description}
                </div>
              </div>
            )}

            {/* Pièces jointes du professeur */}
            {devoir.fichiers_joints && devoir.fichiers_joints.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Pièces jointes du professeur</h3>
                <ul className="space-y-2">
                  {devoir.fichiers_joints.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="text-slate-400">•</span>
                      {typeof f === 'string' && f.startsWith('http') ? (
                        <a
                          href={f}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {decodeURIComponent(f.split('/').pop() || 'Ouvrir le fichier')}
                        </a>
                      ) : (
                        f
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ma soumission */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Ma réponse</h3>
              {getFichierUrls(soumission.fichier_url).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Fichier(s) soumis</p>
                  <ul className="space-y-1">
                    {getFichierUrls(soumission.fichier_url).map((url: string, i: number) => (
                      <li key={i}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                          {url.split('/').pop()}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {soumission.contenu && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Réponse</p>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 whitespace-pre-wrap text-sm">
                    {soumission.contenu}
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Soumis le {new Date(soumission.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            {/* Note et commentaire si corrigé */}
            {soumission.corrige && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Correction</h3>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-4xl font-bold text-green-600">{soumission.note}</span>
                  <span className="text-xl text-slate-500">/20</span>
                </div>
                {soumission.commentaire && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-sm font-medium text-blue-900 mb-2">Commentaire du professeur</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{soumission.commentaire}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
