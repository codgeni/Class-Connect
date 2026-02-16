import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des messages (pour les conversations)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const destinataireId = searchParams.get('destinataire_id')

  if (destinataireId) {
    // Récupérer les messages entre l'utilisateur et le destinataire
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        expediteur:users!messages_expediteur_id_fkey(nom, prenom),
        destinataire:users!messages_destinataire_id_fkey(nom, prenom)
      `)
      .or(`and(expediteur_id.eq.${user.id},destinataire_id.eq.${destinataireId}),and(expediteur_id.eq.${destinataireId},destinataire_id.eq.${user.id})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ messages: data || [] })
  }

  return NextResponse.json({ messages: [] })
}

// POST - Envoyer un message
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const body = await request.json()
  const { destinataire_id, contenu } = body

  if (!destinataire_id || !contenu || !contenu.trim()) {
    return NextResponse.json(
      { error: 'Destinataire et contenu requis' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  // Vérifier que le destinataire existe
  const { data: destinataire, error: destinataireError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', destinataire_id)
    .single()

  if (destinataireError || !destinataire) {
    return NextResponse.json({ error: 'Destinataire non trouvé' }, { status: 404 })
  }

  // Si c'est un prof, vérifier qu'il peut envoyer à cet élève (élève dans ses classes)
  if (user.role === 'prof') {
    if (destinataire.role !== 'eleve') {
      return NextResponse.json(
        { error: 'Vous ne pouvez envoyer des messages qu\'aux élèves' },
        { status: 403 }
      )
    }

    // Vérifier que l'élève est dans une classe assignée au professeur
    const { data: eleveClasse } = await supabase
      .from('eleve_classes')
      .select('classe_id')
      .eq('eleve_id', destinataire_id)
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
          { error: 'Vous ne pouvez envoyer des messages qu\'aux élèves de vos classes assignées' },
          { status: 403 }
        )
      }
    }
  }

  // Créer le message
  const { data, error } = await supabase
    .from('messages')
    .insert({
      expediteur_id: user.id,
      destinataire_id,
      contenu: contenu.trim(),
    })
    .select(`
      *,
      expediteur:users!messages_expediteur_id_fkey(nom, prenom),
      destinataire:users!messages_destinataire_id_fkey(nom, prenom)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: data })
}
