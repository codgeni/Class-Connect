'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

export default function NouveauQuizPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Form states
  const [titre, setTitre] = useState('')
  const [classe, setClasse] = useState('')
  const [matiere, setMatiere] = useState('')
  const [demarrerMaintenant, setDemarrerMaintenant] = useState(true)
  const [dateDebut, setDateDebut] = useState('')
  const [tempsLimite, setTempsLimite] = useState('30')
  const [tempsLimiteQuestion, setTempsLimiteQuestion] = useState('')
  const [baremeStr, setBaremeStr] = useState('20')
  const [quizType, setQuizType] = useState<'auto' | 'manuel' | null>(null)
  const [error, setError] = useState('')
  const [pointsInputStr, setPointsInputStr] = useState('1')
  
  // Options
  const [classesOptions, setClassesOptions] = useState<string[]>([])
  const [matieresOptions, setMatieresOptions] = useState<string[]>([])

  // Questions state
  interface Question {
    type: 'qcm' | 'vrai_faux' | 'ouverte'
    texte: string
    points: number
    reponse_correcte?: string | boolean
    options?: string[]
    reponse_ouverte?: string
  }

  const [questions, setQuestions] = useState<Question[]>([])
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    type: 'qcm',
    texte: '',
    points: 1,
    options: ['', '', '', ''],
  })
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const noteAutomatique = quizType === 'auto'

  const bareme = Math.max(1, parseInt(baremeStr, 10) || 20)
  const totalPoints = questions.reduce((sum, q) => sum + (q.points || 0), 0)
  const pointsOfEdited = editingIndex !== null ? (questions[editingIndex]?.points ?? 0) : 0
  const resteDisponible = Math.max(0, bareme - totalPoints + pointsOfEdited)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
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

  const loadOptions = async () => {
    if (!user?.id) return
    
    try {
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
    } finally {
      setLoading(false)
    }
  }

  const handleAddQuestion = () => {
    if (!currentQuestion.texte.trim()) {
      alert('Veuillez saisir le texte de la question')
      return
    }

    const pts = Math.max(0, parseInt(pointsInputStr, 10) || 0)
    if (pts > bareme) {
      alert(`Les points de la question ne peuvent pas dépasser le barème (${bareme}).`)
      return
    }
    const pointsToAdd = pts < 1 ? 1 : pts
    const totalSansCetteQuestion = editingIndex !== null ? totalPoints - (questions[editingIndex]?.points ?? 0) : totalPoints
    if (totalSansCetteQuestion + pointsToAdd > bareme) {
      alert(`Le total des points ne peut pas dépasser le barème (${bareme}).`)
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

    if (editingIndex !== null) {
      const newQuestions = [...questions]
      newQuestions[editingIndex] = { ...currentQuestion, points: pointsToAdd }
      setQuestions(newQuestions)
      setEditingIndex(null)
    } else {
      setQuestions([...questions, { ...currentQuestion, points: pointsToAdd }])
    }

    resetQuestionForm()
  }

  const resetQuestionForm = () => {
    setCurrentQuestion({
      type: 'qcm',
      texte: '',
      points: 1,
      options: ['', '', '', ''],
    })
    setPointsInputStr('1')
    setShowAddQuestion(false)
  }

  const handleEditQuestion = (index: number) => {
    const question = questions[index]
    setCurrentQuestion({ ...question })
    setPointsInputStr(String(question.points ?? 1))
    setEditingIndex(index)
    setShowAddQuestion(true)
  }

  const handleDeleteQuestion = (index: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette question ?')) {
      return
    }
    setQuestions(questions.filter((_, i) => i !== index))
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!titre || !classe || !matiere || !tempsLimite) {
      setError('Veuillez remplir tous les champs obligatoires.')
      return
    }
    if (!demarrerMaintenant && !dateDebut) {
      setError('Veuillez choisir une date et heure de début ou cocher « Démarrer maintenant ».')
      return
    }

    if (quizType === null) {
      setError('Veuillez choisir le type de quiz (QCM/Vrai-Faux ou Questions ouvertes).')
      return
    }
    if (questions.length === 0) {
      setError('Veuillez ajouter au moins une question.')
      return
    }

    if (totalPoints > bareme) {
      setError(`Le total des points (${totalPoints}) ne peut pas dépasser le barème (${bareme}).`)
      return
    }

    if (totalPoints < bareme) {
      setError(`Le total des points (${totalPoints}) doit atteindre le barème (${bareme}). Ajoutez ou répartissez les points pour que la somme soit égale à ${bareme}.`)
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          classe,
          matiere,
          types_questions: [...new Set(questions.map(q => q.type))],
          demarrer_maintenant: demarrerMaintenant,
          date_debut: demarrerMaintenant ? null : dateDebut,
          duree_minutes: parseInt(tempsLimite),
          temps_limite_question: tempsLimiteQuestion ? parseInt(tempsLimiteQuestion) : null,
          note_sur: bareme,
          note_automatique: noteAutomatique,
          questions,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création')
        setSaving(false)
        return
      }

      // Rediriger vers la liste des quiz
      router.push('/prof/quiz')
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
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
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-slate-900">Nouveau Quiz</h1>
            <button
              onClick={() => router.push('/prof/quiz')}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-6">
              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titre du quiz *
                </label>
                <input
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Quiz Algèbre - Chapitre 4"
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

              {/* Type de quiz : QCM/Vrai-Faux (auto) ou Questions ouvertes (manuel) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Type de quiz *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${quizType === 'auto' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'} ${questions.length > 0 ? 'opacity-80 pointer-events-none' : ''}`}>
                    <input
                      type="radio"
                      name="quizType"
                      checked={quizType === 'auto'}
                      onChange={() => setQuizType('auto')}
                      disabled={questions.length > 0}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-slate-800">QCM et Vrai/Faux</p>
                      <p className="text-xs text-slate-500 mt-1">Correction automatique. Vous pouvez mélanger QCM et Vrai/Faux dans le même quiz.</p>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${quizType === 'manuel' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'} ${questions.length > 0 ? 'opacity-80 pointer-events-none' : ''}`}>
                    <input
                      type="radio"
                      name="quizType"
                      checked={quizType === 'manuel'}
                      onChange={() => setQuizType('manuel')}
                      disabled={questions.length > 0}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div>
                      <p className="font-medium text-slate-800">Questions ouvertes</p>
                      <p className="text-xs text-slate-500 mt-1">Correction manuelle par le professeur. Uniquement des questions à réponse libre.</p>
                    </div>
                  </label>
                </div>
                {quizType === null && questions.length > 0 && (
                  <p className="mt-2 text-sm text-amber-600">Choisissez un type de quiz pour continuer.</p>
                )}
              </div>

              {/* Démarrer maintenant ou programmer */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Disponibilité du quiz</label>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dispo"
                      checked={demarrerMaintenant}
                      onChange={() => setDemarrerMaintenant(true)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Démarrer maintenant</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="dispo"
                      checked={!demarrerMaintenant}
                      onChange={() => setDemarrerMaintenant(false)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm">Programmer pour une date et heure</span>
                  </label>
                </div>
                {!demarrerMaintenant && (
                  <div className="mt-3">
                    <input
                      type="datetime-local"
                      value={dateDebut}
                      onChange={(e) => setDateDebut(e.target.value)}
                      className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              {/* Barème (saisie libre par le prof) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Barème (note sur)</label>
                <input
                  type="number"
                  min={1}
                  value={baremeStr}
                  onChange={(e) => setBaremeStr(e.target.value)}
                  placeholder="Ex: 20"
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">Barème total du quiz (ex: 10, 20, 100). Le total des points des questions ne doit pas le dépasser.</p>
                {questions.length > 0 && (
                  <p className="mt-1 text-xs text-slate-600">Total des points actuels: {totalPoints} / {bareme}</p>
                )}
              </div>

              {/* Temps limite (minutes) */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temps limite (minutes) *
                </label>
                <input
                  type="number"
                  value={tempsLimite}
                  onChange={(e) => setTempsLimite(e.target.value)}
                  min="1"
                  className="w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Temps limite par question */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Temps limite par question (secondes) - Optionnel
                </label>
                <input
                  type="number"
                  value={tempsLimiteQuestion}
                  onChange={(e) => setTempsLimiteQuestion(e.target.value)}
                  min="1"
                  placeholder="60"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Si laissé vide, seul le temps limite global s'appliquera
                </p>
              </div>

              {/* Section Questions */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-slate-800">
                    Questions ({questions.length})
                  </h2>
                  {!showAddQuestion && quizType !== null && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIndex(null)
                        const defaultType = quizType === 'manuel' ? 'ouverte' : 'qcm'
                        setCurrentQuestion(
                          defaultType === 'ouverte'
                            ? { type: 'ouverte', texte: '', points: 1, reponse_ouverte: '' }
                            : { type: 'qcm', texte: '', points: 1, options: ['', '', '', ''] }
                        )
                        setPointsInputStr('1')
                        setShowAddQuestion(true)
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
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
                      Ajouter une question
                    </button>
                  )}
                </div>

                {/* Formulaire d'ajout de question */}
                {showAddQuestion && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-slate-800">
                        {editingIndex !== null ? 'Modifier la question' : 'Nouvelle question'}
                      </h3>
                      <button
                        type="button"
                        onClick={resetQuestionForm}
                        className="text-slate-400 hover:text-slate-600"
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
                          <path d="M18 6 6 18"></path>
                          <path d="m6 6 12 12"></path>
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Type de question (selon type de quiz) */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type de question *
                        </label>
                        {quizType === 'auto' ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'qcm', options: currentQuestion.options || ['', '', '', ''], reponse_correcte: undefined })}
                              className={`p-3 border-2 rounded-lg transition-colors text-sm ${
                                currentQuestion.type === 'qcm'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <p className="font-medium text-slate-800">QCM</p>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentQuestion({ ...currentQuestion, type: 'vrai_faux', reponse_correcte: undefined })}
                              className={`p-3 border-2 rounded-lg transition-colors text-sm ${
                                currentQuestion.type === 'vrai_faux'
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <p className="font-medium text-slate-800">Vrai / Faux</p>
                            </button>
                          </div>
                        ) : quizType === 'manuel' ? (
                          <p className="text-sm text-slate-600 py-2">Question ouverte (correction manuelle)</p>
                        ) : (
                          <p className="text-sm text-amber-600">Choisissez d&apos;abord le type de quiz ci-dessus.</p>
                        )}
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
                          <label className="block text-sm font-medium text-slate-700 mb-2">
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
                          <p className="mt-1 text-xs text-slate-500">
                            Sélectionnez la bonne réponse en cliquant sur le bouton radio
                          </p>
                        </div>
                      )}

                      {/* Vrai/Faux */}
                      {currentQuestion.type === 'vrai_faux' && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Bonne réponse *
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setCurrentQuestion({ ...currentQuestion, reponse_correcte: true })}
                              className={`p-3 border-2 rounded-lg transition-colors ${
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
                              className={`p-3 border-2 rounded-lg transition-colors ${
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
                          Points * (reste disponible: {resteDisponible})
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={pointsInputStr}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '')
                            setPointsInputStr(v)
                          }}
                          onBlur={() => {
                            const n = parseInt(pointsInputStr, 10)
                            if (Number.isNaN(n) || n < 1) setPointsInputStr('1')
                            else if (n > resteDisponible) setPointsInputStr(String(resteDisponible))
                            else setPointsInputStr(String(n))
                          }}
                          placeholder="0"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-slate-500">Vous pouvez effacer et taper le nombre de points.</p>
                      </div>

                      {/* Boutons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={resetQuestionForm}
                          className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={handleAddQuestion}
                          className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {editingIndex !== null ? 'Modifier' : 'Ajouter'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Liste des questions */}
                {questions.length > 0 && (
                  <div className="space-y-3">
                    {questions.map((question, index) => (
                      <div key={index} className="bg-white rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                                {question.type === 'qcm' ? 'QCM' : question.type === 'vrai_faux' ? 'Vrai/Faux' : 'Ouverte'}
                              </span>
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                                {question.points} pt{question.points > 1 ? 's' : ''}
                              </span>
                            </div>
                            <p className="text-sm text-slate-800 font-medium mb-2">{question.texte}</p>
                            {question.type === 'qcm' && question.options && (
                              <div className="text-xs text-slate-600">
                                {question.options.filter(o => o.trim()).length} option(s) - Réponse: {question.reponse_correcte}
                              </div>
                            )}
                            {question.type === 'vrai_faux' && (
                              <div className="text-xs text-slate-600">
                                Réponse: {question.reponse_correcte ? 'Vrai' : 'Faux'}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              type="button"
                              onClick={() => handleEditQuestion(index)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
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
                              type="button"
                              onClick={() => handleDeleteQuestion(index)}
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
                    ))}
                  </div>
                )}

                {questions.length === 0 && !showAddQuestion && (
                  <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
                    <p className="text-slate-500 text-sm">Aucune question ajoutée</p>
                    <p className="text-xs text-slate-400 mt-1">Cliquez sur "Ajouter une question" pour commencer</p>
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
                  onClick={() => router.push('/prof/quiz')}
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
                  {saving ? 'Création...' : 'Créer le quiz'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
