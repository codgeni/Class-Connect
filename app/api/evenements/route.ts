import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des événements
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('evenements')
    .select('*')
    .order('date_debut', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evenements: data || [] })
}

// POST - Créer un événement (admin uniquement)
export async function POST(request: NextRequest) {
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

  const supabase = getSupabaseAdmin()
  // Valider le type selon le schéma
  const validTypes = ['date_importante', 'evenement', 'vacances', 'examen']
  const eventType = validTypes.includes(type.toLowerCase()) ? type.toLowerCase() : 'evenement'

  const { data, error } = await supabase
    .from('evenements')
    .insert({
      titre,
      description: description || null,
      date_debut,
      date_fin: date_fin || null,
      type: eventType,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ evenement: data })
}
