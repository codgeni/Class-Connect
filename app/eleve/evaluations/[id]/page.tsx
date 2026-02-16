'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Question {
  type: 'qcm' | 'vrai_faux' | 'ouverte'
  texte: string
  points: number
  options?: string[]
  reponse_correcte?: string | boolean
}

interface Quiz {
  id: string
  titre: string
  description?: string
  matiere: string
  classe?: string
  duree_minutes?: number
  bareme?: number
  date_debut?: string
  date_limite?: string
  questions: Question[]
}

export default function EvaluationQuizPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [reponse, setReponse] = useState<any>(null)
  const [reponses, setReponses] = useState<Record<number, string | boolean>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'eleve') setUser(data.user)
        else router.push('/login')
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    if (user?.id && quizId) loadQuiz()
  }, [user?.id, quizId])

  const loadQuiz = async () => {
    try {
      const res = await fetch(`/api/quiz/${quizId}`)
      const data = await res.json()
      if (!res.ok) {
        router.push('/eleve/evaluations')
        return
      }
      let questions: Question[] = []
      const raw = data.quiz.questions
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          questions = parsed?.questions ?? (Array.isArray(parsed) ? parsed : [])
        } catch {
          questions = []
        }
      } else if (Array.isArray(raw)) {
        questions = raw
      } else if (raw?.questions) {
        questions = raw.questions
      }
      setQuiz({ ...data.quiz, questions })

      const rRes = await fetch(`/api/quiz/${quizId}/reponse`)
      if (rRes.ok) {
        const rData = await rRes.json()
        if (rData.reponse?.reponses) setReponses(rData.reponse.reponses)
        setReponse(rData.reponse || null)
      }
    } catch {
      router.push('/eleve/evaluations')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const res = await fetch(`/api/quiz/${quizId}/repondre`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reponses }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'envoi')
        setSaving(false)
        return
      }
      setReponse(data.reponse)
      setReponses(data.reponse?.reponses || {})
      // Rester sur la page : affichage direct de "Voir mes résultats" (lecture seule)
    } catch {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !user || !quiz) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Chargement...</p>
        </div>
      </div>
    )
  }

  const dateDebut = quiz.date_debut ? new Date(quiz.date_debut) : null
  const dateLimite = quiz.date_limite ? new Date(quiz.date_limite) : null
  const maintenant = new Date().getTime()
  const pasEncoreOuvert = dateDebut && maintenant < dateDebut.getTime()
  const estExpire = dateLimite && maintenant > dateLimite.getTime()
  const aDejaRepondu = !!reponse

  if (pasEncoreOuvert && !aDejaRepondu) {
    return (
      <div className="h-screen flex overflow-hidden bg-slate-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
            <Link href="/eleve/evaluations" className="text-blue-600 hover:underline">← Retour aux évaluations</Link>
          </header>
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
              <p className="text-slate-700 font-medium">Ce quiz n&apos;est pas encore disponible.</p>
              <p className="text-sm text-slate-500 mt-2">Il ouvrira le {dateDebut?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
              <Link href="/eleve/evaluations" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retour</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (estExpire && !aDejaRepondu) {
    return (
      <div className="h-screen flex overflow-hidden bg-slate-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
            <Link href="/eleve/evaluations" className="text-blue-600 hover:underline">← Retour aux évaluations</Link>
          </header>
          <main className="flex-1 flex items-center justify-center p-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center max-w-md">
              <p className="text-slate-700 font-medium">Ce quiz a expiré.</p>
              <p className="text-sm text-slate-500 mt-2">La date limite était le {dateLimite?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.</p>
              <Link href="/eleve/evaluations" className="inline-block mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retour</Link>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (aDejaRepondu) {
    const questions = quiz.questions || []
    const bareme = quiz.bareme ?? 20
    return (
      <div className="h-screen flex overflow-hidden bg-slate-50">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
            <div className="flex items-center justify-between">
              <Link href="/eleve/evaluations" className="text-blue-600 hover:underline">← Retour aux évaluations</Link>
              <h1 className="text-xl font-semibold text-slate-800">{quiz.titre}</h1>
              <span className="text-sm text-slate-500">{quiz.matiere}{quiz.classe ? ` • ${quiz.classe}` : ''}</span>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 text-green-800 font-medium">
                Quiz soumis avec succès. Vous pouvez consulter vos réponses ci-dessous.
              </div>
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800">Vos réponses (lecture seule)</h2>
                <p className="text-sm text-slate-500 mt-1">Vous ne pouvez plus modifier vos réponses.</p>
                {reponse?.note != null ? (
                  <p className="mt-4 text-lg font-bold text-green-600">Note : {reponse.note}/{bareme}</p>
                ) : (
                  <p className="mt-4 text-amber-700 font-medium">En attente de correction par le professeur.</p>
                )}
              </div>
              {questions.map((q, index) => {
                const rep = reponses[index]
                const repStr = rep === true ? 'Vrai' : rep === false ? 'Faux' : (typeof rep === 'string' ? rep : '—')
                return (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <p className="font-medium text-slate-800 mb-2">
                      {index + 1}. {q.texte}
                      {q.points ? <span className="text-slate-500 text-sm ml-2">({q.points} pt{q.points > 1 ? 's' : ''})</span> : null}
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700">
                      {q.type === 'ouverte' ? (
                        <p className="whitespace-pre-wrap">{repStr || '—'}</p>
                      ) : (
                        <p><strong>Votre réponse :</strong> {repStr}</p>
                      )}
                    </div>
                  </div>
                )
              })}
              <div className="pt-4">
                <Link href="/eleve/evaluations" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Retour aux évaluations</Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    )
  }

  const questions = quiz.questions || []

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <Link href="/eleve/evaluations" className="text-blue-600 hover:underline">← Retour</Link>
            <h1 className="text-xl font-semibold text-slate-800">{quiz.titre}</h1>
            <span className="text-sm text-slate-500">{quiz.matiere}{quiz.classe ? ` • ${quiz.classe}` : ''}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-8">
            {questions.map((q, index) => (
              <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <p className="font-medium text-slate-800 mb-3">
                  {index + 1}. {q.texte}
                  {q.points ? <span className="text-slate-500 text-sm ml-2">({q.points} pt{q.points > 1 ? 's' : ''})</span> : null}
                </p>
                {q.type === 'qcm' && q.options && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${index}`}
                          checked={reponses[index] === opt}
                          onChange={() => setReponses(prev => ({ ...prev, [index]: opt }))}
                          className="text-blue-600"
                        />
                        <span className="text-slate-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {q.type === 'vrai_faux' && (
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${index}`}
                        checked={reponses[index] === true}
                        onChange={() => setReponses(prev => ({ ...prev, [index]: true }))}
                        className="text-blue-600"
                      />
                      <span>Vrai</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`q-${index}`}
                        checked={reponses[index] === false}
                        onChange={() => setReponses(prev => ({ ...prev, [index]: false }))}
                        className="text-blue-600"
                      />
                      <span>Faux</span>
                    </label>
                  </div>
                )}
                {q.type === 'ouverte' && (
                  <textarea
                    value={typeof reponses[index] === 'string' ? reponses[index] : ''}
                    onChange={e => setReponses(prev => ({ ...prev, [index]: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    rows={3}
                    placeholder="Votre réponse..."
                  />
                )}
              </div>
            ))}

            {error && <p className="text-red-600 text-sm">{error}</p>}

            <div className="flex justify-end gap-3">
              <Link href="/eleve/evaluations" className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200">Annuler</Link>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {saving ? 'Envoi...' : 'Soumettre'}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  )
}
