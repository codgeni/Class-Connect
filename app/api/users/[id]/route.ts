import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/auth'

// PATCH - Mettre à jour un utilisateur (admin uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const supabase = getSupabaseAdmin()

  // Si un nouveau mot de passe est fourni, le hasher
  if (body.password) {
    body.password_hash = await hashPassword(body.password)
    delete body.password
  }

  const { data, error } = await supabase
    .from('users')
    .update(body)
    .eq('id', params.id)
    .select('id, nom, prenom, email, role, code_login, actif, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}

// DELETE - Supprimer un utilisateur (admin uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()

  // Ne pas supprimer, juste désactiver
  const { error } = await supabase
    .from('users')
    .update({ actif: false })
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
