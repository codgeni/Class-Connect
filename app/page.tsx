import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'

export default async function Home() {
  const token = cookies().get('session')?.value

  if (token) {
    const payload = await verifyToken(token)
    if (payload) {
      // Rediriger selon le rôle
      if (payload.role === 'admin') {
        redirect('/admin/dashboard')
      } else if (payload.role === 'prof') {
        redirect('/prof/dashboard')
      } else if (payload.role === 'eleve') {
        redirect('/eleve/dashboard')
      }
    }
  }

  redirect('/login')
}
