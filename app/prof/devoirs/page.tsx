'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  created_at: string
  fichiers_joints?: string[]
  soumissions_count?: number
  total_eleves?: number
}

export default function DevoirsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [devoirs, setDevoirs] = useState<Devoir[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [titre, setTitre] = useState('')
  const [description, setDescription] = useState('')
  const [matiere, setMatiere] = useState('')
  const [classe, setClasse] = useState('')
  const [dateLimite, setDateLimite] = useState('')
  const [typeRendu, setTypeRendu] = useState<'fichier' | 'texte' | 'fichier_texte'>('fichier')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [error, setError] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  
  // Filtres
  const [filterStatut, setFilterStatut] = useState<string>('')
  const [filterClasse, setFilterClasse] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Options
  const [matieresOptions, setMatieresOptions] = useState<string[]>([])
  const [classesOptions, setClassesOptions] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadDevoirs()
          loadOptions()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (user?.id) {
      loadOptions()
    }
  }, [user?.id])

  const loadDevoirs = async () => {
    try {
      const res = await fetch('/api/devoirs')
      const data = await res.json()
      if (data.devoirs) {
        setDevoirs(data.devoirs)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    if (!user?.id) return
    
    try {
      // Charger les matières attribuées au professeur
      const res = await fetch(`/api/prof/${user.id}/matieres-classes`)
      const data = await res.json()
      
      if (data.matieres) {
        setMatieresOptions(data.matieres)
      }
      
      if (data.classes) {
        setClassesOptions(data.classes)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Obtenir le statut d'un devoir
  const getStatut = (devoir: Devoir): 'en_cours' | 'termine' => {
    if (!devoir.date_limite) return 'en_cours'
    const dateLimite = new Date(devoir.date_limite)
    const maintenant = new Date()
    return maintenant > dateLimite ? 'termine' : 'en_cours'
  }

  // Filtrer les devoirs
  const filteredDevoirs = devoirs.filter((d) => {
    const matchesStatut = !filterStatut || getStatut(d) === filterStatut
    const matchesClasse = !filterClasse || d.classe === filterClasse
    const matchesSearch = !searchQuery || 
      d.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.matiere.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatut && matchesClasse && matchesSearch
  })

  // Obtenir toutes les classes uniques
  const allClasses = Array.from(new Set(devoirs.map(d => d.classe).filter(Boolean)))

  const handleCopy = (devoirId: string) => {
    // TODO: Implémenter la copie
    console.log('Copier devoir:', devoirId)
  }


  const handleFileSelect = (files: FileList | null) => {
    if (!files) return
    
    const fileArray = Array.from(files)
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
    
    const validFiles = fileArray.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Type de fichier non supporté: ${file.name}. Formats acceptés: PDF, Word, PowerPoint, Images.`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`Fichier trop volumineux: ${file.name}. Taille maximale: 10MB.`)
        return false
      }
      return true
    })
    
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
      setError('')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files)
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!titre || !matiere || !classe) {
      setError('Veuillez remplir tous les champs obligatoires (titre, matière, classe).')
      return
    }

    setSaving(true)
    setError('')

    try {
      const uploadFile = async (file: File): Promise<string> => {
        const form = new FormData()
        form.append('file', file)
        form.append('context', 'devoir')
        const up = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' })
        const upData = await up.json()
        if (!up.ok) throw new Error(upData.error || 'Échec de l’upload')
        return upData.url
      }

      const fichiersJointUrls: string[] = []
      for (const f of selectedFiles) {
        fichiersJointUrls.push(await uploadFile(f))
      }

      const res = await fetch('/api/devoirs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          description,
          matiere,
          classe,
          date_limite: dateLimite || null,
          type_rendu: typeRendu,
          fichiers_joints: fichiersJointUrls,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création')
        setSaving(false)
        return
      }

      // Réinitialiser le formulaire
      setTitre('')
      setDescription('')
      setMatiere('')
      setClasse('')
      setDateLimite('')
      setTypeRendu('fichier')
      setSelectedFiles([])
      setModalOpen(false)
      setError('')

      // Recharger la liste
      loadDevoirs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const closeModal = () => {
    if (saving) return
    setModalOpen(false)
    setTitre('')
    setDescription('')
    setMatiere('')
    setClasse('')
    setDateLimite('')
    setTypeRendu('fichier')
    setSelectedFiles([])
    setError('')
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-10">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-slate-900">Devoirs</h1>
            <button
              onClick={() => setModalOpen(true)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14m-7-7v14"></path>
              </svg>
              Nouveau devoir
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="flex items-center gap-4">
            {/* Dropdown Statuts */}
            <div className="relative">
              <select
                value={filterStatut}
                onChange={(e) => setFilterStatut(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="">Tous les statuts</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
              </select>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>

            {/* Dropdown Classes */}
            <div className="relative">
              <select
                value={filterClasse}
                onChange={(e) => setFilterClasse(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="">Toutes les classes</option>
                {allClasses.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6"></path>
              </svg>
            </div>

            {/* Recherche */}
            <div className="flex-1 max-w-md ml-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher..."
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
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">Chargement...</p>
              </div>
            ) : filteredDevoirs.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">
                  {devoirs.length === 0 
                    ? 'Aucun devoir créé' 
                    : 'Aucun devoir ne correspond aux filtres'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {devoirs.length === 0 
                    ? 'Créez votre premier devoir en cliquant sur le bouton ci-dessus'
                    : 'Essayez de modifier vos critères de recherche'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDevoirs.map((d) => {
                  const statut = getStatut(d)
                  const soumissionsCount = d.soumissions_count || 0
                  const totalEleves = d.total_eleves ?? null
                  const dateEcheance = d.date_limite 
                    ? new Date(d.date_limite).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })
                    : null

                  return (
                    <div key={d.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6">
                      {/* Header avec titre, statut et actions */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1">
                          <h3 className="text-lg font-semibold text-slate-800">{d.titre}</h3>
                          <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                            statut === 'en_cours'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {statut === 'en_cours' ? 'En cours' : 'Terminé'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(d.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Copier"
                          >
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
                              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                              <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path>
                            </svg>
                          </button>
                          <Link
                            href={`/prof/devoirs/${d.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors"
                            title="Voir les détails du devoir"
                          >
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
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                              <circle cx="12" cy="12" r="3"></circle>
                            </svg>
                          </Link>
                        </div>
                      </div>

                      {/* Description */}
                      {d.description && (
                        <p className="text-sm text-slate-600 mb-4">{d.description}</p>
                      )}

                      {/* Détails */}
                      <div className="flex items-center gap-6 mb-4 text-sm text-slate-600">
                        {d.classe && (
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
                              className="text-slate-400"
                            >
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>{d.classe}</span>
                          </div>
                        )}
                        {dateEcheance && (
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
                              className="text-slate-400"
                            >
                              <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                              <line x1="16" y1="2" x2="16" y2="6"></line>
                              <line x1="8" y1="2" x2="8" y2="6"></line>
                              <line x1="3" y1="10" x2="21" y2="10"></line>
                            </svg>
                            <span>Échéance: {dateEcheance}</span>
                          </div>
                        )}
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
                            className="text-slate-400"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                          </svg>
                          <span>{totalEleves != null ? `${soumissionsCount}/${totalEleves}` : soumissionsCount} soumis</span>
                        </div>
                      </div>

                      {/* Footer : fichiers à gauche, "Voir les soumissions" toujours à droite */}
                      <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <div className="min-w-0 flex-1 flex items-center gap-2 text-sm text-slate-600">
                          {d.fichiers_joints && d.fichiers_joints.length > 0 && (() => {
                            const first = d.fichiers_joints![0]
                            const label = typeof first === 'string' && first.startsWith('http')
                              ? decodeURIComponent(first.split('/').pop() || 'Fichier')
                              : first
                            return (
                              <>
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
                                  className="text-slate-400 shrink-0"
                                >
                                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                                </svg>
                                <span className="truncate">{label}</span>
                              </>
                            )
                          })()}
                        </div>
                        <Link
                          href={`/prof/devoirs/${d.id}/soumissions`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 shrink-0"
                        >
                          Voir les soumissions
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
                            <path d="m9 18 6-6-6-6"></path>
                          </svg>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Nouveau Devoir */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Nouveau Devoir</h3>
                <button
                  onClick={closeModal}
                  className="text-slate-400 hover:text-slate-600"
                  disabled={saving}
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
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre du devoir *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Exercices Algèbre - Chapitre 5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez le devoir..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Matière */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Matière *
                </label>
                <select
                  value={matiere}
                  onChange={(e) => setMatiere(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={matieresOptions.length === 0}
                >
                  <option value="">
                    {matieresOptions.length === 0 
                      ? 'Aucune matière attribuée' 
                      : 'Sélectionner une matière'}
                  </option>
                  {matieresOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                {matieresOptions.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Contactez l'administrateur pour vous attribuer des matières
                  </p>
                )}
              </div>

              {/* Classe */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Classe *
                </label>
                <select
                  value={classe}
                  onChange={(e) => setClasse(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={classesOptions.length === 0}
                >
                  <option value="">
                    {classesOptions.length === 0
                      ? 'Aucune classe assignée'
                      : 'Sélectionner une classe'}
                  </option>
                  {classesOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {classesOptions.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    Contactez l'administrateur pour vous assigner des classes
                  </p>
                )}
              </div>

              {/* Date limite */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Date limite de remise *
                </label>
                <input
                  type="datetime-local"
                  value={dateLimite}
                  onChange={(e) => setDateLimite(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Type de rendu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Type de rendu
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="typeRendu"
                      value="fichier"
                      checked={typeRendu === 'fichier'}
                      onChange={(e) => setTypeRendu(e.target.value as 'fichier' | 'texte' | 'fichier_texte')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Fichier</p>
                      <p className="text-xs text-slate-500 mt-1">L'élève peut téléverser un fichier (PDF, Word, etc.)</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="typeRendu"
                      value="texte"
                      checked={typeRendu === 'texte'}
                      onChange={(e) => setTypeRendu(e.target.value as 'fichier' | 'texte' | 'fichier_texte')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Texte</p>
                      <p className="text-xs text-slate-500 mt-1">L'élève peut répondre directement en texte</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="typeRendu"
                      value="fichier_texte"
                      checked={typeRendu === 'fichier_texte'}
                      onChange={(e) => setTypeRendu(e.target.value as 'fichier' | 'texte' | 'fichier_texte')}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">Fichier et Texte</p>
                      <p className="text-xs text-slate-500 mt-1">L'élève peut choisir entre fichier ou texte</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Pièces jointes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Pièces jointes (optionnel)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-blue-500 bg-blue-50'
                      : selectedFiles.length > 0
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`mx-auto mb-3 ${
                      isDragging ? 'text-blue-600' : selectedFiles.length > 0 ? 'text-green-600' : 'text-slate-400'
                    }`}
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                  </svg>
                  <p className="text-sm text-slate-600 mb-2">
                    Cliquez pour téléverser ou glissez-déposez
                  </p>
                  <p className="text-xs text-slate-500">
                    PDF, Word, PowerPoint, Images
                  </p>
                </div>
                
                {/* Liste des fichiers sélectionnés */}
                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
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
                            className="text-slate-400 flex-shrink-0"
                          >
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                          </svg>
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
                          <span className="text-xs text-slate-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ml-2"
                        >
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
                            <path d="M18 6 6 18"></path>
                            <path d="m6 6 12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Message d'erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Boutons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={saving}
                >
                  {saving ? 'Création...' : 'Créer le devoir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
