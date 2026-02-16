'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Quiz {
  id: string
  titre: string
  description?: string
  matiere: string
  classe?: string
  duree_minutes?: number
  type_notation: 'automatique' | 'manuelle'
  created_at: string
  reponses_count?: number
  total_eleves?: number
}

export default function QuizPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filtres
  const [filterMatiere, setFilterMatiere] = useState<string>('')
  const [filterClasse, setFilterClasse] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Options
  const [matieresOptions, setMatieresOptions] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadQuiz()
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

  const loadQuiz = async () => {
    try {
      const res = await fetch('/api/quiz')
      const data = await res.json()
      if (data.quiz) {
        setQuiz(data.quiz)
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
      const res = await fetch(`/api/prof/${user.id}/matieres-classes`)
      const data = await res.json()
      
      if (data.matieres) {
        setMatieresOptions(data.matieres)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Filtrer les quiz
  const filteredQuiz = quiz.filter((q) => {
    const matchesMatiere = !filterMatiere || q.matiere === filterMatiere
    const matchesClasse = !filterClasse || q.classe === filterClasse
    const matchesSearch = !searchQuery || 
      q.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.matiere.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMatiere && matchesClasse && matchesSearch
  })

  // Obtenir toutes les matières et classes uniques
  const allMatieres = Array.from(new Set(quiz.map(q => q.matiere).filter(Boolean)))
  const allClasses = Array.from(new Set(quiz.map(q => q.classe).filter(Boolean)))

  // Couleurs pour les icônes (quiz = violet, évaluation = bleu)
  const getIconColor = (type: 'quiz' | 'evaluation') => {
    return type === 'quiz'
      ? { bg: 'bg-purple-100', text: 'text-purple-600' }
      : { bg: 'bg-blue-100', text: 'text-blue-600' }
  }

  const handleCopy = (quizId: string) => {
    // TODO: Implémenter la copie
    console.log('Copier quiz:', quizId)
  }

  const handleDelete = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return
    }
    
    try {
      const res = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        loadQuiz()
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
            <h1 className="text-3xl font-bold text-slate-900">Quiz & Évaluations</h1>
            <button
              onClick={() => router.push('/prof/quiz/nouveau')}
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
              Nouveau quiz
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
            ) : filteredQuiz.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">
                  {quiz.length === 0 
                    ? 'Aucun quiz créé' 
                    : 'Aucun quiz ne correspond aux filtres'}
                </p>
                <p className="text-sm text-slate-400 mt-2">
                  {quiz.length === 0 
                    ? 'Créez votre premier quiz en cliquant sur le bouton ci-dessus'
                    : 'Essayez de modifier vos critères de recherche'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredQuiz.map((q) => {
                  const iconColor = getIconColor(q.type_notation === 'automatique' ? 'quiz' : 'evaluation')
                  const reponsesCount = q.reponses_count || 0
                  const totalEleves = q.total_eleves ?? 0

                  return (
                    <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6 cursor-pointer">
                      <Link href={`/prof/quiz/${q.id}`} className="block">
                      {/* Header avec icône */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${iconColor.bg} ${iconColor.text} p-3 rounded-lg flex-shrink-0`}>
                          {q.type_notation === 'automatique' ? (
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
                              <path d="M9 11l3 3L22 4"></path>
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                            </svg>
                          ) : (
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
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Titre */}
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">{q.titre}</h3>

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
                          <span>{q.matiere}</span>
                        </div>

                        {/* Classe */}
                        {q.classe && (
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
                            <span>{q.classe}</span>
                          </div>
                        )}

                        {/* Durée */}
                        {q.duree_minutes && (
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
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>{q.duree_minutes} minutes</span>
                          </div>
                        )}

                        {/* Type de notation */}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          {q.type_notation === 'automatique' ? (
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
                                className="text-slate-400"
                              >
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                              <span>Note automatique</span>
                            </>
                          ) : (
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
                                className="text-slate-400"
                              >
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                              <span>Note manuelle</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Footer avec nombre de réponses et lien */}
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-sm text-slate-600">
                          {reponsesCount}/{totalEleves} élèves{totalEleves > 0 ? ' de la classe' : ''} ont répondu
                        </div>
                        <Link
                          href={`/prof/quiz/${q.id}/resultats`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          Voir résultats
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
                      </Link>
                      {/* Actions en dehors du lien */}
                      <div className="px-6 pb-4 flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleCopy(q.id)
                          }}
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
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleDelete(q.id)
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
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
