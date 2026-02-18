import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'

// GET - Récupérer les matières et classes attribuées à un professeur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  // Un prof ne peut voir que ses propres matières/classes, un admin peut voir toutes
  if (user.role === 'prof' && user.id !== params.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les matières du professeur
  const { data: matieresData, error: matieresError } = await supabase
    .from('prof_matieres')
    .select('matiere:matieres(nom)')
    .eq('prof_id', params.id)

  if (matieresError) {
    return NextResponse.json({ error: matieresError.message }, { status: 500 })
  }

  const matieres = matieresData?.map((m: any) => m.matiere?.nom).filter(Boolean) || []

  // Récupérer les classes assignées au professeur
  const { data: classesData, error: classesError } = await supabase
    .from('prof_classes')
    .select('classe:classes(nom)')
    .eq('prof_id', params.id)

  if (classesError) {
    return NextResponse.json({ error: classesError.message }, { status: 500 })
  }

  const classes = classesData?.map((c: { classe?: { nom?: string } | { nom?: string }[] }) => getClasseNom(c.classe)).filter(Boolean) || []

  return NextResponse.json({ matieres, classes })
}

// PATCH - Mettre à jour les matières et classes d'un professeur (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { matieres, classes } = body

  const supabase = getSupabaseAdmin()

  // Vérifier que le professeur existe
  const { data: profData } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', params.id)
    .single()

  if (!profData || profData.role !== 'prof') {
    return NextResponse.json({ error: 'Professeur non trouvé' }, { status: 404 })
  }

  // Supprimer toutes les matières actuelles
  await supabase
    .from('prof_matieres')
    .delete()
    .eq('prof_id', params.id)

  // Ajouter les nouvelles matières
  if (matieres && matieres.length > 0) {
    for (const matiereNom of matieres) {
      // Trouver ou créer la matière
      let { data: matiereData } = await supabase
        .from('matieres')
        .select('id')
        .eq('nom', matiereNom)
        .single()

      if (!matiereData) {
        const { data: newMatiere } = await supabase
          .from('matieres')
          .insert({ nom: matiereNom })
          .select('id')
          .single()
        matiereData = newMatiere
      }

      if (matiereData) {
        await supabase.from('prof_matieres').insert({
          prof_id: params.id,
          matiere_id: matiereData.id,
        })
      }
    }
  }

  // Supprimer toutes les classes actuelles
  await supabase
    .from('prof_classes')
    .delete()
    .eq('prof_id', params.id)

  // Ajouter les nouvelles classes
  if (classes && classes.length > 0) {
    for (const classeNom of classes) {
      // Trouver ou créer la classe
      let { data: classeData } = await supabase
        .from('classes')
        .select('id')
        .eq('nom', classeNom)
        .single()

      if (!classeData) {
        const { data: newClasse } = await supabase
          .from('classes')
          .insert({ nom: classeNom })
          .select('id')
          .single()
        classeData = newClasse
      }

      if (classeData) {
        await supabase.from('prof_classes').insert({
          prof_id: params.id,
          classe_id: classeData.id,
        })
      }
    }
  }

  return NextResponse.json({ success: true })
}
