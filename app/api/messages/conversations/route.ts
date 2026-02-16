import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des conversations pour le professeur
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les classes assignées au professeur
  const { data: profClasses } = await supabase
    .from('prof_classes')
    .select('classe_id')
    .eq('prof_id', user.id)

  if (!profClasses || profClasses.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  const classeIds = profClasses.map(pc => pc.classe_id)

  // Récupérer les élèves de ces classes
  const { data: eleveClasses } = await supabase
    .from('eleve_classes')
    .select('eleve_id, classe:classes(nom)')
    .in('classe_id', classeIds)

  if (!eleveClasses || eleveClasses.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  const eleveIds = eleveClasses.map(ec => ec.eleve_id)

  // Récupérer les informations des élèves
  const { data: eleves } = await supabase
    .from('users')
    .select('id, nom, prenom')
    .in('id', eleveIds)
    .eq('role', 'eleve')
    .eq('actif', true)

  if (!eleves || eleves.length === 0) {
    return NextResponse.json({ conversations: [] })
  }

  // Pour chaque élève, récupérer le dernier message et le nombre de messages non lus
  const conversations = await Promise.all(
    eleves.map(async (eleve) => {
      // Dernier message
      const { data: lastMessage } = await supabase
        .from('messages')
        .select('*')
        .or(`and(expediteur_id.eq.${user.id},destinataire_id.eq.${eleve.id}),and(expediteur_id.eq.${eleve.id},destinataire_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      // Nombre de messages non lus
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('expediteur_id', eleve.id)
        .eq('destinataire_id', user.id)
        .eq('lu', false)

      const eleveClasse = eleveClasses.find(ec => ec.eleve_id === eleve.id)

      return {
        eleve_id: eleve.id,
        eleve: {
          nom: eleve.nom,
          prenom: eleve.prenom,
          classe: eleveClasse?.classe?.nom,
        },
        lastMessage: lastMessage || undefined,
        unreadCount: unreadCount || 0,
      }
    })
  )

  // Trier par date du dernier message (plus récent en premier)
  conversations.sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0
    if (!a.lastMessage) return 1
    if (!b.lastMessage) return -1
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
  })

  return NextResponse.json({ conversations })
}
