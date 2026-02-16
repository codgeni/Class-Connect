import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// PATCH - Mettre à jour la note d'une réponse (prof uniquement, correction manuelle)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { eleve_id, note } = body

  if (!eleve_id) {
    return NextResponse.json({ error: 'eleve_id requis' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: quiz } = await supabase
    .from('quiz')
    .select('prof_id')
    .eq('id', params.id)
    .single()

  if (!quiz || quiz.prof_id !== user.id) {
    return NextResponse.json({ error: 'Quiz non trouvé ou non autorisé' }, { status: 404 })
  }

  const updateData: Record<string, unknown> = {
    corrige: true,
    corrected_at: new Date().toISOString(),
  }
  if (note !== undefined && note !== null) {
    const n = Number(note)
    if (!Number.isNaN(n)) updateData.note = n
  }

  const { data, error } = await supabase
    .from('reponses_quiz')
    .update(updateData)
    .eq('quiz_id', params.id)
    .eq('eleve_id', eleve_id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reponse: data })
}
