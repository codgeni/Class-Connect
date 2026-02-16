import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Statistiques selon le rôle
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  if (user.role === 'admin') {
    // Stats admin
    const [eleves, profs, elevesBloques, avis] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'eleve').eq('actif', true),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'prof').eq('actif', true),
      supabase.from('users').select('id', { count: 'exact' }).eq('role', 'eleve').eq('actif', false),
      supabase.from('avis').select('id', { count: 'exact' }),
    ])

    return NextResponse.json({
      eleves: eleves.count || 0,
      profs: profs.count || 0,
      elevesBloques: elevesBloques.count || 0,
      avis: avis.count || 0,
    })
  } else if (user.role === 'prof') {
    // Stats prof
    const [fichesCours, devoirs, devoirsSoumis, quiz, aCorriger, messages] = await Promise.all([
      supabase.from('cours').select('id', { count: 'exact' }).eq('prof_id', user.id),
      supabase.from('devoirs').select('id', { count: 'exact' }).eq('prof_id', user.id),
      supabase.from('soumissions').select('id', { count: 'exact' }).eq('corrige', false),
      supabase.from('quiz').select('id', { count: 'exact' }).eq('prof_id', user.id),
      supabase.from('soumissions').select('id', { count: 'exact' }).eq('corrige', false),
      supabase.from('messages').select('id', { count: 'exact' }).eq('destinataire_id', user.id).eq('lu', false),
    ])

    return NextResponse.json({
      fichesCours: fichesCours.count || 0,
      devoirs: devoirs.count || 0,
      devoirsSoumis: devoirsSoumis.count || 0,
      quiz: quiz.count || 0,
      aCorriger: aCorriger.count || 0,
      messages: messages.count || 0,
    })
  } else if (user.role === 'eleve') {
    // Stats élève
    const [fichesCours, devoirs, evaluations, avis, datesImportantes] = await Promise.all([
      supabase.from('cours').select('id', { count: 'exact' }),
      supabase.from('devoirs').select('id', { count: 'exact' }),
      supabase.from('notes').select('id', { count: 'exact' }).eq('eleve_id', user.id),
      supabase.from('avis').select('id', { count: 'exact' }).eq('visible_eleves', true),
      supabase.from('evenements').select('id', { count: 'exact' }),
    ])

    return NextResponse.json({
      fichesCours: fichesCours.count || 0,
      devoirs: devoirs.count || 0,
      evaluations: evaluations.count || 0,
      avis: avis.count || 0,
      datesImportantes: datesImportantes.count || 0,
    })
  }

  return NextResponse.json({ error: 'Rôle invalide' }, { status: 400 })
}
