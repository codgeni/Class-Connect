import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  // Récupérer les informations complètes de l'utilisateur
  const supabase = getSupabaseAdmin()
  const { data: userData } = await supabase
    .from('users')
    .select('id, nom, prenom, email, role, code_login')
    .eq('id', user.id)
    .single()

  // Si c'est un élève, récupérer aussi sa classe principale
  let classeNom: string | null = null
  if (userData?.role === 'eleve') {
    const { data: eleveClasse } = await supabase
      .from('eleve_classes')
      .select('classe:classes(nom)')
      .eq('eleve_id', user.id)
      .single()

    classeNom = eleveClasse?.classe?.nom || null
  }

  return NextResponse.json({
    user: {
      id: userData?.id || user.id,
      nom: userData?.nom || user.nom,
      prenom: userData?.prenom,
      email: userData?.email,
      role: userData?.role || user.role,
      code_login: userData?.code_login || user.code_login,
      classe: classeNom,
    },
  })
}
