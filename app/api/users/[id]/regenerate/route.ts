import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'
import { generateEleveCode, generateProfCode, generatePassword } from '@/lib/codes'

// POST - Régénérer le code et/ou mot de passe (admin uniquement)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { regenerate_code, regenerate_password } = await request.json()
  const supabase = getSupabaseAdmin()

  // Récupérer l'utilisateur actuel
  const { data: targetUser, error: fetchError } = await supabase
    .from('users')
    .select('role')
    .eq('id', params.id)
    .single()

  if (fetchError || !targetUser) {
    return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 })
  }

  const updates: any = {}
  const credentials: any = {}

  // Régénérer le code
  if (regenerate_code) {
    let newCode
    if (targetUser.role === 'eleve') {
      newCode = await generateEleveCode()
    } else if (targetUser.role === 'prof') {
      newCode = await generateProfCode()
    } else {
      return NextResponse.json({ error: 'Impossible de régénérer le code pour un admin' }, { status: 400 })
    }
    updates.code_login = newCode
    credentials.code_login = newCode
  }

  // Régénérer le mot de passe
  if (regenerate_password) {
    const newPassword = generatePassword()
    updates.password_hash = await hashPassword(newPassword)
    updates.password_plain = newPassword // Stocker le mot de passe en clair
    credentials.password = newPassword
  }

  // Mettre à jour
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', params.id)
    .select('id, nom, role, code_login, password_plain, actif')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    user: data,
    credentials: Object.keys(credentials).length > 0 ? credentials : undefined,
  })
}
