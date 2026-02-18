import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'
import NotificationSeen from '@/components/NotificationSeen'

export default async function EvaluationsPage() {
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

  // Récupérer les quiz/évaluations (filtrés par classe)
  let quizQuery = supabase
    .from('quiz')
    .select(`
      id,
      titre,
      description,
      matiere,
      classe,
      duree_minutes,
      date_debut,
      date_limite,
      note_automatique,
      created_at,
      prof:users!quiz_prof_id_fkey(nom, prenom)
    `)
    .order('created_at', { ascending: false })

  if (classeNom) {
    quizQuery = quizQuery.eq('classe', classeNom)
  }

  const { data: quiz } = await quizQuery

  // Pour chaque quiz, vérifier s'il y a une réponse
  const quizWithStatus = await Promise.all(
    (quiz || []).map(async (q: any) => {
      const { data: reponse } = await supabase
        .from('reponses_quiz')
        .select('id, submitted_at, note')
        .eq('quiz_id', q.id)
        .eq('eleve_id', user.id)
        .single()

      const dateDebut = q.date_debut ? new Date(q.date_debut) : null
      const dateLimite = q.date_limite ? new Date(q.date_limite) : null
      const maintenant = new Date()
      const pasEncoreOuvert = dateDebut && maintenant.getTime() < dateDebut.getTime()
      const estExpire = dateLimite && maintenant.getTime() > dateLimite.getTime()

      return {
        ...q,
        reponse: reponse || null,
        statut: reponse
          ? 'repondu'
          : pasEncoreOuvert
          ? 'pas_encore_disponible'
          : estExpire
          ? 'expire'
          : 'disponible',
      }
    })
  )

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'repondu':
        return { label: 'Répondu', className: 'bg-green-100 text-green-800' }
      case 'expire':
        return { label: 'Expiré', className: 'bg-red-100 text-red-800' }
      case 'pas_encore_disponible':
        return { label: 'Pas encore disponible', className: 'bg-amber-100 text-amber-800' }
      default:
        return { label: 'Disponible', className: 'bg-blue-100 text-blue-800' }
    }
  }

  const getIconColor = (typeNotation: boolean) => {
    return typeNotation
      ? { bg: 'bg-green-50', text: 'text-green-600' }
      : { bg: 'bg-purple-50', text: 'text-purple-600' }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Évaluations</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="eleve_evaluations" seenValue={quizWithStatus?.length ?? 0} />
          <div className="max-w-7xl mx-auto">
            {quizWithStatus && quizWithStatus.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizWithStatus.map((q: any) => {
                  const statutBadge = getStatutBadge(q.statut)
                  const iconColor = getIconColor(q.note_automatique)
                  const profNom = q.prof?.prenom
                    ? `${q.prof.prenom[0]}. ${q.prof.nom}`
                    : q.prof?.nom || 'Professeur'

                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-6"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`${iconColor.bg} ${iconColor.text} p-3 rounded-lg flex-shrink-0`}>
                          {q.note_automatique ? (
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
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <path d="m9 11l3 3l6-6"></path>
                            </svg>
                          ) : (
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
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statutBadge.className}`}>
                          {statutBadge.label}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-slate-800 mb-4">{q.titre}</h3>

                      <div className="space-y-2.5 mb-4">
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
                          <span>{q.matiere}</span>
                        </div>
                        {q.classe && (
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
                            <span>{q.classe}</span>
                          </div>
                        )}
                        {q.duree_minutes && (
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
                              <circle cx="12" cy="12" r="10"></circle>
                              <polyline points="12 6 12 12 16 14"></polyline>
                            </svg>
                            <span>{q.duree_minutes} minutes</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          {q.note_automatique ? (
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
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                              <path d="m9 11l3 3l6-6"></path>
                            </svg>
                          ) : (
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
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                              <circle cx="9" cy="7" r="4"></circle>
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                          )}
                          <span>{q.note_automatique ? 'Note automatique' : 'Note manuelle'}</span>
                        </div>
                      </div>

                      {q.reponse && q.reponse.note !== null && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-green-800">Note obtenue:</span>
                            <span className="text-lg font-bold text-green-600">{q.reponse.note}/20</span>
                          </div>
                        </div>
                      )}

                      <div className="pt-4 border-t border-slate-100">
                        <Link
                          href={`/eleve/evaluations/${q.id}`}
                          className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          {q.reponse ? 'Voir mes résultats' : 'Commencer'}
                        </Link>
                      </div>
                    </div>
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
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <path d="m9 14l2 2l4-4"></path>
                </svg>
                <p className="text-slate-600 font-medium">Aucune évaluation disponible</p>
                <p className="text-sm text-slate-400 mt-2">Les évaluations apparaîtront ici lorsqu'elles seront publiées.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
