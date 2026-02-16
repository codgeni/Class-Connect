import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer un devoir spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const devoirId = params.id

  const { data: devoir, error } = await supabase
    .from('devoirs')
    .select(`
      *,
      prof:users!devoirs_prof_id_fkey(nom, prenom)
    `)
    .eq('id', devoirId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!devoir) {
    return NextResponse.json({ error: 'Devoir non trouvé' }, { status: 404 })
  }

  if (user.role === 'prof' && devoir.prof_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Vérifier que l'élève est dans la bonne classe
  if (user.role === 'eleve' && devoir.classe) {
    const { data: eleveClasse } = await supabase
      .from('eleve_classes')
      .select('classe:classes(nom)')
      .eq('eleve_id', user.id)
      .single()

    const classeNom = eleveClasse?.classe?.nom || null
    if (classeNom && devoir.classe !== classeNom) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à voir ce devoir' },
        { status: 403 }
      )
    }
  }

  return NextResponse.json({ devoir })
}
