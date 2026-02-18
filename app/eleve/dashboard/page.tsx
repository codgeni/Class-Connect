import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'
import { formatDate as fmtDate, formatDateTime as fmtDateTime } from '@/lib/utils'
import NotificationDot from '@/components/NotificationDot'

export const dynamic = 'force-dynamic'

export default async function EleveDashboard() {
  const user = await getCurrentUserFromCookies()

  if (!user || user.role !== 'eleve') {
    redirect('/login')
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les informations complètes de l'élève
  const { data: eleveData } = await supabase
    .from('users')
    .select('nom, prenom')
    .eq('id', user.id)
    .single()

  // Récupérer la classe de l'élève
  const { data: eleveClasse } = await supabase
    .from('eleve_classes')
    .select('classe:classes(nom)')
    .eq('eleve_id', user.id)
    .single()

  const classeNom = getClasseNom(eleveClasse?.classe as { nom?: string } | { nom?: string }[] | null)

  const userWithPrenom = { ...user, prenom: eleveData?.prenom, classe: classeNom }

  // Statistiques - filtrer par classe de l'élève
  let fichesCoursQuery = supabase.from('cours').select('id', { count: 'exact' })
  let devoirsQuery = supabase.from('devoirs').select('id', { count: 'exact' })
  let evaluationsQuery = supabase.from('quiz').select('id', { count: 'exact' })
  
  if (classeNom) {
    fichesCoursQuery = fichesCoursQuery.eq('classe', classeNom)
    devoirsQuery = devoirsQuery.eq('classe', classeNom)
    evaluationsQuery = evaluationsQuery.eq('classe', classeNom)
  }

  // Requête pour les avis (séparée car la syntaxe .or() peut être problématique avec count)
  let avisQuery = supabase.from('avis').select('id').eq('visible_eleves', true)
  if (classeNom) {
    avisQuery = avisQuery.or(`cible_classe.is.null,cible_classe.eq.${classeNom}`)
  } else {
    avisQuery = avisQuery.is('cible_classe', null)
  }
  const { data: avisData } = await avisQuery

  const [fichesCours, devoirs, evaluations, datesImportantes] = await Promise.all([
    fichesCoursQuery,
    devoirsQuery,
    evaluationsQuery,
    supabase.from('evenements').select('id', { count: 'exact' }),
  ])

  const avis = { count: avisData?.length || 0 }

  const stats = {
    fichesCours: fichesCours.count || 0,
    devoirs: devoirs.count || 0,
    evaluations: evaluations.count || 0,
    avis: avis.count || 0,
    datesImportantes: datesImportantes.count || 0,
  }

  // Dernières fiches de cours (filtrées par classe)
  let fichesCoursListQuery = supabase
    .from('cours')
    .select(`
      id,
      titre,
      matiere,
      created_at,
      prof:users!cours_prof_id_fkey(nom, prenom)
    `)
    .order('created_at', { ascending: false })
    .limit(3)
  
  if (classeNom) {
    fichesCoursListQuery = fichesCoursListQuery.eq('classe', classeNom)
  }
  
  const { data: dernieresFichesCours } = await fichesCoursListQuery

  // Dernier avis (affiché sur le dashboard) — le plus récent, urgent ou non
  let dernierAvisQuery = supabase
    .from('avis')
    .select('*')
    .eq('visible_eleves', true)
    .order('created_at', { ascending: false })
    .limit(1)
  
  if (classeNom) {
    dernierAvisQuery = dernierAvisQuery.or(`cible_classe.is.null,cible_classe.eq.${classeNom}`)
  } else {
    dernierAvisQuery = dernierAvisQuery.is('cible_classe', null)
  }
  
  const { data: dernierAvis } = await dernierAvisQuery.maybeSingle()

  const formatDate = (dateString: string) => fmtDate(dateString, { day: 'numeric', month: 'short', year: 'numeric' })
  const formatDateTime = (dateString: string) => fmtDateTime(dateString)

  const getIconColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-600' },
      { bg: 'bg-purple-50', text: 'text-purple-600' },
      { bg: 'bg-green-50', text: 'text-green-600' },
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center">
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">
              Salut {userWithPrenom.prenom || user.nom.split(' ')[0]} 👋
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white">
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
                >
                  <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0zM22 10v6"></path>
                  <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
                </svg>
              </div>
              <span className="text-sm font-semibold text-slate-800">CodGeni</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link
                href="/eleve/fiches-cours"
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.fichesCours}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Fiche de Cours</span>
                    <NotificationDot
                      sectionKey="eleve_fiches_cours"
                      hasItems={stats.fichesCours > 0}
                      count={stats.fichesCours}
                    />
                  </div>
                </div>
              </Link>

              <Link
                href="/eleve/devoirs"
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                      <path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z"></path>
                      <path d="M14 2v5a1 1 0 0 0 1 1h5M10 9H8m8 4H8m8 4H8"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.devoirs}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Devoirs</span>
                    <NotificationDot
                      sectionKey="eleve_devoirs"
                      hasItems={stats.devoirs > 0}
                      count={stats.devoirs}
                    />
                  </div>
                </div>
              </Link>

              <Link
                href="/eleve/evaluations"
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 bg-purple-50 text-purple-600 p-3 rounded-lg">
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
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="m9 12 2 2 4-4"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.evaluations}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Evaluations</span>
                    <NotificationDot
                      sectionKey="eleve_evaluations"
                      hasItems={stats.evaluations > 0}
                      count={stats.evaluations}
                    />
                  </div>
                </div>
              </Link>

              <Link
                href="/eleve/avis"
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                      <path d="M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092a10 10 0 1 0-4.777-4.719"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.avis}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Avis importants</span>
                    <NotificationDot
                      sectionKey="eleve_avis"
                      hasItems={stats.avis > 0}
                      count={stats.avis}
                    />
                  </div>
                </div>
              </Link>

              <Link
                href="/eleve/dates-importantes"
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                      {stats.datesImportantes}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Dates Importantes</span>
                    <NotificationDot
                      sectionKey="eleve_dates_importantes"
                      hasItems={stats.datesImportantes > 0}
                      count={stats.datesImportantes}
                    />
                  </div>
                </div>
              </Link>

              <Link
                href="/eleve/programme-annee"
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                      <path d="M8 2v4m8-4v4"></path>
                      <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                      <path d="M3 10h18"></path>
                      <path d="m9 16 2 2 4-4"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-sm font-medium text-slate-500 mt-1">Programme de l'année</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Panneaux de contenu - Avis Important en premier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Panneau Avis Important - en premier (à gauche / au-dessus) */}
              <div className={`rounded-xl border shadow-sm ${dernierAvis?.urgent ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'}`}>
                <div className={`p-6 border-b flex items-center justify-between ${dernierAvis?.urgent ? 'border-red-200 bg-red-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${dernierAvis?.urgent ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
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
                      >
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                    </div>
                    <h3 className={`text-lg font-semibold ${dernierAvis?.urgent ? 'text-red-900' : 'text-slate-800'}`}>Avis Important</h3>
                  </div>
                  <Link href="/eleve/avis" className={`text-sm font-medium ${dernierAvis?.urgent ? 'text-red-700 hover:text-red-800' : 'text-blue-600 hover:text-blue-700'}`}>
                    Voir tout
                  </Link>
                </div>
                <div className="p-6">
                  {dernierAvis ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Direction Générale</p>
                          <p className="text-xs text-slate-400">
                            {formatDateTime(dernierAvis.created_at)}
                          </p>
                        </div>
                        {dernierAvis.urgent && (
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                            Urgent
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className={`text-base font-semibold mb-2 ${dernierAvis?.urgent ? 'text-red-900' : 'text-slate-900'}`}>
                          {dernierAvis.titre}
                        </h4>
                        <p className={`text-sm line-clamp-4 ${dernierAvis?.urgent ? 'text-red-800/90' : 'text-slate-600'}`}>
                          {dernierAvis.contenu}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Aucun avis important</p>
                  )}
                </div>
              </div>

              {/* Panneau Fiche de Cours */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
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
                      >
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Fiche de Cours</h3>
                  </div>
                  <Link href="/eleve/fiches-cours" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Voir tout
                  </Link>
                </div>
                <div className="p-6 space-y-4">
                  {dernieresFichesCours && dernieresFichesCours.length > 0 ? (
                    dernieresFichesCours.map((fiche: any, index: number) => {
                      const iconColor = getIconColor(index)
                      const profNom = fiche.prof?.prenom 
                        ? `${fiche.prof.prenom[0]}. ${fiche.prof.nom}`
                        : fiche.prof?.nom || 'Professeur'
                      
                      return (
                        <Link
                          key={fiche.id}
                          href={`/eleve/fiches-cours/${fiche.id}`}
                          className="flex items-start gap-4 hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2 group"
                        >
                          <div className={`${iconColor.bg} ${iconColor.text} p-2 rounded-lg flex-shrink-0`}>
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
                            >
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {fiche.titre}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">
                              P. {profNom} • {fiche.matiere}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                              {formatDate(fiche.created_at)}
                            </p>
                          </div>
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
                            className="text-slate-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </Link>
                      )
                    })
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Aucune fiche de cours disponible</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
