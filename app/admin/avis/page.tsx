'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Avis {
  id: string
  titre: string
  contenu: string
  urgent: boolean
  visible_eleves: boolean
  visible_profs: boolean
  created_at: string
  cible_classe?: string
}

export default function AvisPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [avis, setAvis] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAvis, setEditingAvis] = useState<Avis | null>(null)

  // Form fields
  const [titre, setTitre] = useState('')
  const [contenu, setContenu] = useState('')
  const [datePublication, setDatePublication] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [cible, setCible] = useState('tous')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const classesOptions = ['Tous les utilisateurs', 'Professeurs uniquement', 'Secondaire 1', 'Secondaire 2', 'Secondaire 3']

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          loadAvis()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  const loadAvis = async () => {
    try {
      const res = await fetch('/api/avis', { credentials: 'include' })
      const data = await res.json()
      const list = data.avis || []
      // Nouveaux avis en premier (tri par date puis id décroissants)
      setAvis([...list].sort((a, b) => {
        const ta = new Date(a.created_at).getTime()
        const tb = new Date(b.created_at).getTime()
        if (tb !== ta) return tb - ta
        return (b.id || '').localeCompare(a.id || '')
      }))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (avisToEdit?: Avis) => {
    if (avisToEdit) {
      setEditingAvis(avisToEdit)
      setTitre(avisToEdit.titre)
      setContenu(avisToEdit.contenu)
      setUrgent(avisToEdit.urgent)
      // Déterminer le ciblage
      if (avisToEdit.cible_classe) {
        setCible(avisToEdit.cible_classe)
      } else if (avisToEdit.visible_profs && !avisToEdit.visible_eleves) {
        setCible('Professeurs uniquement')
      } else {
        setCible('tous')
      }
      setDatePublication(new Date(avisToEdit.created_at).toISOString().split('T')[0])
    } else {
      setEditingAvis(null)
      setTitre('')
      setContenu('')
      setDatePublication('')
      setUrgent(false)
      setCible('tous')
    }
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingAvis(null)
    setTitre('')
    setContenu('')
    setDatePublication('')
    setUrgent(false)
    setCible('tous')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!titre || !contenu) {
      setError('Le titre et le contenu sont requis')
      setSubmitting(false)
      return
    }

    try {
      const url = editingAvis ? `/api/avis/${editingAvis.id}` : '/api/avis'
      const method = editingAvis ? 'PATCH' : 'POST'

      const body: any = {
        titre,
        contenu,
        urgent,
        date_publication: datePublication || new Date().toISOString(),
      }
      // Ciblage : tous, professeurs uniquement, ou une classe précise
      if (cible === 'tous' || !cible) {
        body.visible_eleves = true
        body.visible_profs = true
        body.cible_classe = null
      } else if (cible === 'Professeurs uniquement') {
        body.visible_eleves = false
        body.visible_profs = true
        body.cible_classe = null
      } else {
        body.visible_eleves = true
        body.visible_profs = false
        body.cible_classe = cible
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la sauvegarde')
        setSubmitting(false)
        return
      }

      closeModal()
      loadAvis()
    } catch (err) {
      setError('Erreur de connexion')
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
      return
    }

    try {
      const res = await fetch(`/api/avis/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadAvis()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getCibleText = (avis: Avis) => {
    if (avis.cible_classe) {
      return avis.cible_classe
    }
    if (avis.visible_profs && !avis.visible_eleves) {
      return 'Professeurs uniquement'
    }
    return 'Tous les utilisateurs'
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Gestion des Avis</h2>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
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
              <path d="M5 12h14m-7-7v14"></path>
            </svg>
            Nouvel avis
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Liste des avis */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-semibold text-slate-800">
                  Avis publiés ({avis.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {avis.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    Aucun avis publié pour le moment
                  </div>
                ) : (
                  avis.map((a) => (
                    <div
                      key={a.id}
                      className={`px-6 py-4 hover:bg-slate-50 transition-colors ${
                        a.urgent ? 'border-l-4 border-red-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-800">{a.titre}</h4>
                            {a.urgent && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800 uppercase">
                                URGENT
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{a.contenu}</p>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Publié le {formatDate(a.created_at)}</span>
                            <span>•</span>
                            <span>Ciblé: {getCibleText(a)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <button
                            onClick={() => openModal(a)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
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
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1l1-4l9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Nouvel avis */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">
                  {editingAvis ? 'Modifier l\'avis' : 'Nouvel avis'}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Titre de l'avis"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Contenu *
                </label>
                <textarea
                  value={contenu}
                  onChange={(e) => setContenu(e.target.value)}
                  placeholder="Contenu de l'avis..."
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date de publication
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={datePublication}
                    onChange={(e) => setDatePublication(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <svg
                    className="absolute right-3 top-2.5 w-5 h-5 text-slate-400 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"
                    />
                  </svg>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={urgent}
                    onChange={(e) => setUrgent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-amber-900">Marquer comme URGENT</p>
                    <p className="text-xs text-amber-700 mt-1">
                      Mise en évidence visuelle et notification prioritaire
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cibler *
                </label>
                <select
                  value={cible}
                  onChange={(e) => setCible(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {classesOptions.map((opt) => (
                    <option key={opt} value={opt === 'Tous les utilisateurs' ? 'tous' : opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Publication...' : editingAvis ? 'Modifier l\'avis' : 'Publier l\'avis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
