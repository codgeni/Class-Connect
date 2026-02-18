import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'

// GET - Comptes pour les notifications (évaluations, devoirs, fiches de cours) de l'élève
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'eleve') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  const { data: eleveClasse } = await supabase
    .from('eleve_classes')
    .select('classe:classes(nom)')
    .eq('eleve_id', user.id)
    .single()

  const classeNom = getClasseNom(eleveClasse?.classe as { nom?: string } | { nom?: string }[] | null)

  let fichesQuery = supabase.from('cours').select('id', { count: 'exact', head: true })
  let devoirsQuery = supabase.from('devoirs').select('id', { count: 'exact', head: true })
  let evaluationsQuery = supabase.from('quiz').select('id', { count: 'exact', head: true })

  if (classeNom) {
    fichesQuery = fichesQuery.eq('classe', classeNom)
    devoirsQuery = devoirsQuery.eq('classe', classeNom)
    evaluationsQuery = evaluationsQuery.eq('classe', classeNom)
  }

  const [fiches, devoirs, evaluations] = await Promise.all([
    fichesQuery,
    devoirsQuery,
    evaluationsQuery,
  ])

  return NextResponse.json({
    fichesCours: fiches.count ?? 0,
    devoirs: devoirs.count ?? 0,
    evaluations: evaluations.count ?? 0,
  })
}
