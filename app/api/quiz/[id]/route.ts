import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer un quiz spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  
  let query = supabase
    .from('quiz')
    .select('*, prof:users!quiz_prof_id_fkey(nom)')
    .eq('id', params.id)
    .single()

  // Les profs ne peuvent voir que leurs propres quiz
  if (user.role === 'prof') {
    query = query.eq('prof_id', user.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 })
  }

  const raw = (data as any).questions
  let questions = Array.isArray(raw) ? raw : []
  let bareme = 20
  if (raw && typeof raw === 'object' && !Array.isArray(raw) && 'questions' in raw) {
    questions = (raw as any).questions || []
    bareme = Number((raw as any).bareme) || 20
  }

  return NextResponse.json({ quiz: { ...data, questions, bareme } })
}

// PATCH - Mettre à jour un quiz (prof uniquement, son propre quiz)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Vérifier que le quiz appartient au professeur
  const { data: quiz, error: fetchError } = await supabase
    .from('quiz')
    .select('prof_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !quiz) {
    return NextResponse.json(
      { error: 'Quiz non trouvé' },
      { status: 404 }
    )
  }

  if (quiz.prof_id !== user.id) {
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à modifier ce quiz' },
      { status: 403 }
    )
  }

  const body = await request.json()
  const { questions, titre, description, duree_minutes, date_limite } = body

  const updates: any = {}
  if (questions !== undefined) {
    updates.questions = questions
    const qList = Array.isArray(questions) ? questions : (questions?.questions || [])
    const hasOpen = qList.some((q: any) => (q.type || q.question_type) === 'ouverte')
    if (hasOpen) updates.note_automatique = false
  }
  if (titre !== undefined) updates.titre = titre
  if (description !== undefined) updates.description = description
  if (duree_minutes !== undefined) updates.duree_minutes = duree_minutes
  if (date_limite !== undefined) updates.date_limite = date_limite
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('quiz')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quiz: data })
}

// DELETE - Supprimer un quiz (prof uniquement, son propre quiz)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Vérifier que le quiz appartient au professeur
  const { data: quiz, error: fetchError } = await supabase
    .from('quiz')
    .select('prof_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !quiz) {
    return NextResponse.json(
      { error: 'Quiz non trouvé' },
      { status: 404 }
    )
  }

  if (quiz.prof_id !== user.id) {
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à supprimer ce quiz' },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('quiz')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
