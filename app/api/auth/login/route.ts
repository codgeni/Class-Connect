import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyPassword, createSession, setSessionCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { code_login, password } = await request.json()

    if (!code_login || !password) {
      return NextResponse.json(
        { error: 'Code de connexion et mot de passe requis' },
        { status: 400 }
      )
    }

    console.log('Login attempt for code:', code_login)

    let supabase
    try {
      supabase = getSupabaseAdmin()
    } catch (supabaseError: any) {
      console.error('Supabase initialization error:', supabaseError.message)
      return NextResponse.json(
        { error: 'Erreur de configuration serveur' },
        { status: 500 }
      )
    }

    // Nettoyer le code de connexion (supprimer les espaces)
    const cleanedCode = code_login.trim()

    // Récupérer l'utilisateur
    let user, error
    try {
      const result = await supabase
        .from('users')
        .select('id, nom, role, code_login, password_hash, actif')
        .eq('code_login', cleanedCode)
        .single()
      
      user = result.data
      error = result.error
    } catch (fetchError: any) {
      console.error('Supabase fetch error:', fetchError.message)
      console.error('Error stack:', fetchError.stack)
      
      // Vérifier si c'est un problème de connexion
      if (fetchError.message?.includes('fetch failed') || fetchError.cause) {
        return NextResponse.json(
          { error: 'Erreur de connexion à la base de données. Vérifiez votre configuration Supabase.' },
          { status: 503 }
        )
      }
      
      return NextResponse.json(
        { error: 'Erreur serveur lors de la connexion' },
        { status: 500 }
      )
    }

    if (error || !user) {
      console.error('Login error - User not found:', {
        code_login: cleanedCode,
        error: error?.message,
        errorCode: error?.code,
        errorDetails: error
      })
      
      // Vérifier si le code existe avec une recherche insensible à la casse
      try {
        const { data: users } = await supabase
          .from('users')
          .select('code_login')
          .ilike('code_login', cleanedCode)
        
        if (users && users.length > 0) {
          console.log('Found similar codes:', users.map(u => u.code_login))
        }
      } catch (searchError) {
        console.error('Error searching for similar codes:', searchError)
      }
      
      return NextResponse.json(
        { error: 'Identifiants incorrects' },
        { status: 401 }
      )
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      return NextResponse.json(
        { error: 'Compte désactivé. Contactez l\'administrateur.' },
        { status: 403 }
      )
    }

    // Vérifier le mot de passe
    console.log('Verifying password for user:', user.code_login)
    console.log('Password hash exists:', !!user.password_hash)
    console.log('Password hash length:', user.password_hash?.length)
    
    const isValid = await verifyPassword(password.trim(), user.password_hash)
    
    if (!isValid) {
      console.error('Password verification failed for:', user.code_login)
      console.error('Password provided length:', password.length)
      
      // Si le hash n'existe pas ou est invalide, essayer de régénérer
      if (!user.password_hash || user.password_hash.length < 10) {
        console.error('Invalid password hash detected')
        return NextResponse.json(
          { error: 'Erreur: Le mot de passe n\'est pas correctement configuré. Contactez l\'administrateur.' },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: 'Identifiants incorrects - Vérifiez votre mot de passe' },
        { status: 401 }
      )
    }
    
    console.log('Password verified successfully')

    // Créer la session
    const sessionToken = await createSession({
      id: user.id,
      nom: user.nom,
      role: user.role as 'admin' | 'eleve' | 'prof',
      code_login: user.code_login,
      actif: user.actif,
    })

    // Créer la réponse JSON
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nom: user.nom,
        role: user.role,
        code_login: user.code_login,
      },
    })

    // Définir le cookie avec les bonnes options
    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/',
    })

    console.log('Login successful for:', user.code_login, 'Role:', user.role)
    console.log('Session token created, cookie set')

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
