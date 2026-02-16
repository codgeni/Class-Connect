import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des réponses au quiz (prof uniquement, pour correction)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { data: quiz, error: quizError } = await supabase
    .from('quiz')
    .select('id, titre, questions, prof_id')
    .eq('id', params.id)
    .single()

  if (quizError || !quiz) {
    return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
  }

  if (quiz.prof_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { data: reponses, error: repError } = await supabase
    .from('reponses_quiz')
    .select(`
      id,
      eleve_id,
      reponses,
      note,
      corrige,
      submitted_at,
      corrected_at,
      eleve:users!reponses_quiz_eleve_id_fkey(nom, prenom)
    `)
    .eq('quiz_id', params.id)
    .order('submitted_at', { ascending: false })

  if (repError) {
    return NextResponse.json({ error: repError.message }, { status: 500 })
  }

  let questions = []
  let bareme = 20
  const raw = (quiz as any).questions
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'questions' in raw) {
    questions = (raw as any).questions || []
    bareme = Number((raw as any).bareme) || 20
  } else {
    questions = Array.isArray(raw) ? raw : []
  }

  return NextResponse.json({
    quiz: { ...quiz, questions, bareme },
    reponses: reponses || [],
  })
}
