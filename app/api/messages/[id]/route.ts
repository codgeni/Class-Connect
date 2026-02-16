import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer les messages avec un élève spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const eleveId = params.id
  const supabase = getSupabaseAdmin()

  // Vérifier que l'élève existe et que le prof peut lui envoyer des messages
  if (user.role === 'prof') {
    const { data: eleve } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', eleveId)
      .eq('role', 'eleve')
      .single()

    if (!eleve) {
      return NextResponse.json({ error: 'Élève non trouvé' }, { status: 404 })
    }

    // Vérifier que l'élève est dans une classe assignée au professeur
    const { data: eleveClasse } = await supabase
      .from('eleve_classes')
      .select('classe_id')
      .eq('eleve_id', eleveId)
      .single()

    if (eleveClasse) {
      const { data: profClasse } = await supabase
        .from('prof_classes')
        .select('id')
        .eq('prof_id', user.id)
        .eq('classe_id', eleveClasse.classe_id)
        .single()

      if (!profClasse) {
        return NextResponse.json(
          { error: 'Vous ne pouvez pas accéder à cette conversation' },
          { status: 403 }
        )
      }
    }
  }

  // Récupérer les messages
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      expediteur:users!messages_expediteur_id_fkey(nom, prenom),
      destinataire:users!messages_destinataire_id_fkey(nom, prenom)
    `)
    .or(`and(expediteur_id.eq.${user.id},destinataire_id.eq.${eleveId}),and(expediteur_id.eq.${eleveId},destinataire_id.eq.${user.id})`)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data || [] })
}
