import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des soumissions pour un devoir (prof uniquement)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const devoirId = params.id
  const supabase = getSupabaseAdmin()

  const { data: devoir, error: devoirError } = await supabase
    .from('devoirs')
    .select('id, titre, matiere, classe, date_limite')
    .eq('id', devoirId)
    .eq('prof_id', user.id)
    .single()

  if (devoirError || !devoir) {
    return NextResponse.json({ error: 'Devoir non trouvé' }, { status: 404 })
  }

  const { data: soumissions, error } = await supabase
    .from('soumissions')
    .select(`
      id,
      eleve_id,
      contenu,
      fichier_url,
      note,
      commentaire,
      corrige,
      submitted_at,
      corrected_at,
      eleve:users!soumissions_eleve_id_fkey(nom, prenom)
    `)
    .eq('devoir_id', devoirId)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ devoir, soumissions: soumissions || [] })
}
