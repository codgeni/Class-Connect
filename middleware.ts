import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth'

// Routes publiques
const publicRoutes = ['/login', '/api/auth/login']

// Routes protégées par rôle
const adminRoutes = ['/admin']
const profRoutes = ['/prof']
const eleveRoutes = ['/eleve']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Autoriser les routes publiques
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Vérifier l'authentification
  const token = request.cookies.get('session')?.value

  if (!token) {
    console.log('Middleware: No token found, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyToken(token)
  if (!payload) {
    console.log('Middleware: Invalid token, redirecting to login')
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  console.log('Middleware: Authenticated user', payload.role, 'accessing', pathname)

  // Vérifier les permissions par rôle
  if (pathname.startsWith('/admin')) {
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else if (pathname.startsWith('/prof')) {
    if (payload.role !== 'prof') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } else if (pathname.startsWith('/eleve')) {
    if (payload.role !== 'eleve') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes handle their own auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
