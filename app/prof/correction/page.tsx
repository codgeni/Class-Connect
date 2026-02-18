'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { formatNomComplet, getFichierUrls } from '@/lib/utils'
import NotificationSeen from '@/components/NotificationSeen'

interface Soumission {
  id: string
  devoir_id: string
  eleve_id: string
  eleve: {
    nom: string
    prenom?: string
  }
  devoir: {
    id: string
    titre: string
    matiere: string
    classe?: string
  }
  contenu?: string
  fichier_url?: string
  note?: number
  commentaire?: string
  corrige: boolean
  submitted_at: string
  corrected_at?: string
}

function CorrectionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [soumissions, setSoumissions] = useState<Soumission[]>([])
  const [selectedSoumission, setSelectedSoumission] = useState<Soumission | null>(null)
  
  // Filtres
  const [filterDevoir, setFilterDevoir] = useState('')
  const [filterClasse, setFilterClasse] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Options pour les filtres
  const [devoirsOptions, setDevoirsOptions] = useState<Array<{ id: string; titre: string }>>([])
  const [classesOptions, setClassesOptions] = useState<string[]>([])
  
  // Formulaire de correction
  const [note, setNote] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadSoumissions(data.user.id)
          loadOptions(data.user.id)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  const loadOptions = async (profId: string) => {
    try {
      // Charger les devoirs du professeur
      const devoirsRes = await fetch('/api/devoirs')
      const devoirsData = await devoirsRes.json()
      if (devoirsData.devoirs) {
        setDevoirsOptions(devoirsData.devoirs.map((d: any) => ({ id: d.id, titre: d.titre })))
        
        // Extraire les classes uniques
        const classes: string[] = [...new Set(devoirsData.devoirs.map((d: any) => d.classe).filter(Boolean))] as string[]
        setClassesOptions(classes)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadSoumissions = async (profId: string) => {
    try {
      const res = await fetch('/api/soumissions')
      const data = await res.json()
      
      if (res.ok && data.soumissions) {
        setSoumissions(data.soumissions)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Présélection depuis l’URL (ex. depuis « Voir les soumissions » d’un devoir)
  const devoirIdFromUrl = searchParams.get('devoir')
  const soumissionIdFromUrl = searchParams.get('soumission')
  useEffect(() => {
    if (!soumissions.length || (!devoirIdFromUrl && !soumissionIdFromUrl)) return
    if (devoirIdFromUrl) setFilterDevoir(devoirIdFromUrl)
    if (soumissionIdFromUrl) {
      const s = soumissions.find((x: Soumission) => x.id === soumissionIdFromUrl)
      if (s) {
        setSelectedSoumission(s)
        setNote(s.note?.toString() || '')
        setCommentaire(s.commentaire || '')
      }
    }
  }, [soumissions.length, devoirIdFromUrl, soumissionIdFromUrl])

  const handleSelectSoumission = (soumission: Soumission) => {
    setSelectedSoumission(soumission)
    setNote(soumission.note?.toString() || '')
    setCommentaire(soumission.commentaire || '')
    setError('')
  }

  const handleSave = async () => {
    if (!selectedSoumission) return

    if (!note || parseFloat(note) < 0 || parseFloat(note) > 20) {
      setError('Veuillez entrer une note valide entre 0 et 20')
      return
    }

    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/soumissions/${selectedSoumission.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: parseFloat(note),
          commentaire: commentaire.trim() || null,
          corrige: true,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'enregistrement')
        setSaving(false)
        return
      }

      // Recharger les soumissions
      await loadSoumissions(user.id)
      
      // Mettre à jour la soumission sélectionnée
      const updated = soumissions.find(s => s.id === selectedSoumission.id)
      if (updated) {
        updated.note = parseFloat(note)
        updated.commentaire = commentaire.trim() || undefined
        updated.corrige = true
        updated.corrected_at = new Date().toISOString()
        setSelectedSoumission(updated)
      }

      alert('Note enregistrée avec succès!')
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  // Filtrer les soumissions
  const filteredSoumissions = soumissions.filter(s => {
    if (filterDevoir && s.devoir_id !== filterDevoir) return false
    if (filterClasse && s.devoir.classe !== filterClasse) return false
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      const fullName = formatNomComplet(s.eleve.nom, s.eleve.prenom).toLowerCase()
      return fullName.includes(searchLower)
    }
    return true
  })

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  const dateFormatted = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Correction & Notes</h1>
            <button className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2">
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exporter
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="prof_devoirs_soumis" seenValue={soumissions.length} />
          <div className="max-w-7xl mx-auto">
            {/* Filtres et recherche */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Filtre devoirs */}
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={filterDevoir}
                    onChange={(e) => setFilterDevoir(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Tous les devoirs</option>
                    {devoirsOptions.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.titre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filtre classes */}
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={filterClasse}
                    onChange={(e) => setFilterClasse(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Toutes les classes</option>
                    {classesOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recherche */}
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un élève..."
                      className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des soumissions ou détail */}
            {selectedSoumission ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
                {/* En-tête avec bouton retour */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => setSelectedSoumission(null)}
                    className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
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
                    Retour à la liste
                  </button>
                </div>

                {/* Titre et statut */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      {selectedSoumission.devoir.titre}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1.5">
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
                        </svg>
                        {formatNomComplet(selectedSoumission.eleve.nom, selectedSoumission.eleve.prenom)}
                      </div>
                      <div className="flex items-center gap-1.5">
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
                          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        Soumis le {dateFormatted(selectedSoumission.submitted_at)}
                      </div>
                      {getFichierUrls(selectedSoumission.fichier_url).map((url, i) => (
                        <div key={i} className="flex items-center gap-1.5">
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
                            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                          </svg>
                          <span className="text-slate-600">
                            {url.split('/').pop() || 'Fichier joint'}
                          </span>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={url.split('/').pop() || undefined}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Télécharger
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedSoumission.corrige
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {selectedSoumission.corrige ? 'Corrigé' : 'À corriger'}
                  </span>
                </div>

                {/* Contenu de la soumission */}
                {selectedSoumission.contenu && (
                  <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedSoumission.contenu}</p>
                  </div>
                )}

                {/* Formulaire de correction ou note affichée */}
                {selectedSoumission.corrige ? (
                  <div className="space-y-6">
                    {/* Note affichée */}
                    <div>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-4xl font-bold text-green-600">
                          {selectedSoumission.note}/20
                        </span>
                        <span className="text-sm text-slate-500">Note attribuée</span>
                      </div>
                    </div>

                    {/* Commentaire */}
                    {selectedSoumission.commentaire && (
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-1">Commentaire:</p>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">
                          {selectedSoumission.commentaire}
                        </p>
                      </div>
                    )}

                    {/* Message de verrouillage */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-xs text-slate-500">
                        Note verrouillée - La note ne peut plus être modifiée après correction
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Note /20
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.5"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="15.5"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Statut
                        </label>
                        <div className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 flex items-center">
                          <span className={selectedSoumission.corrige ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                            {selectedSoumission.corrige ? 'Corrigé' : 'Non corrigé'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Le statut passera automatiquement à "Corrigé" lors de l'enregistrement
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Commentaire
                      </label>
                      <textarea
                        rows={3}
                        value={commentaire}
                        onChange={(e) => setCommentaire(e.target.value)}
                        placeholder="Ajouter un commentaire personnalisé..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedSoumission(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer la note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSoumissions.length === 0 ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                    <p className="text-slate-500">Aucune soumission trouvée</p>
                  </div>
                ) : (
                  filteredSoumissions.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSoumission(s)}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-800">
                              {s.devoir.titre}
                            </h3>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                s.corrige
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}
                            >
                              {s.corrige ? 'Corrigé' : 'À corriger'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
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
                              </svg>
                              {formatNomComplet(s.eleve.nom, s.eleve.prenom)}
                            </span>
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
                                <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                                <line x1="16" y1="2" x2="16" y2="6"></line>
                                <line x1="8" y1="2" x2="8" y2="6"></line>
                                <line x1="3" y1="10" x2="21" y2="10"></line>
                              </svg>
                              Soumis le {dateFormatted(s.submitted_at)}
                            </span>
                            {s.note !== null && s.note !== undefined && (
                              <span className="text-green-600 font-medium">
                                {s.note}/20
                              </span>
                            )}
                          </div>
                        </div>
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
                          className="text-slate-400"
                        >
                          <path d="m9 18 6-6-6-6"></path>
                        </svg>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CorrectionPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">Chargement...</p>
      </div>
    }>
      <CorrectionContent />
    </Suspense>
  )
}
