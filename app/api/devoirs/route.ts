import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des devoirs
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase.from('devoirs').select('*, prof:users!devoirs_prof_id_fkey(nom)')

  // Les élèves voient seulement leurs devoirs assignés
  if (user.role === 'eleve') {
    // Pour l'instant, tous les devoirs sont visibles
    // TODO: Ajouter une table de relation devoir-élève si nécessaire
  }

  // Les profs voient leurs propres devoirs
  if (user.role === 'prof') {
    query = query.eq('prof_id', user.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Pour chaque devoir, récupérer le nombre de soumissions et le total d'élèves de la classe
  const devoirsWithCounts = await Promise.all(
    (data || []).map(async (devoir: any) => {
      const { count } = await supabase
        .from('soumissions')
        .select('id', { count: 'exact', head: true })
        .eq('devoir_id', devoir.id)

      let total_eleves: number | null = null
      if (devoir.classe) {
        const { data: classeRow } = await supabase
          .from('classes')
          .select('id')
          .eq('nom', devoir.classe)
          .single()
        if (classeRow?.id) {
          const { count: elevesCount } = await supabase
            .from('eleve_classes')
            .select('id', { count: 'exact', head: true })
            .eq('classe_id', classeRow.id)
          total_eleves = elevesCount ?? 0
        }
      }

      return {
        ...devoir,
        soumissions_count: count || 0,
        total_eleves,
      }
    })
  )

  return NextResponse.json({ devoirs: devoirsWithCounts })
}

// POST - Créer un devoir (prof uniquement)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const {
    titre,
    description,
    matiere,
    date_limite,
    points,
    classe,
    type_rendu,
    fichiers_joints,
  } = body

  if (!titre || !matiere) {
    return NextResponse.json(
      { error: 'Titre et matière requis' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()
  
  // Vérifier que la matière est attribuée au professeur
  const { data: matiereData } = await supabase
    .from('matieres')
    .select('id')
    .eq('nom', matiere)
    .single()

  if (!matiereData) {
    return NextResponse.json(
      { error: 'Matière non trouvée' },
      { status: 400 }
    )
  }

  const { data: profMatiere } = await supabase
    .from('prof_matieres')
    .select('id')
    .eq('prof_id', user.id)
    .eq('matiere_id', matiereData.id)
    .single()

  if (!profMatiere) {
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à créer un devoir pour cette matière' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('devoirs')
    .insert({
      titre,
      description,
      matiere,
      prof_id: user.id,
      date_limite: date_limite || null,
      points: points || 0,
      classe: classe || null,
      type_rendu: type_rendu || null,
      fichiers_joints: fichiers_joints || [],
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ devoir: data })
}
