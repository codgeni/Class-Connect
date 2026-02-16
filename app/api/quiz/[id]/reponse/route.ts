import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer la réponse de l'élève au quiz
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'eleve') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('reponses_quiz')
    .select('*')
    .eq('quiz_id', params.id)
    .eq('eleve_id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ reponse: data })
}
