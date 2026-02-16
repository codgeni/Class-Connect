import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

function parseQuestions(raw: any): any[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw)
      return Array.isArray(p) ? p : (p?.questions || [])
    } catch {
      return []
    }
  }
  return raw?.questions || []
}

// POST - Soumettre une réponse au quiz (élève uniquement)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'eleve') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const quizId = params.id
  const body = await request.json()
  const { reponses } = body

  if (!reponses || typeof reponses !== 'object') {
    return NextResponse.json(
      { error: 'Format des réponses invalide' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const { data: quiz } = await supabase
    .from('quiz')
    .select('questions, date_debut, date_limite')
    .eq('id', quizId)
    .single()

  if (!quiz) {
    return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
  }

  const now = new Date().getTime()
  const dateDebut = (quiz as any).date_debut ? new Date((quiz as any).date_debut).getTime() : null
  const dateLimite = (quiz as any).date_limite ? new Date((quiz as any).date_limite).getTime() : null
  if (dateDebut != null && now < dateDebut) {
    return NextResponse.json({ error: 'Ce quiz n\'est pas encore ouvert.' }, { status: 400 })
  }
  if (dateLimite != null && now > dateLimite) {
    return NextResponse.json({ error: 'Ce quiz a expiré.' }, { status: 400 })
  }

  const rawQuestions = quiz?.questions
  let bareme = 20
  let questionsList: any[] = []
  if (rawQuestions && typeof rawQuestions === 'object' && !Array.isArray(rawQuestions) && 'questions' in rawQuestions) {
    bareme = Number((rawQuestions as any).bareme) || 20
    questionsList = parseQuestions((rawQuestions as any).questions)
  } else {
    questionsList = parseQuestions(rawQuestions)
  }
  const questions = questionsList
  const noteSur = bareme > 0 ? bareme : 20

  let note: number | null = null
  let totalAutoPoints = 0
  let earnedAutoPoints = 0
  let hasOpenQuestions = false

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const type = q?.type || q?.question_type
    const points = Number(q?.points) || 1
    const correct = q?.reponse_correcte
    const studentAnswer = (reponses as Record<string, unknown>)[String(i)]

    if (type === 'ouverte') {
      hasOpenQuestions = true
      continue
    }

    totalAutoPoints += points
    if (type === 'qcm') {
      const match = String(studentAnswer) === String(correct)
      if (match) earnedAutoPoints += points
    } else if (type === 'vrai_faux') {
      const expected = correct === true || correct === 'true'
      const got = studentAnswer === true || studentAnswer === 'true'
      if (expected === got) earnedAutoPoints += points
    }
  }

  if (!hasOpenQuestions && totalAutoPoints > 0) {
    note = Math.round((earnedAutoPoints / totalAutoPoints) * noteSur * 100) / 100
  }

  const payload: Record<string, unknown> = {
    quiz_id: quizId,
    eleve_id: user.id,
    reponses,
    submitted_at: new Date().toISOString(),
  }
  if (note !== null) payload.note = note

  const { data, error } = await supabase
    .from('reponses_quiz')
    .upsert(payload as any, { onConflict: 'quiz_id,eleve_id' })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reponse: data })
}
