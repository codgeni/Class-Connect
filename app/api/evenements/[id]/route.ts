import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// PATCH - Modifier un événement (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { titre, description, date_debut, date_fin, type, fichier_url } = body

  if (!titre || !date_debut || !type) {
    return NextResponse.json(
      { error: 'Titre, date et type requis' },
      { status: 400 }
    )
  }

  // Valider le type selon le schéma
  const validTypes = ['date_importante', 'evenement', 'vacances', 'examen']
  const eventType = validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'evenement'

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('evenements')
    .update({
      titre,
      description: description || null,
      date_debut,
      date_fin: date_fin || null,
      type: eventType,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evenement: data })
}

// DELETE - Supprimer un événement (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('evenements').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
