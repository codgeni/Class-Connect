import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// POST - Marquer les messages comme lus
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const expediteurId = params.id // ID de l'expéditeur (élève)
  const supabase = getSupabaseAdmin()

  // Marquer tous les messages de cet expéditeur comme lus pour l'utilisateur actuel
  const { error } = await supabase
    .from('messages')
    .update({ lu: true })
    .eq('expediteur_id', expediteurId)
    .eq('destinataire_id', user.id)
    .eq('lu', false)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
