'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Eleve {
  id: string
  nom: string
  prenom?: string
  email?: string
  code_login: string
  password_plain?: string
  actif: boolean
  created_at: string
}

export default function ElevesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [eleves, setEleves] = useState<Eleve[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedEleve, setSelectedEleve] = useState<Eleve | null>(null)
  const [blockModalOpen, setBlockModalOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [blockReason, setBlockReason] = useState('Non-paiement des frais scolaires')
  const [blockComment, setBlockComment] = useState('')
  const [savingBlock, setSavingBlock] = useState(false)

  // Info modal states
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState<string | null>(null)
  const [savingInfo, setSavingInfo] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'admin') {
          setUser(data.user)
          loadEleves()
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  const loadEleves = async () => {
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (data.users) {
        setEleves(data.users.filter((u: any) => u.role === 'eleve'))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const openBlockModal = (eleve: Eleve) => {
    setSelectedEleve(eleve)
    setBlockReason('Non-paiement des frais scolaires')
    setBlockComment('')
    setBlockModalOpen(true)
  }

  const openInfoModal = async (eleve: Eleve) => {
    setSelectedEleve(eleve)
    setEmail(eleve.email || '')
    setCurrentPassword(null)
    setInfoModalOpen(true)
  }

  const closeBlockModal = () => {
    if (savingBlock) return
    setBlockModalOpen(false)
    setSelectedEleve(null)
    setBlockComment('')
  }

  const closeInfoModal = () => {
    if (savingInfo || regenerating) return
    setInfoModalOpen(false)
    setSelectedEleve(null)
    setEmail('')
    setCurrentPassword(null)
  }

  const handleConfirmBlock = async () => {
    if (!selectedEleve) return
    try {
      setSavingBlock(true)
      await toggleActif(selectedEleve.id, selectedEleve.actif)
      setBlockModalOpen(false)
      setSelectedEleve(null)
      setBlockComment('')
    } finally {
      setSavingBlock(false)
    }
  }

  const handleSaveEmail = async () => {
    if (!selectedEleve) return
    try {
      setSavingInfo(true)
      const res = await fetch(`/api/users/${selectedEleve.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        loadEleves()
        closeInfoModal()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSavingInfo(false)
    }
  }

  const handleRegenerate = async (type: 'code' | 'password' | 'both') => {
    if (!selectedEleve) return
    try {
      setRegenerating(true)
      const res = await fetch(`/api/users/${selectedEleve.id}/regenerate`, {
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
        if (data.credentials.code_login && selectedEleve) {
          setSelectedEleve({ ...selectedEleve, code_login: data.credentials.code_login })
          loadEleves()
        } else if (data.user && selectedEleve) {
          setSelectedEleve({ ...selectedEleve, code_login: data.user.code_login, password_plain: data.user.password_plain })
          loadEleves()
        }
        // Recharger pour mettre à jour le mot de passe stocké
        loadEleves()
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
        loadEleves()
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
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Élèves</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            {eleves.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <p className="text-slate-500">Aucun élève enregistré</p>
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
                      {eleves.map((eleve) => (
                        <tr key={eleve.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => openInfoModal(eleve)}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                            {eleve.nom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            <code className="bg-slate-100 px-2 py-1 rounded">{eleve.code_login}</code>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                eleve.actif
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {eleve.actif ? 'Actif' : 'Bloqué'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                            {new Date(eleve.created_at).toLocaleDateString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                            {eleve.actif ? (
                              <button
                                onClick={() => openBlockModal(eleve)}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                Bloquer
                              </button>
                            ) : (
                              <button
                                onClick={() => toggleActif(eleve.id, eleve.actif)}
                                className="px-3 py-1.5 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                Débloquer
                              </button>
                            )}
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

      {/* Modal Informations Élève */}
      {infoModalOpen && selectedEleve && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Informations de l'élève</h3>
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
                  value={selectedEleve.nom}
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
                    disabled={savingInfo || email === selectedEleve.email}
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
                    value={selectedEleve.code_login}
                    disabled
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 text-slate-500 font-mono"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedEleve.code_login)}
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
                    value={currentPassword || selectedEleve.password_plain || '••••••••••••'}
                    disabled
                    className={`flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono ${
                      currentPassword || selectedEleve.password_plain
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-slate-50 text-slate-500'
                    }`}
                  />
                  {(currentPassword || selectedEleve.password_plain) && (
                    <button
                      onClick={() => copyToClipboard(currentPassword || selectedEleve.password_plain || '')}
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
            </div>
          </div>
        </div>
      )}

      {/* Modal Bloquer Élève */}
      {blockModalOpen && selectedEleve && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-slate-800">Bloquer un élève</h3>
                <button
                  onClick={closeBlockModal}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Fermer"
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

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motif du blocage *
                </label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Non-paiement des frais scolaires</option>
                  <option>Comportement inapproprié</option>
                  <option>Autre raison</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Commentaire (optionnel)
                </label>
                <textarea
                  rows={3}
                  value={blockComment}
                  onChange={(e) => setBlockComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Attention :</strong> L'élève perdra l&apos;accès aux cours, devoirs et quiz.
                  Un message automatique lui sera envoyé.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={closeBlockModal}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  disabled={savingBlock}
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmBlock}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={savingBlock}
                >
                  {savingBlock ? 'Blocage en cours...' : 'Confirmer le blocage'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
