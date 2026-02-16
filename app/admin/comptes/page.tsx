'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface User {
  id: string
  nom: string
  role: string
  code_login: string
  actif: boolean
  created_at: string
}

export default function CreateAccountsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [credentials, setCredentials] = useState<{ code_login: string; password: string } | null>(null)

  // Form fields
  const [role, setRole] = useState<'eleve' | 'prof'>('eleve')
  const [nom, setNom] = useState('')
  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  
  // Élève fields
  const [classe, setClasse] = useState('')
  const [section, setSection] = useState('')
  
  // Professeur fields
  const [matieres, setMatieres] = useState<string[]>([])
  const [classesAssignees, setClassesAssignees] = useState<string[]>([])

  // Options
  const [classesOptions] = useState(['Secondaire 1', 'Secondaire 2', 'Secondaire 3'])
  const [matieresOptions] = useState(['Mathématiques', 'Physique', 'Chimie', 'Histoire', 'Français'])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) setUser(data.user)
        else router.push('/login')
      })
      .catch(() => router.push('/login'))
  }, [router])

  const handleMatiereChange = (matiere: string) => {
    setMatieres(prev => 
      prev.includes(matiere) 
        ? prev.filter(m => m !== matiere)
        : [...prev, matiere]
    )
  }

  const handleClasseAssigneeChange = (classe: string) => {
    setClassesAssignees(prev => 
      prev.includes(classe) 
        ? prev.filter(c => c !== classe)
        : [...prev, classe]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    // Validation
    if (!nom || !prenom || !email) {
      setError('Tous les champs obligatoires doivent être remplis')
      setLoading(false)
      return
    }

    if (role === 'eleve') {
      if (!classe || !section) {
        setError('La classe et la section sont obligatoires pour un élève')
        setLoading(false)
        return
      }
    } else {
      if (matieres.length === 0 || classesAssignees.length === 0) {
        setError('Au moins une matière et une classe doivent être sélectionnées pour un professeur')
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom,
          prenom,
          email,
          role,
          classe: role === 'eleve' ? classe : undefined,
          section: role === 'eleve' ? section : undefined,
          matieres: role === 'prof' ? matieres : undefined,
          classesAssignees: role === 'prof' ? classesAssignees : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la création')
        setLoading(false)
        return
      }

      setSuccess('Compte créé avec succès!')
      setCredentials({
        code_login: data.credentials.code_login,
        password: data.credentials.password,
      })
      
      // Reset form
      setNom('')
      setPrenom('')
      setEmail('')
      setClasse('')
      setSection('')
      setMatieres([])
      setClassesAssignees([])
      setLoading(false)
    } catch (err) {
      setError('Erreur de connexion')
      setLoading(false)
    }
  }

  if (!user) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Création de Comptes</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Formulaire de création */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Nouveau compte</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type de compte */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Type de compte *
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                        role === 'eleve'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="account-type"
                        value="eleve"
                        checked={role === 'eleve'}
                        onChange={() => setRole('eleve')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-slate-800">Élève</p>
                        <p className="text-xs text-slate-500">Créer un compte pour un élève</p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                        role === 'prof'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="account-type"
                        value="professeur"
                        checked={role === 'prof'}
                        onChange={() => setRole('prof')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <p className="font-medium text-slate-800">Professeur</p>
                        <p className="text-xs text-slate-500">Créer un compte pour un professeur</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Nom et Prénom */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Nom *
                  </label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Champs Élève */}
                {role === 'eleve' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Classe *
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {classesOptions.map((c) => (
                          <label
                            key={c}
                            className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                              classe === c
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="classe"
                              value={c}
                              checked={classe === c}
                              onChange={(e) => setClasse(e.target.value)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                              required
                            />
                            <span className="font-medium text-slate-800">{c}</span>
                            {classe === c && (
                              <svg
                                className="w-5 h-5 text-blue-600 ml-auto"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                        Section / Niveau *
                      </label>
                      <input
                        type="text"
                        value={section}
                        onChange={(e) => setSection(e.target.value)}
                        placeholder="Ex: A, B, C..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Champs Professeur */}
                {role === 'prof' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Matières *
                      </label>
                      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-[200px] overflow-y-auto">
                        <div className="space-y-2">
                          {matieresOptions.map((m) => (
                            <label
                              key={m}
                              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                matieres.includes(m)
                                  ? 'bg-blue-100 border-2 border-blue-500'
                                  : 'bg-white border-2 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={matieres.includes(m)}
                                onChange={() => handleMatiereChange(m)}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                              />
                              <span className={`font-medium flex-1 ${
                                matieres.includes(m) ? 'text-blue-900' : 'text-slate-700'
                              }`}>
                                {m}
                              </span>
                              {matieres.includes(m) && (
                                <svg
                                  className="w-5 h-5 text-blue-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                      {matieres.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {matieres.map((m) => (
                            <span
                              key={m}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                            >
                              {m}
                              <button
                                type="button"
                                onClick={() => handleMatiereChange(m)}
                                className="hover:text-blue-900"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-3">
                        Classes assignées *
                      </label>
                      <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-[200px] overflow-y-auto">
                        <div className="space-y-2">
                          {classesOptions.map((c) => (
                            <label
                              key={c}
                              className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${
                                classesAssignees.includes(c)
                                  ? 'bg-indigo-100 border-2 border-indigo-500'
                                  : 'bg-white border-2 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={classesAssignees.includes(c)}
                                onChange={() => handleClasseAssigneeChange(c)}
                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                              />
                              <span className={`font-medium flex-1 ${
                                classesAssignees.includes(c) ? 'text-indigo-900' : 'text-slate-700'
                              }`}>
                                {c}
                              </span>
                              {classesAssignees.includes(c) && (
                                <svg
                                  className="w-5 h-5 text-indigo-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </label>
                          ))}
                        </div>
                      </div>
                      {classesAssignees.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {classesAssignees.map((c) => (
                            <span
                              key={c}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full"
                            >
                              {c}
                              <button
                                type="button"
                                onClick={() => handleClasseAssigneeChange(c)}
                                className="hover:text-indigo-900"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {success}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Création...' : 'Générer le compte'}
                  </button>
                </div>
              </form>
            </div>

            {/* Résultat - Identifiants générés */}
                {credentials && (
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Identifiants générés</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Code de connexion</p>
                        <p className="text-lg font-mono font-semibold text-slate-800">
                          {credentials.code_login}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">Mot de passe</p>
                        <p className="text-lg font-mono font-semibold text-slate-800">
                          {credentials.password}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm text-amber-800">
                      ⚠️ <strong>Important:</strong> Notez ces identifiants, ils ne seront plus affichés après fermeture de cette page.
                    </p>
                  </div>
                </div>
                  </div>
                )}
          </div>
        </main>
      </div>
    </div>
  )
}
