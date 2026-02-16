import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// PATCH - Modifier un avis (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { titre, contenu, urgent, visible_eleves, visible_profs, cible_classe, date_publication } = body

  if (!titre || !contenu) {
    return NextResponse.json(
      { error: 'Titre et contenu requis' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  const updateData: any = {
    titre,
    contenu,
    urgent: urgent || false,
    visible_eleves: visible_eleves !== undefined ? visible_eleves : true,
    visible_profs: visible_profs !== undefined ? visible_profs : true,
  }

  // Ajouter le ciblage par classe si spécifié
  if (cible_classe) {
    updateData.cible_classe = cible_classe
  } else {
    updateData.cible_classe = null
  }

  // Ajouter la date de publication si spécifiée
  if (date_publication) {
    updateData.created_at = date_publication
  }

  const { data, error } = await supabase
    .from('avis')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ avis: data })
}

// DELETE - Supprimer un avis (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { error } = await supabase.from('avis').delete().eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
