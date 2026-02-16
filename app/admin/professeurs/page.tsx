'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Prof {
  id: string
  nom: string
  prenom?: string
  email?: string
  code_login: string
  password_plain?: string
  actif: boolean
  created_at: string
}

export default function ProfesseursPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [profs, setProfs] = useState<Prof[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedProf, setSelectedProf] = useState<Prof | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  // Info modal states
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState<string | null>(null)
  const [savingInfo, setSavingInfo] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  
  // Matières et classes
  const [selectedMatieres, setSelectedMatieres] = useState<string[]>([])
  const [selectedClasses, setSelectedClasses] = useState<string[]>([])
  const [allMatieres, setAllMatieres] = useState<string[]>([])
  const [allClasses, setAllClasses] = useState<string[]>([])
  const [savingMatieresClasses, setSavingMatieresClasses] = useState(false)
  const [loadingMatieresClasses, setLoadingMatieresClasses] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          loadProfs()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  const loadProfs = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        setProfs(data.users.filter((u: any) => u.role === 'prof'))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openInfoModal = async (prof: Prof) => {
    setSelectedProf(prof)
    setEmail(prof.email || '')
    setCurrentPassword(null)
    setInfoModalOpen(true)
    setLoadingMatieresClasses(true)
    
    try {
      // Charger les matières et classes du professeur
      await loadProfMatieresClasses(prof.id)
      // Charger toutes les matières et classes disponibles
      await loadAllMatieresClasses()
    } finally {
      setLoadingMatieresClasses(false)
    }
  }

  const loadProfMatieresClasses = async (profId: string) => {
    try {
      const res = await fetch(`/api/prof/${profId}/matieres-classes`)
      const data = await res.json()
      if (data.matieres) {
        setSelectedMatieres(data.matieres)
      }
      if (data.classes) {
        setSelectedClasses(data.classes)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadAllMatieresClasses = async () => {
    try {
      const [matieresRes, classesRes] = await Promise.all([
        fetch('/api/matieres'),
        fetch('/api/classes'),
      ])
      
      if (!matieresRes.ok) {
        const errorData = await matieresRes.json().catch(() => ({}))
        console.error('Erreur matières:', errorData.error || matieresRes.statusText)
        setAllMatieres([])
      } else {
        const matieresData = await matieresRes.json()
        if (matieresData.matieres && Array.isArray(matieresData.matieres)) {
          setAllMatieres(matieresData.matieres.map((m: any) => m.nom).filter(Boolean))
        } else {
          setAllMatieres([])
        }
      }
      
      if (!classesRes.ok) {
        const errorData = await classesRes.json().catch(() => ({}))
        console.error('Erreur classes:', errorData.error || classesRes.statusText)
        setAllClasses([])
      } else {
        const classesData = await classesRes.json()
        if (classesData.classes && Array.isArray(classesData.classes)) {
          setAllClasses(classesData.classes.map((c: any) => c.nom).filter(Boolean))
        } else {
          setAllClasses([])
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement:', err)
      setAllMatieres([])
      setAllClasses([])
    }
  }

  const handleMatiereToggle = (matiere: string) => {
    setSelectedMatieres(prev =>
      prev.includes(matiere)
        ? prev.filter(m => m !== matiere)
        : [...prev, matiere]
    )
  }

  const handleClasseToggle = (classe: string) => {
    setSelectedClasses(prev =>
      prev.includes(classe)
        ? prev.filter(c => c !== classe)
        : [...prev, classe]
    )
  }

  const handleSaveMatieresClasses = async () => {
    if (!selectedProf) return
    
    try {
      setSavingMatieresClasses(true)
      const res = await fetch(`/api/prof/${selectedProf.id}/matieres-classes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matieres: selectedMatieres,
          classes: selectedClasses,
        }),
      })

      if (res.ok) {
        // Recharger les données
        await loadProfMatieresClasses(selectedProf.id)
        alert('Matières et classes mises à jour avec succès!')
      } else {
        const data = await res.json()
        alert(data.error || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      console.error(err)
      alert('Erreur de connexion')
    } finally {
      setSavingMatieresClasses(false)
    }
  }

  const closeInfoModal = () => {
    if (savingInfo || regenerating || savingMatieresClasses) return
    setInfoModalOpen(false)
    setSelectedProf(null)
    setEmail('')
    setCurrentPassword(null)
    setSelectedMatieres([])
    setSelectedClasses([])
    setAllMatieres([])
    setAllClasses([])
    setLoadingMatieresClasses(false)
  }

  const handleSaveEmail = async () => {
    if (!selectedProf) return
    try {
      setSavingInfo(true)
      const res = await fetch(`/api/users/${selectedProf.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        loadProfs()
        closeInfoModal()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingInfo(false)
    }
  }

  const handleRegenerate = async (type: 'code' | 'password' | 'both') => {
    if (!selectedProf) return
    try {
      setRegenerating(true)
      const res = await fetch(`/api/users/${selectedProf.id}/regenerate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          regenerate_code: type === 'code' || type === 'both',
          regenerate_password: type === 'password' || type === 'both',
        }),
      })

      const data = await res.json()
      if (res.ok && data.credentials) {
        // Afficher le nouveau mot de passe
        if (data.credentials.password) {
          setCurrentPassword(data.credentials.password)
        }
        // Mettre à jour le code si régénéré
        if (data.credentials.code_login && selectedProf) {
          setSelectedProf({ ...selectedProf, code_login: data.credentials.code_login })
          loadProfs()
        } else if (data.user && selectedProf) {
          setSelectedProf({ ...selectedProf, code_login: data.user.code_login, password_plain: data.user.password_plain })
          loadProfs()
        }
        // Recharger pour mettre à jour le mot de passe stocké
        loadProfs()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setRegenerating(false)
    }
  }

  const toggleActif = async (id: string, actif: boolean) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actif: !actif }),
      })
      if (res.ok) {
        loadProfs()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copié dans le presse-papiers !')
  }

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Professeurs</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            {profs.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">Aucun professeur enregistré</p>
                <p className="text-sm text-slate-400 mt-2">
                  Créez des comptes depuis la page "Créer des comptes"
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Nom
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Code de connexion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Statut
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Date de création
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {profs.map((prof) => (
                        <tr key={prof.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openInfoModal(prof)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {prof.nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <code className="bg-slate-100 px-2 py-1 rounded">{prof.code_login}</code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                prof.actif
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {prof.actif ? 'Actif' : 'Bloqué'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(prof.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleActif(prof.id, prof.actif)}
                              className={`${
                                prof.actif
                                  ? 'text-red-600 hover:text-red-800'
                                  : 'text-green-600 hover:text-green-800'
                              } font-medium`}
                            >
                              {prof.actif ? 'Bloquer' : 'Débloquer'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Modal Informations Professeur */}
      {infoModalOpen && selectedProf && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Informations du professeur</h3>
                <button
                  onClick={closeInfoModal}
                  className="text-slate-400 hover:text-slate-600"
                  disabled={savingInfo || regenerating}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18"></path>
                    <path d="m6 6 12 12"></path>
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Nom */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                <input
                  type="text"
                  value={selectedProf.nom}
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@exemple.com"
                  />
                  <button
                    onClick={handleSaveEmail}
                    disabled={savingInfo || email === selectedProf.email}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingInfo ? 'Sauvegarde...' : 'Modifier'}
                  </button>
                </div>
              </div>

              {/* Code de connexion */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Code de connexion (ID)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedProf.code_login}
                    disabled
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedProf.code_login)}
                    className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                    title="Copier"
                  >
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
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                      <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path>
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRegenerate('code')}
                    disabled={regenerating}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regenerating ? 'Génération...' : 'Régénérer'}
                  </button>
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Mot de passe</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentPassword || selectedProf.password_plain || '••••••••••••'}
                    disabled
                    className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono ${
                      currentPassword || selectedProf.password_plain
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  />
                  {(currentPassword || selectedProf.password_plain) && (
                    <button
                      onClick={() => copyToClipboard(currentPassword || selectedProf.password_plain || '')}
                      className="px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Copier"
                    >
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
                        <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
                        <path d="M4 16c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2"></path>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleRegenerate('password')}
                    disabled={regenerating}
                    className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {regenerating ? 'Génération...' : 'Régénérer'}
                  </button>
                </div>
                {currentPassword && (
                  <p className="mt-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded p-2">
                    ✓ Nouveau mot de passe généré. Il sera sauvegardé et visible ici.
                  </p>
                )}
              </div>

              {/* Bouton régénérer les deux */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleRegenerate('both')}
                  disabled={regenerating}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {regenerating ? 'Génération...' : 'Régénérer ID et mot de passe'}
                </button>
              </div>

              {/* Matières et Classes */}
              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-lg font-semibold text-slate-800 mb-4">Matières et Classes</h4>
                
                {/* Matières */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Matières attribuées
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {loadingMatieresClasses ? (
                      <p className="text-sm text-slate-500">Chargement des matières...</p>
                    ) : allMatieres.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500 mb-2">Aucune matière disponible</p>
                        <p className="text-xs text-slate-400">
                          Créez des matières depuis la page "Créer des comptes" ou ajoutez-les directement dans la base de données
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allMatieres.map((matiere) => (
                          <label
                            key={matiere}
                            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedMatieres.includes(matiere)}
                              onChange={() => handleMatiereToggle(matiere)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{matiere}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Classes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Classes assignées
                  </label>
                  <div className="border border-slate-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {loadingMatieresClasses ? (
                      <p className="text-sm text-slate-500">Chargement des classes...</p>
                    ) : allClasses.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-slate-500 mb-2">Aucune classe disponible</p>
                        <p className="text-xs text-slate-400">
                          Créez des classes depuis la page "Créer des comptes" ou ajoutez-les directement dans la base de données
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {allClasses.map((classe) => (
                          <label
                            key={classe}
                            className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded"
                          >
                            <input
                              type="checkbox"
                              checked={selectedClasses.includes(classe)}
                              onChange={() => handleClasseToggle(classe)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">{classe}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bouton sauvegarder */}
                <button
                  onClick={handleSaveMatieresClasses}
                  disabled={savingMatieresClasses}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingMatieresClasses ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
