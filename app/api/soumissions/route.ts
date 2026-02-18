import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'

// GET - Liste des soumissions pour le professeur
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Récupérer tous les devoirs du professeur
  const { data: devoirs } = await supabase
    .from('devoirs')
    .select('id')
    .eq('prof_id', user.id)

  if (!devoirs || devoirs.length === 0) {
    return NextResponse.json({ soumissions: [] })
  }

  const devoirsIds = devoirs.map(d => d.id)

  // Récupérer les soumissions pour ces devoirs
  const { data: soumissions, error } = await supabase
    .from('soumissions')
    .select(`
      *,
      eleve:users!soumissions_eleve_id_fkey(nom, prenom),
      devoir:devoirs!soumissions_devoir_id_fkey(id, titre, matiere, classe)
    `)
    .in('devoir_id', devoirsIds)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ soumissions: soumissions || [] })
}

// POST - Créer une soumission (élève uniquement)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'eleve') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { devoir_id, contenu, fichier_url, fichier_url_2 } = body

  if (!devoir_id) {
    return NextResponse.json(
      { error: 'ID du devoir requis' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  // Vérifier que le devoir existe et récupérer son type_rendu
  const { data: devoir, error: devoirError } = await supabase
    .from('devoirs')
    .select('id, type_rendu, classe')
    .eq('id', devoir_id)
    .single()

  if (devoirError || !devoir) {
    return NextResponse.json(
      { error: 'Devoir non trouvé' },
      { status: 404 }
    )
  }

  // Vérifier que l'élève est dans la bonne classe
  const { data: eleveClasse } = await supabase
    .from('eleve_classes')
    .select('classe:classes(nom)')
    .eq('eleve_id', user.id)
    .single()

  const classeNom = getClasseNom(eleveClasse?.classe as { nom?: string } | { nom?: string }[] | null)
  if (devoir.classe && classeNom && devoir.classe !== classeNom) {
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à soumettre ce devoir' },
      { status: 403 }
    )
  }

  // Vérifier le type de rendu
  if (devoir.type_rendu === 'fichier' && !fichier_url) {
    return NextResponse.json(
      { error: 'Un fichier est requis pour ce devoir' },
      { status: 400 }
    )
  }

  if (devoir.type_rendu === 'texte' && !contenu) {
    return NextResponse.json(
      { error: 'Une réponse en texte est requise pour ce devoir' },
      { status: 400 }
    )
  }

  if (devoir.type_rendu === 'fichier_texte' && !fichier_url && !fichier_url_2 && !contenu) {
    return NextResponse.json(
      { error: 'Veuillez fournir au moins un fichier et/ou une réponse en texte' },
      { status: 400 }
    )
  }

  // Pour fichier_texte avec 2 fichiers : stocker en JSON dans fichier_url
  let fichierUrlToStore: string | null = fichier_url || null
  if (devoir.type_rendu === 'fichier_texte' && (fichier_url || fichier_url_2)) {
    const urls = [fichier_url, fichier_url_2].filter(Boolean)
    fichierUrlToStore = urls.length > 1 ? JSON.stringify(urls) : (urls[0] || null)
  }

  // Vérifier si une soumission existe déjà
  const { data: existingSoumission } = await supabase
    .from('soumissions')
    .select('id, corrige')
    .eq('devoir_id', devoir_id)
    .eq('eleve_id', user.id)
    .single()

  let soumission

  if (existingSoumission) {
    // Mettre à jour la soumission existante si elle n'est pas corrigée
    if (existingSoumission.corrige) {
      return NextResponse.json(
        { error: 'Cette soumission a déjà été corrigée et ne peut plus être modifiée' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('soumissions')
      .update({
        contenu: contenu || null,
        fichier_url: fichierUrlToStore,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', existingSoumission.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    soumission = data
  } else {
    // Créer une nouvelle soumission
    const { data, error } = await supabase
      .from('soumissions')
      .insert({
        devoir_id,
        eleve_id: user.id,
        contenu: contenu || null,
        fichier_url: fichierUrlToStore,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    soumission = data
  }

  return NextResponse.json({ soumission })
}
