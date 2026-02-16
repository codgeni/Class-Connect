'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Evenement {
  id: string
  titre: string
  description: string | null
  date_debut: string
  date_fin: string | null
  type: string
  heure?: string
}

const typeColors: { [key: string]: string } = {
  examen: 'bg-blue-100 text-blue-600',
  réunion: 'bg-purple-100 text-purple-600',
  célébration: 'bg-pink-100 text-pink-600',
  'date d\'ouverture': 'bg-green-100 text-green-600',
  'date de fermeture': 'bg-red-100 text-red-600',
  autre: 'bg-slate-100 text-slate-600',
}

const typeOptions = ['Examen', 'Réunion', 'Célébration', 'Date d\'ouverture', 'Date de fermeture', 'Autre']

export default function DatesImportantesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [evenements, setEvenements] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Form fields
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [heure, setHeure] = useState('')
  const [type, setType] = useState('Examen')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          loadEvenements()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  const loadEvenements = async () => {
    try {
      const res = await fetch('/api/evenements')
      const data = await res.json()
      if (data.evenements) {
        setEvenements(data.evenements)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openModal = () => {
    setTitre('')
    setDescription('')
    setDate('')
    setHeure('')
    setType('Examen')
    setFile(null)
    setError('')
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setTitre('')
    setDescription('')
    setDate('')
    setHeure('')
    setType('Examen')
    setFile(null)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    if (!titre || !date || !type) {
      setError('Le titre, la date et le type sont requis')
      setSubmitting(false)
      return
    }

    try {
      // Construire la date complète avec l'heure
      let dateDebut = new Date(date)
      if (heure) {
        const [hours, minutes] = heure.split(':')
        dateDebut.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      } else {
        dateDebut.setHours(0, 0, 0, 0)
      }

      const url = '/api/evenements'
      const method = 'POST'

      // Mapper les types du formulaire aux types de la base de données
      const typeMapping: { [key: string]: string } = {
        'examen': 'examen',
        'réunion': 'evenement',
        'célébration': 'evenement',
        'date d\'ouverture': 'date_importante',
        'date de fermeture': 'date_importante',
        'autre': 'evenement',
      }
      const dbType = typeMapping[type.toLowerCase()] || 'evenement'

      // Upload du fichier s'il est présent
      let fichierUrl: string | null = null
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('context', 'evenement')

        const uploadRes = await fetch('/api/evenements/upload', {
          method: 'POST',
          body: formData,
        })

        const uploadData = await uploadRes.json()

        if (!uploadRes.ok) {
          setError(uploadData.error || 'Erreur lors du téléchargement du fichier')
          setSubmitting(false)
          return
        }

        fichierUrl = uploadData.url
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          description: description || null,
          date_debut: dateDebut.toISOString(),
          type: dbType,
          fichier_url: fichierUrl,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la sauvegarde')
        setSubmitting(false)
        return
      }

      closeModal()
      loadEvenements()
    } catch (err) {
      setError('Erreur de connexion')
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) {
      return
    }

    try {
      const res = await fetch(`/api/evenements/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        loadEvenements()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getDateBadgeColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-600',
      'bg-purple-100 text-purple-600',
      'bg-pink-100 text-pink-600',
      'bg-green-100 text-green-600',
      'bg-indigo-100 text-indigo-600',
      'bg-amber-100 text-amber-600',
    ]
    return colors[index % colors.length]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const months = [
      'JANVIER',
      'FÉVRIER',
      'MARS',
      'AVRIL',
      'MAI',
      'JUIN',
      'JUILLET',
      'AOÛT',
      'SEPTEMBRE',
      'OCTOBRE',
      'NOVEMBRE',
      'DÉCEMBRE',
    ]
    return {
      month: months[date.getMonth()],
      day: date.getDate(),
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    // Si l'heure est 00:00, ne pas l'afficher
    return time !== '00:00' ? time : ''
  }

  const getTypeDisplay = (type: string, titre: string) => {
    // Essayer de deviner le type depuis le titre si nécessaire
    const titreLower = titre.toLowerCase()
    if (titreLower.includes('examen')) return 'Examen'
    if (titreLower.includes('réunion')) return 'Réunion'
    if (titreLower.includes('célébration') || titreLower.includes('fête')) return 'Célébration'
    if (titreLower.includes('ouverture')) return 'Date d\'ouverture'
    if (titreLower.includes('fermeture')) return 'Date de fermeture'
    
    // Sinon utiliser le type de la base
    if (type === 'examen') return 'Examen'
    if (type === 'date_importante') return 'Date importante'
    if (type === 'vacances') return 'Vacances'
    return 'Événement'
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  // Filtrer seulement les événements de type date_importante ou examen
  // Note: Le schéma accepte 'date_importante', 'evenement', 'vacances', 'examen'
  // On affiche tous les événements pour cette page
  const datesImportantes = evenements

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Dates Importantes</h2>
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
            Nouvelle date
          </button>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Liste des dates */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-base font-semibold text-slate-800">
                  Événements scolaires ({datesImportantes.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-100">
                {datesImportantes.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-500">
                    Aucun événement pour le moment
                  </div>
                ) : (
                  datesImportantes.map((event, index) => {
                    const dateInfo = formatDate(event.date_debut)
                    const badgeColor = getDateBadgeColor(index)
                    return (
                      <div key={event.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`flex-shrink-0 ${badgeColor} p-3 rounded-lg text-center min-w-[60px]`}>
                              <p className="text-xs font-medium uppercase">{dateInfo.month}</p>
                              <p className="text-2xl font-bold">{dateInfo.day}</p>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-slate-800 mb-1">{event.titre}</h4>
                              {event.description && (
                                <p className="text-sm text-slate-600 mb-2">{event.description}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-slate-500">
                                {formatTime(event.date_debut) && (
                                  <>
                                    <span>Heure: {formatTime(event.date_debut)}</span>
                                    <span>•</span>
                                  </>
                                )}
                                <span>Type: {getTypeDisplay(event.type, event.titre)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => handleDelete(event.id)}
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
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Nouvelle date importante */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Nouvelle date importante</h3>
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
                  Titre de l'événement *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Examen trimestriel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
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
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Heure (optionnelle)
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={heure}
                      onChange={(e) => setHeure(e.target.value)}
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
                        d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type d'événement *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {typeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fichier (optionnel)
                </label>
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-slate-700 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {file && (
                  <p className="mt-1 text-xs text-slate-500">
                    Fichier sélectionné : <span className="font-medium">{file.name}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description de l'événement..."
                  rows={4}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                />
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
                  {submitting ? 'Ajout...' : 'Ajouter la date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
