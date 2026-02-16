import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer un cours spécifique
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
    .from('cours')
    .select('*, prof:users!cours_prof_id_fkey(nom)')
    .eq('id', params.id)
    .single()

  // Les profs ne peuvent voir que leurs propres cours
  if (user.role === 'prof') {
    query = query.eq('prof_id', user.id)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'Cours non trouvé' }, { status: 404 })
  }

  return NextResponse.json({ cours: data })
}

// DELETE - Supprimer un cours (prof uniquement, son propre cours)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Vérifier que le cours appartient au professeur
  const { data: cours, error: fetchError } = await supabase
    .from('cours')
    .select('prof_id')
    .eq('id', params.id)
    .single()

  if (fetchError || !cours) {
    return NextResponse.json(
      { error: 'Cours non trouvé' },
      { status: 404 }
    )
  }

  if (cours.prof_id !== user.id) {
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à supprimer ce cours' },
      { status: 403 }
    )
  }

  const { error } = await supabase
    .from('cours')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
