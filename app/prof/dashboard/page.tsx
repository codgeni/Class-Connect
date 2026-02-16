import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import NotificationDot from '@/components/NotificationDot'
import { formatNomComplet, PLATFORM_TIMEZONE } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ProfDashboard() {
  const user = await getCurrentUserFromCookies()

  if (!user || user.role !== 'prof') {
    redirect('/login')
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les informations complètes du professeur
  const { data: profData } = await supabase
    .from('users')
    .select('nom, prenom, email')
    .eq('id', user.id)
    .single()

  // Récupérer les matières du professeur
  const { data: matieresData } = await supabase
    .from('prof_matieres')
    .select('matiere:matieres(nom)')
    .eq('prof_id', user.id)

  const matieres = matieresData?.map((m: any) => m.matiere?.nom).filter(Boolean) || []

  // Statistiques (avis = ceux de la direction, programme = programme de l'année)
  const [fichesCours, devoirs, quiz, avis, programmeAnnee] = await Promise.all([
    supabase.from('cours').select('id', { count: 'exact' }).eq('prof_id', user.id),
    supabase.from('devoirs').select('id', { count: 'exact' }).eq('prof_id', user.id),
    supabase.from('quiz').select('id', { count: 'exact' }).eq('prof_id', user.id),
    supabase.from('avis').select('id', { count: 'exact' }).eq('visible_profs', true),
    supabase.from('evenements').select('id', { count: 'exact' }),
  ])

  // Devoirs soumis (soumissions liées aux devoirs du prof)
  const { data: devoirsIds } = await supabase
    .from('devoirs')
    .select('id')
    .eq('prof_id', user.id)

  const devoirsIdsList = devoirsIds?.map(d => d.id) || []
  
  let devoirsSoumisCount = 0
  let aCorrigerCount = 0

  if (devoirsIdsList.length > 0) {
    const { count: soumisCount } = await supabase
      .from('soumissions')
      .select('id', { count: 'exact' })
      .in('devoir_id', devoirsIdsList)
    devoirsSoumisCount = soumisCount || 0

    // À corriger (soumissions non corrigées des devoirs du prof)
    const { count: aCorriger } = await supabase
      .from('soumissions')
      .select('id', { count: 'exact' })
      .in('devoir_id', devoirsIdsList)
      .eq('corrige', false)
    aCorrigerCount = aCorriger || 0
  }

  const stats = {
    fichesCours: fichesCours.count || 0,
    devoirs: devoirs.count || 0,
    devoirsSoumis: devoirsSoumisCount || 0,
    quiz: quiz.count || 0,
    avis: avis.count || 0,
    programmeAnnee: programmeAnnee.count || 0,
  }

  // Derniers devoirs soumis
  let derniersDevoirsSoumis: any[] = []
  if (devoirsIdsList.length > 0) {
    const { data } = await supabase
      .from('soumissions')
      .select(`
        id,
        submitted_at,
        corrige,
        devoir:devoirs!inner(titre, prof_id),
        eleve:users!soumissions_eleve_id_fkey(nom, prenom)
      `)
      .in('devoir_id', devoirsIdsList)
      .order('submitted_at', { ascending: false })
      .limit(3)
    derniersDevoirsSoumis = data || []
  }

  // Dernier avis (visible par les profs) — le plus récent, urgent ou non
  const { data: dernierAvisList } = await supabase
    .from('avis')
    .select('id, titre, contenu, created_at, urgent')
    .eq('visible_profs', true)
    .order('created_at', { ascending: false })
    .limit(1)
  const dernierAvis = dernierAvisList?.[0]
  const AVIS_PREVIEW_LENGTH = 120

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    const opts = { timeZone: PLATFORM_TIMEZONE } as const

    if (diffHours < 1) return 'Il y a moins d\'une heure'
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    if (diffDays === 1) return 'Hier à ' + date.toLocaleTimeString('fr-FR', { ...opts, hour: '2-digit', minute: '2-digit' })
    if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`
    return date.toLocaleDateString('fr-FR', { ...opts, day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-700"
            >
              <rect width="7" height="9" x="3" y="3" rx="1"></rect>
              <rect width="7" height="5" x="14" y="3" rx="1"></rect>
              <rect width="7" height="9" x="14" y="12" rx="1"></rect>
              <rect width="7" height="5" x="3" y="16" rx="1"></rect>
            </svg>
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Tableau de bord</h2>
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
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Link href="/prof/fiches-cours" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="flex-1 flex flex-col">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.fichesCours}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Fiches de cours</span>
                  </div>
                </div>
              </Link>

              <Link href="/prof/devoirs" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                  <div className="flex-1 flex flex-col">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.devoirs}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Devoirs créés</span>
                  </div>
                </div>
              </Link>

              <Link href="/prof/quiz" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                      <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2m4 7l2 2l4-4m-6 4v6m4-6v6"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.quiz}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Quiz créés</span>
                  </div>
                </div>
              </Link>

              <Link href="/prof/correction" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.devoirsSoumis}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Devoirs soumis</span>
                    <NotificationDot
                      sectionKey="prof_devoirs_soumis"
                      hasItems={stats.devoirsSoumis > 0}
                      count={stats.devoirsSoumis}
                      className="bg-red-500"
                    />
                  </div>
                </div>
              </Link>

              <Link href="/prof/avis" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.avis}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Avis</span>
                    <NotificationDot
                      sectionKey="prof_avis"
                      hasItems={stats.avis > 0}
                      count={stats.avis}
                      className="bg-amber-500"
                    />
                  </div>
                </div>
              </Link>

              <Link href="/prof/programme-annee" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
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
                      <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                      <path d="M3 10h18"></path>
                      <path d="m9 16 2 2 4-4"></path>
                    </svg>
                  </div>
                  <div className="h-12 w-px bg-slate-200"></div>
                  <div className="flex-1 flex flex-col relative">
                    <span className="text-3xl font-bold text-slate-800 tracking-tight">
                      {stats.programmeAnnee}
                    </span>
                    <span className="text-sm font-medium text-slate-500 mt-1">Dates importantes</span>
                    <NotificationDot
                      sectionKey="prof_dates_importantes"
                      hasItems={stats.programmeAnnee > 0}
                      count={stats.programmeAnnee}
                      className="bg-indigo-500"
                    />
                  </div>
                </div>
              </Link>
            </div>

            {/* Activités récentes - Avis Important en premier */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Dernier avis urgent - en premier (à gauche / au-dessus) */}
              <div className={`rounded-xl border shadow-sm ${dernierAvis?.urgent ? 'bg-red-50/50 border-red-200' : 'bg-white border-slate-200'}`}>
                <div className={`p-6 border-b flex items-center justify-between ${dernierAvis?.urgent ? 'border-red-200 bg-red-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${dernierAvis?.urgent ? 'bg-red-100 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
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
                  <Link href="/prof/avis" className={`text-sm font-medium ${dernierAvis?.urgent ? 'text-red-700 hover:text-red-800' : 'text-blue-600 hover:text-blue-700'}`}>
                    Voir tout
                  </Link>
                </div>
                <div className="p-6">
                  {dernierAvis ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Direction Générale</p>
                          <p className="text-xs text-slate-400">{formatDate(dernierAvis.created_at)}</p>
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
                          {(dernierAvis.contenu || '').replace(/\s+/g, ' ').slice(0, AVIS_PREVIEW_LENGTH)}
                          {(dernierAvis.contenu || '').length > AVIS_PREVIEW_LENGTH ? '…' : ''}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Aucun avis important</p>
                  )}
                </div>
              </div>

              {/* Derniers devoirs soumis */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5l5-5l5 5m-5-5v12"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Derniers devoirs soumis</h3>
                  </div>
                  <Link href="/prof/correction" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Voir tout
                  </Link>
                </div>
                <div className="p-6 space-y-4">
                  {derniersDevoirsSoumis && derniersDevoirsSoumis.length > 0 ? (
                    derniersDevoirsSoumis.map((soumission: any) => (
                      <Link
                        key={soumission.id}
                        href="/prof/correction"
                        className="flex items-start justify-between hover:bg-slate-50 p-2 rounded-lg transition-colors -mx-2"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">
                            {soumission.devoir?.titre || 'Devoir'}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatNomComplet(soumission.eleve?.nom, soumission.eleve?.prenom)}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            {formatDate(soumission.submitted_at)}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            soumission.corrige
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {soumission.corrige ? 'Corrigé' : 'Non corrigé'}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 text-center py-4">Aucun devoir soumis</p>
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
