import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des élèves des classes assignées au professeur
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  // Vérifier que l'utilisateur demande ses propres élèves
  if (user.id !== params.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les classes assignées au professeur
  const { data: profClasses } = await supabase
    .from('prof_classes')
    .select('classe_id')
    .eq('prof_id', user.id)

  if (!profClasses || profClasses.length === 0) {
    return NextResponse.json({ eleves: [] })
  }

  const classeIds = profClasses.map(pc => pc.classe_id)

  // Récupérer les élèves de ces classes
  const { data: eleveClasses } = await supabase
    .from('eleve_classes')
    .select('eleve_id, classe:classes(nom)')
    .in('classe_id', classeIds)

  if (!eleveClasses || eleveClasses.length === 0) {
    return NextResponse.json({ eleves: [] })
  }

  const eleveIds = eleveClasses.map(ec => ec.eleve_id)

  // Récupérer les informations des élèves
  const { data: eleves } = await supabase
    .from('users')
    .select('id, nom, prenom')
    .in('id', eleveIds)
    .eq('role', 'eleve')
    .eq('actif', true)
    .order('nom', { ascending: true })

  if (!eleves || eleves.length === 0) {
    return NextResponse.json({ eleves: [] })
  }

  // Ajouter la classe à chaque élève
  const elevesWithClasse = eleves.map(eleve => {
    const eleveClasse = eleveClasses.find(ec => ec.eleve_id === eleve.id)
    return {
      id: eleve.id,
      nom: eleve.nom,
      prenom: eleve.prenom,
      classe: eleveClasse?.classe?.nom,
    }
  })

  return NextResponse.json({ eleves: elevesWithClasse })
}
