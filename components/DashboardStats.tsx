'use client'

import Link from 'next/link'

interface DashboardStatsProps {
  role: 'admin' | 'prof' | 'eleve'
  stats: any
  activites?: {
    nouveauxComptes: Array<{
      id: string
      nom: string
      role: string
      created_at: string
    }>
    changementsStatut: Array<{
      id: string
      nom: string
      role: string
      actif: boolean
      created_at: string
    }>
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
    }
    return `Aujourd'hui à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else if (diffDays === 1) {
    return `Hier à ${date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
  }
}

export default function DashboardStats({ role, stats, activites }: DashboardStatsProps) {
  if (role === 'admin') {
    return (
      <>
        {/* Stats Widgets - Top Row (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/eleves"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative block cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-blue-50 text-blue-600 p-3 rounded-lg">
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 .87 7.75"></path>
                </svg>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div className="flex-1 flex flex-col relative">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                  {stats.eleves || 0}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1">Élèves</span>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/professeurs"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative block cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-amber-50 text-amber-600 p-3 rounded-lg">
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m16 11l2 2l4-4"></path>
                </svg>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div className="flex-1 flex flex-col relative">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                  {stats.profs || 0}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1">Professeurs</span>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/eleves"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative block cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-red-50 text-red-600 p-3 rounded-lg">
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="m17 8l5 5m0-5l-5 5"></path>
                </svg>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div className="flex-1 flex flex-col relative">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                  {stats.elevesBloques || 0}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1">Élèves bloqués</span>
                {stats.elevesBloques > 0 && (
                  <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500"></span>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* Stats Widgets - Bottom Row (3 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/admin/avis"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative block cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-emerald-50 text-emerald-600 p-3 rounded-lg">
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
                  <path d="m3 11l18-5v12L3 14v-3zm18-5v12M3 14v3"></path>
                </svg>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div className="flex-1 flex flex-col relative">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                  {stats.avis || 0}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1">Avis publiés</span>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/dates-importantes"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative block cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 bg-indigo-50 text-indigo-600 p-3 rounded-lg">
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
                  <path d="M8 2v4m8-4v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                </svg>
              </div>
              <div className="h-12 w-px bg-slate-200"></div>
              <div className="flex-1 flex flex-col relative">
                <span className="text-3xl font-bold text-slate-800 tracking-tight">
                  {stats.datesImportantes || 0}
                </span>
                <span className="text-sm font-medium text-slate-500 mt-1">Dates importantes</span>
              </div>
            </div>
          </Link>

          <Link
            href="/admin/programme-annee"
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative block cursor-pointer"
          >
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex-shrink-0 bg-purple-50 text-purple-600 p-3 rounded-lg mb-3">
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
                  <path d="M8 2v4m8-4v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18M9 16l2 2l4-4"></path>
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-900">Programme de l'année</span>
            </div>
          </Link>
        </div>

        {/* Section Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nouveaux comptes créés */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M19 8v6m3-3h-6"></path>
                </svg>
                <h3 className="text-base font-semibold text-slate-800">Nouveaux comptes créés</h3>
              </div>
              <Link href="/admin/comptes" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activites?.nouveauxComptes && activites.nouveauxComptes.length > 0 ? (
                activites.nouveauxComptes.slice(0, 2).map((compte) => (
                  <div key={compte.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${
                          compte.role === 'eleve' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                        }`}>
                          {compte.role === 'eleve' ? (
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
                          ) : (
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
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="m16 11l2 2l4-4"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">
                            {compte.role === 'prof' ? `Prof. ${compte.nom}` : compte.nom}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {compte.role === 'eleve' ? 'Élève' : 'Professeur'}
                            {compte.role === 'eleve' && ' • Secondaire 3'}
                            {compte.role === 'prof' && ' • Histoire'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(compte.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-sm text-slate-500 text-center">
                  Aucun nouveau compte récent
                </div>
              )}
            </div>
          </div>

          {/* Changements de statut */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-400"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v4m0 4h.01"></path>
                </svg>
                <h3 className="text-base font-semibold text-slate-800">Changements de statut</h3>
              </div>
              <Link href="/admin/eleves" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {activites?.changementsStatut && activites.changementsStatut.length > 0 ? (
                activites.changementsStatut.slice(0, 2).map((eleve) => (
                  <div key={eleve.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`flex-shrink-0 p-2 rounded-lg ${
                          eleve.actif ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {eleve.actif ? (
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
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="m16 11l2 2l4-4"></path>
                            </svg>
                          ) : (
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
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="m17 8l5 5m0-5l-5 5"></path>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{eleve.nom}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {eleve.actif ? 'Élève débloqué • Paiement reçu' : 'Élève bloqué • Non-paiement'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(eleve.created_at)}
                          </p>
                        </div>
                      </div>
                      <span className={`ml-3 inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        eleve.actif ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {eleve.actif ? 'Actif' : 'Bloqué'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-4 text-sm text-slate-500 text-center">
                  Aucun changement de statut récent
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )
  }

  // Placeholder pour prof et eleve
  return <div>Stats pour {role}</div>
}
