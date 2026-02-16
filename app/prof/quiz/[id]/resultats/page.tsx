'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'

interface Question {
  type: string
  texte: string
  points?: number
  options?: string[]
}

interface Reponse {
  id: string
  eleve_id: string
  reponses: Record<string, unknown>
  note: number | null
  corrige: boolean
  submitted_at: string
  corrected_at: string | null
  eleve?: { nom?: string; prenom?: string }
}

export default function QuizResultatsPage() {
  const router = useRouter()
  const params = useParams()
  const quizId = params.id as string

  const [user, setUser] = useState<any>(null)
  const [quiz, setQuiz] = useState<{ titre: string; questions: Question[]; bareme: number } | null>(null)
  const [reponses, setReponses] = useState<Reponse[]>([])
  const [loading, setLoading] = useState(true)
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadResultats()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router, quizId])

  const loadResultats = async () => {
    try {
      const res = await fetch(`/api/quiz/${quizId}/resultats`)
      const data = await res.json()
      if (!res.ok) {
        router.push('/prof/quiz')
        return
      }
      setQuiz(data.quiz)
      setReponses(data.reponses || [])
      const initial: Record<string, string> = {}
      ;(data.reponses || []).forEach((r: Reponse) => {
        initial[r.eleve_id] = r.note != null ? String(r.note) : ''
      })
      setNoteInputs(initial)
    } catch {
      router.push('/prof/quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNote = async (eleveId: string) => {
    const raw = noteInputs[eleveId]
    const note = raw === '' || raw === undefined ? null : parseFloat(raw)
    if (note !== null && (Number.isNaN(note) || note < 0)) return
    setSavingId(eleveId)
    try {
      const res = await fetch(`/api/quiz/${quizId}/reponses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eleve_id: eleveId, note }),
      })
      if (!res.ok) {
        const d = await res.json()
        alert(d.error || 'Erreur')
        return
      }
      const data = await res.json()
      setReponses(prev => prev.map(r => r.eleve_id === eleveId ? { ...r, note: data.reponse?.note ?? r.note, corrige: true } : r))
    } finally {
      setSavingId(null)
    }
  }

  const formatRep = (rep: unknown): string => {
    if (rep === true) return 'Vrai'
    if (rep === false) return 'Faux'
    if (typeof rep === 'string') return rep
    return '—'
  }

  if (loading || !user || !quiz) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  const bareme = quiz.bareme ?? 20

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Link href={`/prof/quiz/${quizId}`} className="text-blue-600 hover:underline">← Retour au quiz</Link>
            <h1 className="text-xl font-semibold text-slate-800">Résultats · {quiz.titre}</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {reponses.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                Aucune réponse soumise pour ce quiz.
              </div>
            ) : (
              reponses.map((r) => (
                <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <span className="font-medium text-slate-800">
                        {(r.eleve as any)?.prenom} {(r.eleve as any)?.nom}
                      </span>
                      <span className="text-slate-500 text-sm ml-2">
                        soumis le {new Date(r.submitted_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-sm text-slate-600">
                        Note / {bareme} :
                        <input
                          type="number"
                          min={0}
                          max={bareme}
                          step={0.5}
                          value={noteInputs[r.eleve_id] ?? (r.note != null ? String(r.note) : '')}
                          onChange={e => setNoteInputs(prev => ({ ...prev, [r.eleve_id]: e.target.value }))}
                          className="ml-2 w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSaveNote(r.eleve_id)}
                        disabled={savingId === r.eleve_id}
                        className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {savingId === r.eleve_id ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      {r.corrige && <span className="text-xs text-green-600 font-medium">Corrigé</span>}
                    </div>
                  </div>
                  <div className="p-6 space-y-4">
                    {quiz.questions.map((q, index) => {
                      const rep = (r.reponses || {})[String(index)]
                      return (
                        <div key={index} className="border-b border-slate-100 pb-4 last:border-0">
                          <p className="font-medium text-slate-800 mb-1">
                            {index + 1}. {q.texte}
                            {q.points != null ? <span className="text-slate-500 text-sm ml-2">({q.points} pt)</span> : null}
                          </p>
                          <div className="bg-slate-50 rounded-lg px-3 py-2 text-slate-700 text-sm">
                            <strong>Réponse de l&apos;élève :</strong> {formatRep(rep)}
                          </div>
                          {q.type === 'ouverte' && (
                            <p className="text-amber-700 text-xs mt-1">Question ouverte — attribuez la note ci-dessus (total ou partie) selon le barème.</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
