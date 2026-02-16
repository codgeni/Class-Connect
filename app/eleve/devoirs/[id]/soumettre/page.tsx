'use client'

import { useState, useEffect, useRef } from 'react'
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
  type_rendu?: 'fichier' | 'texte' | 'fichier_texte'
  fichiers_joints?: string[]
  prof: {
    nom: string
    prenom?: string
  }
}

interface Soumission {
  id: string
  contenu?: string
  fichier_url?: string | string[]
  note?: number
  commentaire?: string
  corrige: boolean
  submitted_at: string
  corrected_at?: string
}

export default function SoumettreDevoirPage() {
  const router = useRouter()
  const params = useParams()
  const devoirId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [devoir, setDevoir] = useState<Devoir | null>(null)
  const [soumission, setSoumission] = useState<Soumission | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  // États pour la soumission
  const [contenu, setContenu] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedFile1, setSelectedFile1] = useState<File | null>(null)
  const [selectedFile2, setSelectedFile2] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef1 = useRef<HTMLInputElement>(null)
  const fileInputRef2 = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'eleve') {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (user?.id && devoirId) {
      loadDevoir()
    }
  }, [user?.id, devoirId])

  const loadDevoir = async () => {
    try {
      const res = await fetch(`/api/devoirs/${devoirId}`)
      const data = await res.json()

      if (!res.ok) {
        alert('Devoir non trouvé')
        router.push('/eleve/devoirs')
        return
      }

      setDevoir(data.devoir)

      // Charger la soumission existante
      const soumissionRes = await fetch(`/api/soumissions/eleve?devoir_id=${devoirId}`)
      if (soumissionRes.ok) {
        const soumissionData = await soumissionRes.json()
        if (soumissionData.soumission) {
          setSoumission(soumissionData.soumission)
          setContenu(soumissionData.soumission.contenu || '')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Erreur de connexion')
      router.push('/eleve/devoirs')
    } finally {
      setLoading(false)
    }
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
      'image/gif',
      'text/plain'
    ]
    
    const validFiles = fileArray.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        setError(`Type de fichier non supporté: ${file.name}. Formats acceptés: PDF, Word, PowerPoint, Images, Texte.`)
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

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const allowedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'text/plain',
  ]
  const validateFile = (file: File): boolean => {
    if (!allowedFileTypes.includes(file.type)) {
      setError(`Type non supporté: ${file.name}. Formats: PDF, Word, PowerPoint, Images, Texte.`)
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`Fichier trop volumineux: ${file.name}. Max 10MB.`)
      return false
    }
    setError('')
    return true
  }

  const handleFile1Select = (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (validateFile(file)) setSelectedFile1(file)
  }
  const handleFile2Select = (files: FileList | null) => {
    if (!files?.length) return
    const file = files[0]
    if (validateFile(file)) setSelectedFile2(file)
  }

  const getStatut = () => {
    if (soumission) return 'Soumis'
    if (!devoir?.date_limite) return 'En cours'
    
    const dateLimite = new Date(devoir.date_limite)
    const maintenant = new Date()
    
    if (maintenant > dateLimite) return 'En retard'
    return 'En cours'
  }

  const isDateDepassee = () => {
    if (!devoir?.date_limite) return false
    return new Date() > new Date(devoir.date_limite)
  }

  const canSubmit = () => {
    if (soumission?.corrige) return false
    if (isDateDepassee() && !soumission) return false
    
    if (devoir?.type_rendu === 'fichier') {
      return selectedFiles.length > 0
    }
    if (devoir?.type_rendu === 'texte') {
      return contenu.trim().length > 0
    }
    if (devoir?.type_rendu === 'fichier_texte') {
      return !!(selectedFile1 || selectedFile2 || contenu.trim().length)
    }
    return false
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!canSubmit()) {
      if (devoir?.type_rendu === 'fichier' && selectedFiles.length === 0) {
        setError('Veuillez téléverser au moins un fichier.')
      } else if (devoir?.type_rendu === 'texte' && !contenu.trim()) {
        setError('Veuillez saisir votre réponse.')
      } else if (devoir?.type_rendu === 'fichier_texte' && !selectedFile1 && !selectedFile2 && !contenu.trim()) {
        setError('Veuillez ajouter au moins un fichier et/ou une réponse en texte.')
      }
      return
    }

    setSaving(true)

    try {
      const uploadFile = async (file: File): Promise<string> => {
        const form = new FormData()
        form.append('file', file)
        const up = await fetch('/api/upload', {
          method: 'POST',
          body: form,
          credentials: 'same-origin',
        })
        const upData = await up.json()
        if (!up.ok) throw new Error(upData.error || 'Échec de l’upload')
        return upData.url
      }

      let fichier_url: string | undefined
      let fichier_url_2: string | undefined
      if (devoir?.type_rendu === 'fichier_texte') {
        if (selectedFile1) fichier_url = await uploadFile(selectedFile1)
        if (selectedFile2) fichier_url_2 = await uploadFile(selectedFile2)
      } else {
        if (selectedFiles.length > 0) fichier_url = await uploadFile(selectedFiles[0])
      }

      const res = await fetch('/api/soumissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          devoir_id: devoirId,
          contenu: contenu.trim() || undefined,
          fichier_url: fichier_url,
          fichier_url_2: devoir?.type_rendu === 'fichier_texte' ? fichier_url_2 : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la soumission')
        setSaving(false)
        return
      }

      setSuccess(true)
      setSoumission(data.soumission)
      
      // Recharger après 2 secondes
      setTimeout(() => {
        router.push('/eleve/devoirs')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
      setSaving(false)
    }
  }

  if (loading || !user || !devoir) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const dateLimite = devoir.date_limite
    ? new Date(devoir.date_limite).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  const profNom = formatNomComplet(devoir.prof?.nom, devoir.prof?.prenom)

  const statut = getStatut()
  const statutColors = {
    'En cours': 'bg-blue-100 text-blue-800',
    'En retard': 'bg-red-100 text-red-800',
    'Soumis': 'bg-green-100 text-green-800'
  }

  // Si déjà soumis et corrigé, afficher les résultats
  if (soumission?.corrige) {
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
                <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
                  {devoir.titre}
                </h2>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-green-600"
                    >
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Devoir corrigé</h3>
                  <div className="flex items-baseline justify-center gap-2 mb-6">
                    <span className="text-5xl font-bold text-green-600">{soumission.note}</span>
                    <span className="text-2xl text-slate-500">/20</span>
                  </div>
                </div>

                {soumission.commentaire && (
                  <div className="bg-blue-50 rounded-lg border-2 border-blue-100 p-6 text-left">
                    <p className="text-sm font-semibold text-blue-900 mb-2">Commentaire du professeur:</p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{soumission.commentaire}</p>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-200">
                  <Link
                    href={`/eleve/devoirs/${devoirId}`}
                    className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-semibold"
                  >
                    Voir les détails
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

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
                <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
                  {devoir.titre}
                </h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statutColors[statut as keyof typeof statutColors]}`}>
                    {statut}
                  </span>
                  {dateLimite && (
                    <span className="text-sm text-slate-600">
                      Date limite: {dateLimite}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Informations du devoir */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Matière</p>
                  <p className="text-sm font-medium text-slate-800">{devoir.matiere}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Classe</p>
                  <p className="text-sm font-medium text-slate-800">{devoir.classe || 'Toutes les classes'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Professeur</p>
                  <p className="text-sm font-medium text-slate-800">{profNom}</p>
                </div>
                {dateLimite && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Date limite</p>
                    <p className={`text-sm font-medium ${isDateDepassee() ? 'text-red-600' : 'text-slate-800'}`}>
                      {dateLimite}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Instructions du devoir */}
            {devoir.description && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Instructions du devoir</h3>
                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 p-6 rounded-lg border border-slate-200">
                  {devoir.description}
                </div>
              </div>
            )}

            {/* Pièces jointes du professeur */}
            {devoir.fichiers_joints && devoir.fichiers_joints.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">Pièces jointes du professeur</h3>
                <div className="space-y-3">
                  {devoir.fichiers_joints.map((fichier, idx) => {
                    const isUrl = typeof fichier === 'string' && fichier.startsWith('http')
                    const label = isUrl ? decodeURIComponent(fichier.split('/').pop() || 'Fichier') : fichier
                    return (
                      <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
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
                            className="text-blue-600"
                          >
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>
                          </svg>
                          <span className="text-sm font-medium text-slate-700 truncate">{label}</span>
                        </div>
                        {isUrl ? (
                          <a
                            href={fichier}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg text-sm font-semibold"
                          >
                            Ouvrir / Télécharger
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Fichier non disponible</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Message de succès */}
            {success && (
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-3">
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
                    className="text-green-600"
                  >
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                  <div>
                    <p className="font-semibold text-green-800">Devoir soumis avec succès</p>
                    <p className="text-sm text-green-700 mt-1">Redirection en cours...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Zone de soumission */}
            {!soumission && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <h3 className="text-lg font-semibold text-slate-800">Soumettre votre devoir</h3>

                {/* Type fichier_texte : 2 emplacements fichiers + zone texte (tous affichés) */}
                {devoir.type_rendu === 'fichier_texte' && (
                  <>
                    <p className="text-sm font-medium text-slate-700">Vous pouvez joindre jusqu’à 2 fichiers et écrire votre réponse ci-dessous.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fichier 1 (optionnel)</label>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile1Select(e.dataTransfer.files); }}
                          onClick={() => fileInputRef1.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            ref={fileInputRef1}
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                            onChange={(e) => handleFile1Select(e.target.files)}
                            className="hidden"
                          />
                          {selectedFile1 ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-medium text-slate-700 truncate">{selectedFile1.name}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedFile1(null); }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-slate-400">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                              </svg>
                              <p className="text-xs text-slate-500">Cliquez ou glissez-déposez</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Fichier 2 (optionnel)</label>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile2Select(e.dataTransfer.files); }}
                          onClick={() => fileInputRef2.current?.click()}
                          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                            isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            ref={fileInputRef2}
                            type="file"
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                            onChange={(e) => handleFile2Select(e.target.files)}
                            className="hidden"
                          />
                          {selectedFile2 ? (
                            <div className="flex items-center justify-center gap-2">
                              <span className="text-sm font-medium text-slate-700 truncate">{selectedFile2.name}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setSelectedFile2(null); }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                            </div>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mx-auto mb-2 text-slate-400">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                              </svg>
                              <p className="text-xs text-slate-500">Cliquez ou glissez-déposez</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Réponse en texte (optionnel)</label>
                      <textarea
                        value={contenu}
                        onChange={(e) => setContenu(e.target.value)}
                        rows={10}
                        placeholder="Écris ta réponse ici..."
                        className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-sans"
                      />
                      <p className="mt-1 text-xs text-slate-500">{contenu.length} caractère{contenu.length !== 1 ? 's' : ''}</p>
                    </div>
                  </>
                )}

                {/* Zone de téléversement de fichier (type fichier uniquement) */}
                {devoir.type_rendu === 'fichier' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Téléverser votre fichier <span className="text-red-500">*</span>
                    </label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                        isDragging
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple={false}
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                        onChange={(e) => handleFileSelect(e.target.files)}
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
                        className={`mx-auto mb-3 ${isDragging ? 'text-blue-600' : 'text-slate-400'}`}
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                      </svg>
                      <p className="text-sm text-slate-600 mb-1">
                        Cliquez pour téléverser ou glissez-déposez
                      </p>
                      <p className="text-xs text-slate-500">
                        PDF, Word, PowerPoint, Images (max 10MB)
                      </p>
                    </div>

                    {selectedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
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
                              className="text-blue-600"
                            >
                              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                              <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 hover:shadow-sm"
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
                                <path d="M18 6L6 18M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Zone de texte (type texte uniquement) */}
                {devoir.type_rendu === 'texte' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Écris ta réponse ici <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={contenu}
                      onChange={(e) => setContenu(e.target.value)}
                      rows={15}
                      placeholder="Écris ta réponse ici..."
                      className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-sans"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      {contenu.length} caractère{contenu.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Message d'erreur */}
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Message si date dépassée */}
                {isDateDepassee() && !soumission && (
                  <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ La date limite est dépassée. Vous ne pouvez plus soumettre ce devoir.
                    </p>
                  </div>
                )}

                {/* Bouton de soumission */}
                <div className="pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={saving || !canSubmit() || isDateDepassee()}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
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
                          <path d="m22 2-7 20-4-9-9-4Z"></path>
                          <path d="M22 2 11 13"></path>
                        </svg>
                        <span>Soumettre le devoir</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Soumission existante */}
            {soumission && !soumission.corrige && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Votre soumission</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    En attente de correction
                  </span>
                </div>

                {getFichierUrls(soumission.fichier_url).length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Fichier(s) soumis:</p>
                    <div className="space-y-2">
                      {getFichierUrls(soumission.fichier_url).map((url, i) => (
                        <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
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
                            className="text-blue-600 shrink-0"
                          >
                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                            <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>
                          </svg>
                          <span className="text-sm font-medium text-slate-700 flex-1 truncate">{url.split('/').pop() || 'Fichier'}</span>
                          <a href={url} target="_blank" rel="noopener noreferrer" download={url.split('/').pop() || undefined} className="text-blue-600 hover:underline text-sm">Télécharger</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {soumission.contenu && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-slate-700 mb-2">Réponse soumise:</p>
                    <div className="p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                      <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{soumission.contenu}</p>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200 text-xs text-slate-500">
                  Soumis le {new Date(soumission.submitted_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
