import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'
import NotificationSeen from '@/components/NotificationSeen'

export default async function FichesCoursPage() {
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

  // Récupérer les fiches de cours (filtrées par classe)
  let coursQuery = supabase
    .from('cours')
    .select(`
      id,
      titre,
      matiere,
      classe,
      created_at,
      prof:users!cours_prof_id_fkey(nom, prenom)
    `)
    .order('created_at', { ascending: false })

  if (classeNom) {
    coursQuery = coursQuery.eq('classe', classeNom)
  }

  const { data: cours } = await coursQuery

  // Récupérer les matières uniques pour le filtre
  const matieres = cours ? Array.from(new Set(cours.map((c: any) => c.matiere).filter(Boolean))) : []

  const getIconColor = (index: number) => {
    const colors = [
      { bg: 'bg-blue-50', text: 'text-blue-600' },
      { bg: 'bg-purple-50', text: 'text-purple-600' },
      { bg: 'bg-green-50', text: 'text-green-600' },
      { bg: 'bg-amber-50', text: 'text-amber-600' },
      { bg: 'bg-rose-50', text: 'text-rose-600' },
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Fiche de Cours</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="eleve_fiches_cours" seenValue={cours?.length ?? 0} />
          <div className="max-w-7xl mx-auto">
            {cours && cours.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cours.map((c: any, index: number) => {
                  const iconColor = getIconColor(index)
                  const dateFormatted = new Date(c.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })
                  const profNom = c.prof?.prenom 
                    ? `${c.prof.prenom[0]}. ${c.prof.nom}`
                    : c.prof?.nom || 'Professeur'

                  return (
                    <Link
                      key={c.id}
                      href={`/eleve/fiches-cours/${c.id}`}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden block"
                    >
                      <div className="p-6">
                        {/* Header avec icône */}
                        <div className="flex items-start justify-between mb-4">
                          <div className={`${iconColor.bg} ${iconColor.text} p-3 rounded-lg flex-shrink-0`}>
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
                        </div>
                        {/* Titre */}
                        <h3 className="text-lg font-semibold text-slate-800 mb-4">{c.titre}</h3>
                        {/* Détails */}
                        <div className="space-y-2.5 mb-4">
                          {/* Matière */}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                            </svg>
                            <span>{c.matiere}</span>
                          </div>
                          {/* Classe */}
                          {c.classe && (
                            <div className="flex items-center gap-2 text-sm text-slate-600">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                              </svg>
                              <span>{c.classe}</span>
                            </div>
                          )}
                          {/* Professeur */}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            <span>P. {profNom}</span>
                          </div>
                        </div>
                        {/* Date de publication */}
                        <div className="pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-400">
                            Publié le {dateFormatted}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mx-auto text-slate-400 mb-4"
                >
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                </svg>
                <p className="text-slate-600 font-medium">Aucune fiche de cours disponible</p>
                <p className="text-sm text-slate-400 mt-2">Les fiches de cours apparaîtront ici lorsqu'elles seront publiées.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
