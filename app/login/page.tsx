'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [codeLogin, setCodeLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Nettoyer les entrées (supprimer les espaces)
      const cleanedCode = codeLogin.trim()
      const cleanedPassword = password.trim()
      
      if (!cleanedCode || !cleanedPassword) {
        setError('Veuillez remplir tous les champs')
        setLoading(false)
        return
      }
      
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_login: cleanedCode, password: cleanedPassword }),
        credentials: 'include', // Important pour inclure les cookies
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion')
        setLoading(false)
        return
      }

      // Vérifier que la réponse contient bien les données utilisateur
      if (!data.user || !data.user.role) {
        setError('Réponse invalide du serveur')
        setLoading(false)
        return
      }

      console.log('Login successful, user role:', data.user.role)

      // Rediriger selon le rôle
      const redirect = searchParams.get('redirect') || ''
      let targetUrl = ''
      
      if (data.user.role === 'admin') {
        targetUrl = redirect || '/admin/dashboard'
      } else if (data.user.role === 'prof') {
        targetUrl = redirect || '/prof/dashboard'
      } else if (data.user.role === 'eleve') {
        targetUrl = redirect || '/eleve/dashboard'
      } else {
        setError('Rôle utilisateur invalide')
        setLoading(false)
        return
      }

      console.log('Redirecting to:', targetUrl)

      // Utiliser window.location.replace() pour forcer une navigation complète
      // replace() évite que l'utilisateur puisse revenir à la page de login avec le bouton retour
      // Le cookie est déjà défini dans la réponse HTTP, le navigateur l'enverra automatiquement
      window.location.replace(targetUrl)
    } catch (err) {
      console.error('Login error:', err)
      setError('Erreur de connexion. Vérifiez votre connexion internet.')
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen w-full flex flex-col justify-center items-center">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-900/80"></div>
        <div className="bg-gradient-to-t from-blue-900/90 to-transparent absolute inset-0"></div>
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10">
            {/* Logo */}
            <div className="flex flex-col items-center mb-10">
              <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg shadow-blue-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0zM22 10v6"></path>
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
                </svg>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight text-center">
                CodGeni Education
              </h1>
              <p className="text-slate-400 text-sm mt-1">Portail de connexion</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <label
                  htmlFor="code_login"
                  className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1"
                >
                  Code de connexion
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="code_login"
                    value={codeLogin}
                    onChange={(e) => setCodeLogin(e.target.value)}
                    className="block focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-300 text-sm text-slate-800 w-full border-slate-200 border rounded-lg pt-2.5 pr-3 pb-2.5 pl-10 shadow-sm"
                    placeholder="ELV-XXXXXX ou PRF-XXXXXX"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-500 uppercase tracking-wide ml-1"
                >
                  Mot de passe
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm text-slate-800 w-full border-slate-200 border rounded-lg pt-2.5 pr-3 pb-2.5 pl-10 shadow-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors text-sm font-medium text-white bg-blue-600 w-full border-transparent border rounded-lg pt-2.5 pr-4 pb-2.5 pl-4 shadow-sm justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Connexion...' : "S'identifier"}
              </button>
            </form>
          </div>
          <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 flex justify-center">
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                <path d="m9 12l2 2l4-4"></path>
              </svg>
              Accès sécurisé
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs font-medium text-white/60 tracking-wide">
            Développé par CodGeni
          </p>
        </div>
      </div>
    </div>
  )
}
