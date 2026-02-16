import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des cours
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase.from('cours').select('*, prof:users!cours_prof_id_fkey(nom)')

  // Les profs voient leurs propres cours
  if (user.role === 'prof') {
    query = query.eq('prof_id', user.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cours: data || [] })
}

// POST - Créer un cours (prof uniquement)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { titre, description, matiere, classe, contenu, fichier_url, type_contenu } = body

  if (!titre || !matiere || !classe) {
    return NextResponse.json(
      { error: 'Titre, matière et classe requis' },
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
      { error: 'Vous n\'êtes pas autorisé à créer un cours pour cette matière' },
      { status: 403 }
    )
  }

  // Vérifier que la classe est assignée au professeur
  const { data: classeData } = await supabase
    .from('classes')
    .select('id')
    .eq('nom', classe)
    .single()

  if (!classeData) {
    return NextResponse.json(
      { error: 'Classe non trouvée' },
      { status: 400 }
    )
  }

  const { data: profClasse } = await supabase
    .from('prof_classes')
    .select('id')
    .eq('prof_id', user.id)
    .eq('classe_id', classeData.id)
    .single()

  if (!profClasse) {
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à créer un cours pour cette classe' },
      { status: 403 }
    )
  }

  const { data, error } = await supabase
    .from('cours')
    .insert({
      titre,
      description,
      matiere,
      classe, // Stocker la classe
      prof_id: user.id,
      contenu: type_contenu === 'texte' ? contenu : null,
      fichier_url: type_contenu === 'fichier' ? fichier_url : null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cours: data })
}
