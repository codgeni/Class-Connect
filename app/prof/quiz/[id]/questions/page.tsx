'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Question {
  id?: string
  type: 'qcm' | 'vrai_faux' | 'ouverte'
  texte: string
  points: number
  reponse_correcte?: string | boolean
  options?: string[] // Pour QCM
  reponse_ouverte?: string // Pour questions ouvertes
}

interface Quiz {
  id: string
  titre: string
  matiere: string
  classe?: string
  types_questions: string[]
  duree_minutes: number
  questions: Question[]
}

export default function QuizQuestionsPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string
  
  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // État pour la question en cours d'ajout
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: 'qcm',
    texte: '',
    points: 1,
    options: ['', '', '', ''],
  })
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

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

  const handleAddQuestion = () => {
    if (!quiz) return
    
    if (!currentQuestion.texte.trim()) {
      alert('Veuillez saisir le texte de la question')
      return
    }

    if (currentQuestion.type === 'qcm') {
      if (!currentQuestion.options || currentQuestion.options.filter(o => o.trim()).length < 2) {
        alert('Veuillez ajouter au moins 2 options pour la QCM')
        return
      }
      if (!currentQuestion.reponse_correcte) {
        alert('Veuillez sélectionner la bonne réponse')
        return
      }
    }

    if (currentQuestion.type === 'vrai_faux' && currentQuestion.reponse_correcte === undefined) {
      alert('Veuillez sélectionner la bonne réponse (Vrai ou Faux)')
      return
    }

    const newQuestions = [...(quiz.questions || [])]
    
    if (editingIndex !== null) {
      newQuestions[editingIndex] = { ...currentQuestion }
      setEditingIndex(null)
    } else {
      newQuestions.push({ ...currentQuestion })
    }

    setQuiz({ ...quiz, questions: newQuestions })
    resetQuestionForm()
  }

  const resetQuestionForm = () => {
    setCurrentQuestion({
      type: 'qcm',
      texte: '',
      points: 1,
      options: ['', '', '', ''],
    })
    setShowAddQuestion(false)
  }

  const handleSaveQuiz = async () => {
    if (!quiz || !quiz.questions || quiz.questions.length === 0) {
      alert('Veuillez ajouter au moins une question')
      return
    }

    setSaving(true)

    try {
      // Sauvegarder les questions directement (le format JSON sera géré par Supabase)
      const res = await fetch(`/api/quiz/${quizId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: quiz.questions,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Erreur lors de la sauvegarde')
        setSaving(false)
        return
      }

      alert('Quiz sauvegardé avec succès!')
      router.push(`/prof/quiz/${quizId}`)
    } catch (err) {
      console.error(err)
      alert('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const handleEditQuestion = (index: number) => {
    if (!quiz) return
    const question = quiz.questions[index]
    setCurrentQuestion({ ...question })
    setEditingIndex(index)
    setShowAddQuestion(true)
  }

  const handleDeleteQuestion = (index: number) => {
    if (!quiz) return
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return
    }
    
    const newQuestions = quiz.questions.filter((_, i) => i !== index)
    setQuiz({ ...quiz, questions: newQuestions })
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])]
    newOptions[index] = value
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const addOption = () => {
    const newOptions = [...(currentQuestion.options || []), '']
    setCurrentQuestion({ ...currentQuestion, options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = currentQuestion.options?.filter((_, i) => i !== index) || []
    if (newOptions.length >= 2) {
      setCurrentQuestion({ ...currentQuestion, options: newOptions })
    }
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  if (!quiz) {
    return null
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{quiz.titre}</h1>
              <p className="text-sm text-slate-600 mt-1">
                {quiz.matiere} {quiz.classe && `• ${quiz.classe}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/prof/quiz')}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveQuiz}
                disabled={saving || !quiz.questions || quiz.questions.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder le quiz'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Bouton ajouter question */}
            {!showAddQuestion && (
              <button
                onClick={() => setShowAddQuestion(true)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
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
                  <path d="M5 12h14m-7-7v14"></path>
                </svg>
                Ajouter une question
              </button>
            )}

            {/* Formulaire d'ajout de question */}
            {showAddQuestion && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-slate-800">
                    {editingIndex !== null ? 'Modifier la question' : 'Nouvelle question'}
                  </h2>
                  <button
                    onClick={resetQuestionForm}
                    className="text-slate-400 hover:text-slate-600"
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

                <div className="space-y-6">
                  {/* Type de question */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                      Type de question *
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'qcm', options: ['', '', '', ''], reponse_correcte: undefined })}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          currentQuestion.type === 'qcm'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-800">QCM</p>
                        <p className="text-xs text-slate-500 mt-1">Choix multiples</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'vrai_faux', reponse_correcte: undefined })}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          currentQuestion.type === 'vrai_faux'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-800">Vrai / Faux</p>
                        <p className="text-xs text-slate-500 mt-1">Réponse binaire</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'ouverte', reponse_ouverte: '' })}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          currentQuestion.type === 'ouverte'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-800">Ouverte</p>
                        <p className="text-xs text-slate-500 mt-1">Réponse libre</p>
                      </button>
                    </div>
                  </div>

                  {/* Texte de la question */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Question *
                    </label>
                    <textarea
                      value={currentQuestion.texte}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, texte: e.target.value })}
                      rows={3}
                      placeholder="Saisissez votre question..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Options pour QCM */}
                  {currentQuestion.type === 'qcm' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Options de réponse *
                      </label>
                      <div className="space-y-2">
                        {currentQuestion.options?.map((option, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="correct_answer"
                              checked={currentQuestion.reponse_correcte === option}
                              onChange={() => setCurrentQuestion({ ...currentQuestion, reponse_correcte: option })}
                              className="w-4 h-4 text-blue-600"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, e.target.value)}
                              placeholder={`Option ${index + 1}`}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            {currentQuestion.options && currentQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeOption(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
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
                            )}
                          </div>
                        ))}
                        {currentQuestion.options && currentQuestion.options.length < 6 && (
                          <button
                            type="button"
                            onClick={addOption}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                              <path d="M5 12h14m-7-7v14"></path>
                            </svg>
                            Ajouter une option
                          </button>
                        )}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Sélectionnez la bonne réponse en cliquant sur le bouton radio
                      </p>
                    </div>
                  )}

                  {/* Vrai/Faux */}
                  {currentQuestion.type === 'vrai_faux' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Bonne réponse *
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setCurrentQuestion({ ...currentQuestion, reponse_correcte: true })}
                          className={`p-4 border-2 rounded-lg transition-colors ${
                            currentQuestion.reponse_correcte === true
                              ? 'border-green-500 bg-green-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800">Vrai</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCurrentQuestion({ ...currentQuestion, reponse_correcte: false })}
                          className={`p-4 border-2 rounded-lg transition-colors ${
                            currentQuestion.reponse_correcte === false
                              ? 'border-green-500 bg-green-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm font-medium text-slate-800">Faux</p>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Question ouverte */}
                  {currentQuestion.type === 'ouverte' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Réponse attendue (optionnel)
                      </label>
                      <textarea
                        value={currentQuestion.reponse_ouverte || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, reponse_ouverte: e.target.value })}
                        rows={3}
                        placeholder="Indiquez la réponse attendue ou des éléments de réponse..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Cette réponse servira de référence pour la correction manuelle
                      </p>
                    </div>
                  )}

                  {/* Points */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Points *
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: parseInt(e.target.value) || 1 })}
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  {/* Boutons */}
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={resetQuestionForm}
                      className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={handleAddQuestion}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingIndex !== null ? 'Modifier' : 'Ajouter'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Liste des questions */}
            {quiz.questions && quiz.questions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-slate-800">
                  Questions ({quiz.questions.length})
                </h2>
                {quiz.questions.map((question, index) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
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
                        <p className="text-slate-800 font-medium mb-3">{question.texte}</p>
                        
                        {question.type === 'qcm' && question.options && (
                          <div className="space-y-2">
                            {question.options.map((option, optIndex) => (
                              <div
                                key={optIndex}
                                className={`flex items-center gap-2 p-2 rounded ${
                                  option === question.reponse_correcte
                                    ? 'bg-green-50 border border-green-200'
                                    : 'bg-slate-50'
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
                          <div className="p-3 bg-slate-50 rounded">
                            <p className="text-sm text-slate-700">
                              Bonne réponse: <span className="font-medium">{question.reponse_correcte ? 'Vrai' : 'Faux'}</span>
                            </p>
                          </div>
                        )}

                        {question.type === 'ouverte' && question.reponse_ouverte && (
                          <div className="p-3 bg-slate-50 rounded">
                            <p className="text-xs text-slate-500 mb-1">Réponse attendue:</p>
                            <p className="text-sm text-slate-700">{question.reponse_ouverte}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleEditQuestion(index)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Modifier"
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
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(index)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
                ))}
              </div>
            )}

            {(!quiz.questions || quiz.questions.length === 0) && !showAddQuestion && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">Aucune question ajoutée</p>
                <p className="text-sm text-slate-400 mt-2">
                  Cliquez sur "Ajouter une question" pour commencer
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
