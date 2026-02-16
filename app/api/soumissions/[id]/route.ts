import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Récupérer une soumission spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const soumissionId = params.id

  const { data: soumission, error } = await supabase
    .from('soumissions')
    .select(`
      *,
      devoir:devoirs!soumissions_devoir_id_fkey(
        id,
        titre,
        description,
        matiere,
        classe,
        date_limite,
        type_rendu,
        fichiers_joints,
        prof:users!devoirs_prof_id_fkey(nom, prenom)
      ),
      eleve:users!soumissions_eleve_id_fkey(nom, prenom)
    `)
    .eq('id', soumissionId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Vérifier que l'utilisateur a le droit de voir cette soumission
  if (user.role === 'eleve' && soumission.eleve_id !== user.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  return NextResponse.json({ soumission })
}

// PATCH - Mettre à jour une soumission (pour l'élève ou le professeur)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const soumissionId = params.id
  const body = await request.json()

  // Récupérer la soumission existante avec les informations du devoir
  const { data: existingSoumission, error: fetchError } = await supabase
    .from('soumissions')
    .select(`
      *,
      devoir:devoirs!soumissions_devoir_id_fkey(
        id,
        prof_id
      )
    `)
    .eq('id', soumissionId)
    .single()

  if (fetchError || !existingSoumission) {
    return NextResponse.json({ error: 'Soumission non trouvée' }, { status: 404 })
  }

  // Cas 1: Professeur qui corrige (note, commentaire, corrige)
  if (user.role === 'prof') {
    // Vérifier que le professeur est bien le propriétaire du devoir
    if (existingSoumission.devoir.prof_id !== user.id) {
      return NextResponse.json(
        { error: 'Vous n\'êtes pas autorisé à corriger cette soumission' },
        { status: 403 }
      )
    }

    const { note, commentaire, corrige } = body

    // Validation
    if (corrige && (note === undefined || note === null)) {
      return NextResponse.json(
        { error: 'Une note est requise pour corriger la soumission' },
        { status: 400 }
      )
    }

    if (note !== undefined && (note < 0 || note > 20)) {
      return NextResponse.json(
        { error: 'La note doit être entre 0 et 20' },
        { status: 400 }
      )
    }

    // Mettre à jour la soumission
    const updateData: any = {}
    if (note !== undefined) updateData.note = note
    if (commentaire !== undefined) updateData.commentaire = commentaire || null
    if (corrige !== undefined) {
      updateData.corrige = corrige
      if (corrige) {
        updateData.corrected_at = new Date().toISOString()
      }
    }

    const { data, error } = await supabase
      .from('soumissions')
      .update(updateData)
      .eq('id', soumissionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ soumission: data })
  }

  // Cas 2: Élève qui modifie sa soumission (contenu, fichier_url)
  if (user.role === 'eleve') {
    // Vérifier que la soumission appartient à l'élève
    if (existingSoumission.eleve_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Empêcher la modification si déjà corrigée
    if (existingSoumission.corrige) {
      return NextResponse.json(
        { error: 'Cette soumission a déjà été corrigée et ne peut plus être modifiée' },
        { status: 400 }
      )
    }

    const { contenu, fichier_url, fichier_url_2 } = body
    let fichierUrlToStore: string | null = fichier_url ?? null
    if (fichier_url || fichier_url_2) {
      const urls = [fichier_url, fichier_url_2].filter(Boolean)
      fichierUrlToStore = urls.length > 1 ? JSON.stringify(urls) : (urls[0] || null)
    }

    const { data, error } = await supabase
      .from('soumissions')
      .update({
        contenu: contenu ?? null,
        fichier_url: fichierUrlToStore,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', soumissionId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ soumission: data })
  }

  return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
}
