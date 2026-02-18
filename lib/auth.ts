import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from './supabase'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET!

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}

// Convertir la clé secrète en format compatible avec jose
const getJwtSecret = () => {
  return new TextEncoder().encode(JWT_SECRET)
}

export interface User {
  id: string
  nom: string
  role: 'admin' | 'eleve' | 'prof'
  code_login: string
  actif: boolean
}

export interface SessionPayload {
  userId: string
  role: string
  code_login: string
}

// Créer une session JWT
export async function createSession(user: User): Promise<string> {
  const payload: SessionPayload = {
    userId: user.id,
    role: user.role,
    code_login: user.code_login,
  }
  
  const secret = getJwtSecret()
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  
  return token
}

// Vérifier un token JWT (compatible Edge Runtime)
export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    if (!JWT_SECRET) {
      console.error('JWT_SECRET is not defined!')
      return null
    }
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    return payload as unknown as SessionPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Obtenir l'utilisateur depuis la requête (pour API routes et middleware)
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get('session')?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('users')
    .select('id, nom, role, code_login, actif')
    .eq('id', payload.userId)
    .eq('actif', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as User
}

// Obtenir l'utilisateur depuis les cookies (pour Server Components)
export async function getCurrentUserFromCookies(): Promise<User | null> {
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  const token = cookieStore.get('session')?.value

  if (!token) {
    return null
  }

  const payload = await verifyToken(token)
  if (!payload) {
    return null
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('users')
    .select('id, nom, role, code_login, actif')
    .eq('id', payload.userId)
    .eq('actif', true)
    .single()

  if (error || !data) {
    return null
  }

  return data as User
}

// Vérifier le mot de passe
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword)
}

// Hasher un mot de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Middleware helper pour vérifier le rôle
export function requireRole(user: User | null, allowedRoles: string[]): boolean {
  if (!user) return false
  return allowedRoles.includes(user.role)
}

// Définir le cookie de session
export function setSessionCookie(token: string) {
  cookies().set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: '/',
  })
}

// Supprimer le cookie de session
export function clearSessionCookie() {
  cookies().delete('session')
}
