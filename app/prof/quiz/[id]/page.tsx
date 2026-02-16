'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Question {
  id?: string
  type: 'qcm' | 'vrai_faux' | 'ouverte'
  texte: string
  points: number
  reponse_correcte?: string | boolean
  options?: string[]
  reponse_ouverte?: string
}

interface Quiz {
  id: string
  titre: string
  description?: string
  matiere: string
  classe?: string
  duree_minutes?: number
  date_limite?: string
  questions: Question[]
  created_at: string
}

export default function QuizDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadQuiz()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router, quizId])

  const loadQuiz = async () => {
    try {
      const res = await fetch(`/api/quiz/${quizId}`)
      const data = await res.json()
      
      if (res.ok && data.quiz) {
        // Parser les questions depuis JSON si nécessaire
        let questions: Question[] = []
        let parsedData: any = null
        
        if (typeof data.quiz.questions === 'string') {
          try {
            parsedData = JSON.parse(data.quiz.questions)
          } catch (e) {
            console.error('Error parsing questions JSON:', e)
          }
        } else {
          parsedData = data.quiz.questions
        }
        
        // Si c'est un objet avec metadata, extraire les questions
        if (parsedData && typeof parsedData === 'object' && 'questions' in parsedData) {
          questions = Array.isArray(parsedData.questions) ? parsedData.questions : []
        } else if (Array.isArray(parsedData)) {
          questions = parsedData
        }
        
        setQuiz({
          ...data.quiz,
          questions: questions,
        })
      } else {
        alert('Quiz non trouvé')
        router.push('/prof/quiz')
      }
    } catch (err) {
      console.error(err)
      alert('Erreur de connexion')
      router.push('/prof/quiz')
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  if (!quiz) {
    return null
  }

  const dateFormatted = quiz.date_limite 
    ? new Date(quiz.date_limite).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null

  const totalPoints = quiz.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/prof/quiz"
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
                <h1 className="text-2xl font-bold text-slate-900">{quiz.titre}</h1>
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
                    {quiz.matiere}
                  </span>
                  {quiz.classe && (
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
                      {quiz.classe}
                    </span>
                  )}
                  {quiz.duree_minutes && (
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
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                      </svg>
                      {quiz.duree_minutes} minutes
                    </span>
                  )}
                  {dateFormatted && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span>Échéance: {dateFormatted}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/prof/quiz/${quizId}/resultats`}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Voir résultats et corriger
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              {quiz.description && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-3">Description</h2>
                  <p className="text-slate-600 leading-relaxed">{quiz.description}</p>
                </div>
              )}

              {/* Résumé */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{quiz.questions?.length || 0}</p>
                    <p className="text-sm text-slate-600">Questions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{totalPoints}</p>
                    <p className="text-sm text-slate-600">Points totaux</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{quiz.duree_minutes || 'N/A'}</p>
                    <p className="text-sm text-slate-600">Minutes</p>
                  </div>
                </div>
              </div>

              {/* Liste des questions */}
              {quiz.questions && quiz.questions.length > 0 ? (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
                  {quiz.questions.map((question, index) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                            Question {index + 1}
                          </span>
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                            {question.type === 'qcm' ? 'QCM' : question.type === 'vrai_faux' ? 'Vrai/Faux' : 'Ouverte'}
                          </span>
                          <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                            {question.points} point{question.points > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-slate-800 font-medium mb-4">{question.texte}</p>
                      
                      {question.type === 'qcm' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-center gap-2 p-3 rounded ${
                                option === question.reponse_correcte
                                  ? 'bg-green-50 border border-green-200'
                                  : 'bg-slate-50 border border-slate-200'
                              }`}
                            >
                              <input
                                type="radio"
                                checked={option === question.reponse_correcte}
                                disabled
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="text-sm text-slate-700">{option}</span>
                              {option === question.reponse_correcte && (
                                <span className="ml-auto text-xs text-green-600 font-medium">✓ Bonne réponse</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {question.type === 'vrai_faux' && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                          <p className="text-sm text-slate-700">
                            Bonne réponse: <span className="font-medium text-green-600">{question.reponse_correcte ? 'Vrai' : 'Faux'}</span>
                          </p>
                        </div>
                      )}

                      {question.type === 'ouverte' && question.reponse_ouverte && (
                        <div className="p-3 bg-slate-50 rounded border border-slate-200">
                          <p className="text-xs text-slate-500 mb-1">Réponse attendue:</p>
                          <p className="text-sm text-slate-700">{question.reponse_ouverte}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">Aucune question.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
