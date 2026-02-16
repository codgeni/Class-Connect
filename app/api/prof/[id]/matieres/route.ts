import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer les matières d'un professeur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Un prof ne peut voir que ses propres matières, un admin peut voir toutes
  if (user.role === 'prof' && user.id !== params.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('prof_matieres')
    .select('matiere:matieres(nom)')
    .eq('prof_id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const matieres = data?.map((m: any) => m.matiere?.nom).filter(Boolean) || []

  return NextResponse.json({ matieres })
}
