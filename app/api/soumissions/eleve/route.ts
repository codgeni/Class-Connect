import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer la soumission d'un élève pour un devoir spécifique
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'eleve') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const devoirId = searchParams.get('devoir_id')

  if (!devoirId) {
    return NextResponse.json(
      { error: 'ID du devoir requis' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const { data: soumission, error } = await supabase
    .from('soumissions')
    .select('*')
    .eq('devoir_id', devoirId)
    .eq('eleve_id', user.id)
    .single()

  if (error) {
    // Si aucune soumission n'existe, retourner null
    if (error.code === 'PGRST116') {
      return NextResponse.json({ soumission: null })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ soumission })
}
