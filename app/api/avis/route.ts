import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des avis
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('avis')
    .select('*, auteur:users!avis_auteur_id_fkey(nom)')

  // Admin : tous les avis. Élèves/Profs : selon visibilité.
  if (user.role === 'eleve') {
    query = query.eq('visible_eleves', true)
  } else if (user.role === 'prof') {
    query = query.eq('visible_profs', true)
  }

  query = query.order('created_at', { ascending: false }).order('id', { ascending: false })
  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ avis: data || [] })
}

// POST - Créer un avis (admin uniquement)
export async function POST(request: NextRequest) {
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
  
  // Préparer les données d'insertion
  const insertData: any = {
    titre,
    contenu,
    auteur_id: user.id,
    urgent: urgent || false,
    visible_eleves: visible_eleves !== undefined ? visible_eleves : true,
    visible_profs: visible_profs !== undefined ? visible_profs : true,
  }

  // Ciblage : null = tous, sinon une classe précise
  insertData.cible_classe = (cible_classe && cible_classe !== 'tous') ? cible_classe : null

  // Ajouter la date de publication si spécifiée (on greffe l'heure actuelle pour garder un ordre précis)
  if (date_publication) {
    const now = new Date()
    const chosen = new Date(date_publication)
    chosen.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds())
    insertData.created_at = chosen.toISOString()
  }

  const { data, error } = await supabase
    .from('avis')
    .insert(insertData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ avis: data })
}
