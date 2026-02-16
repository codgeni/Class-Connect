import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// Endpoint de debug pour vérifier si un utilisateur existe
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code_login = searchParams.get('code_login')

  if (!code_login) {
    return NextResponse.json(
      { error: 'code_login requis' },
      { status: 400 }
    )
  }

  try {
    const supabase = getSupabaseAdmin()
    
    // Chercher l'utilisateur
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nom, prenom, email, role, code_login, actif, created_at')
      .eq('code_login', code_login.trim())
      .single()

    if (error) {
      // Chercher avec ilike (insensible à la casse)
      const { data: users } = await supabase
        .from('users')
        .select('code_login')
        .ilike('code_login', `%${code_login.trim()}%`)
        .limit(10)

      return NextResponse.json({
        found: false,
        error: error.message,
        errorCode: error.code,
        similarCodes: users?.map(u => u.code_login) || []
      })
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        role: user.role,
        code_login: user.code_login,
        actif: user.actif,
        created_at: user.created_at
      }
    })
  } catch (err: any) {
    return NextResponse.json({
      found: false,
      error: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
