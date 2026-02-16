'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  consultations?: number
}

export default function FichesCoursPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [titre, setTitre] = useState('')
  const [classe, setClasse] = useState('')
  const [matiere, setMatiere] = useState('')
  const [typeContenu, setTypeContenu] = useState<'fichier' | 'texte'>('fichier')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [contenuTexte, setContenuTexte] = useState('')
  const [error, setError] = useState('')
  
  // Options
  const [classesOptions, setClassesOptions] = useState<string[]>([])
  const [matieresOptions, setMatieresOptions] = useState<string[]>([])
  
  // Filtres et recherche
  const [filterMatiere, setFilterMatiere] = useState<string>('')
  const [filterClasse, setFilterClasse] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

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
  }, [router])

  useEffect(() => {
    if (user?.id) {
      loadOptions()
    }
  }, [user?.id])

  const loadCours = async () => {
    try {
      const res = await fetch('/api/cours')
      const data = await res.json()
      if (data.cours) {
        setCours(data.cours)
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
      // Charger les matières et classes attribuées au professeur
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

  const handleFileSelect = (file: File) => {
    // Vérifier le type de fichier
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']
    if (!allowedTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Veuillez sélectionner un PDF, Word ou PowerPoint.')
      return
    }
    
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Taille maximale : 10MB.')
      return
    }
    
    setSelectedFile(file)
    setError('')
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
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!titre || !classe || !matiere) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }

    if (typeContenu === 'fichier' && !selectedFile) {
      setError('Veuillez sélectionner un fichier.')
      return
    }

    if (typeContenu === 'texte' && !contenuTexte.trim()) {
      setError('Veuillez saisir le contenu texte.')
      return
    }

    setSaving(true)
    setError('')

    try {
      let fichierUrl: string | null = null

      if (typeContenu === 'fichier' && selectedFile) {
        const form = new FormData()
        form.append('file', selectedFile)
        form.append('context', 'cours')
        const up = await fetch('/api/upload', { method: 'POST', body: form, credentials: 'same-origin' })
        const upData = await up.json()
        if (!up.ok) throw new Error(upData.error || 'Échec de l’upload du fichier')
        fichierUrl = upData.url
      }

      const res = await fetch('/api/cours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          matiere,
          classe,
          type_contenu: typeContenu,
          contenu: typeContenu === 'texte' ? contenuTexte : null,
          fichier_url: fichierUrl,
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
      setClasse('')
      setMatiere('')
      setTypeContenu('fichier')
      setSelectedFile(null)
      setContenuTexte('')
      setModalOpen(false)
      setError('')

      // Recharger la liste
      loadCours()
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
    setClasse('')
    setMatiere('')
    setTypeContenu('fichier')
    setSelectedFile(null)
    setContenuTexte('')
    setError('')
  }

  // Filtrer les cours
  const filteredCours = cours.filter((c) => {
    const matchesMatiere = !filterMatiere || c.matiere === filterMatiere
    const matchesClasse = !filterClasse || c.classe === filterClasse
    const matchesSearch = !searchQuery || 
      c.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.matiere.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMatiere && matchesClasse && matchesSearch
  })

  // Obtenir toutes les matières et classes uniques pour les filtres
  const allMatieres = Array.from(new Set(cours.map(c => c.matiere).filter(Boolean)))
  const allClasses = Array.from(new Set(cours.map(c => c.classe).filter(Boolean)))

  // Couleurs pour les icônes (rotation)
  const getIconColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-600' },
      { bg: 'bg-purple-100', text: 'text-purple-600' },
      { bg: 'bg-green-100', text: 'text-green-600' },
      { bg: 'bg-orange-100', text: 'text-orange-600' },
      { bg: 'bg-pink-100', text: 'text-pink-600' },
      { bg: 'bg-indigo-100', text: 'text-indigo-600' },
    ]
    return colors[index % colors.length]
  }

  const handleDelete = async (coursId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette fiche de cours ?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/cours/${coursId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        loadCours()
      } else {
        alert('Erreur lors de la suppression')
      }
    } catch (err) {
      console.error(err)
      alert('Erreur de connexion')
    }
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
            <h1 className="text-3xl font-bold text-slate-900">Fiches de Cours</h1>
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
              Nouvelle fiche
            </button>
          </div>

          {/* Filtres et recherche */}
          <div className="flex items-center gap-4">
            {/* Dropdown Matières */}
            <div className="relative">
              <select
                value={filterMatiere}
                onChange={(e) => setFilterMatiere(e.target.value)}
                className="appearance-none bg-white border border-slate-300 rounded-lg px-4 py-2 pr-8 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
              >
                <option value="">Toutes les matières</option>
                {allMatieres.map((m) => (
                  <option key={m} value={m}>
                    {m}
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
            ) : filteredCours.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">
                  {cours.length === 0 
                    ? 'Aucune fiche de cours créée' 
                    : 'Aucune fiche ne correspond aux filtres'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {cours.length === 0 
                    ? 'Créez votre première fiche de cours en cliquant sur le bouton ci-dessus'
                    : 'Essayez de modifier vos critères de recherche'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCours.map((c, index) => {
                  const iconColor = getIconColor(index)
                  const dateFormatted = new Date(c.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                  
                  return (
                    <div key={c.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer">
                      <Link href={`/prof/fiches-cours/${c.id}`} className="block">
                        <div className="p-6">
                        {/* Header avec icône et actions */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${iconColor.bg} ${iconColor.text} p-3 rounded-lg flex-shrink-0`}>
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
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                              <polyline points="14 2 14 8 20 8"></polyline>
                              <line x1="16" y1="13" x2="8" y2="13"></line>
                              <line x1="16" y1="17" x2="8" y2="17"></line>
                              <polyline points="10 9 9 9 8 9"></polyline>
                            </svg>
                          </div>
                        </div>

                        {/* Titre */}
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">{c.titre}</h3>

                        {/* Détails */}
                        <div className="space-y-2.5 mb-4">
                          {/* Matière */}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
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
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                            </svg>
                            <span>{c.matiere}</span>
                          </div>

                          {/* Classe */}
                          {c.classe && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
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
                              <span>{c.classe}</span>
                            </div>
                          )}
                        </div>

                        {/* Date de publication */}
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-400">
                            Publié le {dateFormatted}
                          </p>
                        </div>
                        </div>
                      </Link>
                      {/* Actions en dehors du lien */}
                      <div className="px-6 pb-4">
                        <div className="flex justify-end">
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleDelete(c.id)
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Supprimer"
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
                              <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Nouvelle Fiche de Cours */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Nouvelle Fiche de Cours</h3>
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
                  Titre de la fiche *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Chapitre 5 - Algèbre linéaire"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Classe et Matière */}
              <div className="grid grid-cols-2 gap-4">
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
              </div>

              {/* Type de contenu */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Type de contenu *
                </label>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="typeContenu"
                      value="fichier"
                      checked={typeContenu === 'fichier'}
                      onChange={() => setTypeContenu('fichier')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Fichier (PDF, Word, PowerPoint)</p>
                      <p className="text-xs text-slate-500 mt-1">Téléverser un document</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-3 p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name="typeContenu"
                      value="texte"
                      checked={typeContenu === 'texte'}
                      onChange={() => setTypeContenu('texte')}
                      className="mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">Texte enrichi</p>
                      <p className="text-xs text-slate-500 mt-1">Éditeur de texte intégré</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Zone de téléversement ou éditeur de texte */}
              {typeContenu === 'fichier' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Téléverser un fichier *
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : selectedFile
                        ? 'border-green-500 bg-green-50'
                        : 'border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx"
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
                        isDragging ? 'text-blue-600' : selectedFile ? 'text-green-600' : 'text-slate-400'
                      }`}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                    </svg>
                    {selectedFile ? (
                      <div>
                        <p className="text-sm font-medium text-green-700">{selectedFile.name}</p>
                        <p className="text-xs text-green-600 mt-1">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Cliquez pour téléverser ou glissez-déposez
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Contenu texte *
                  </label>
                  <textarea
                    value={contenuTexte}
                    onChange={(e) => setContenuTexte(e.target.value)}
                    rows={10}
                    placeholder="Saisissez le contenu de votre fiche de cours..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={typeContenu === 'texte'}
                  />
                </div>
              )}

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
                  {saving ? 'Création...' : 'Créer la fiche'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
