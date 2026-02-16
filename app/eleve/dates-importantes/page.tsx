import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { formatDate, formatTime } from '@/lib/utils'
import NotificationSeen from '@/components/NotificationSeen'

export const dynamic = 'force-dynamic'

export default async function DatesImportantesPage() {
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

  const userWithPrenom = { ...user, prenom: eleveData?.prenom }

  // Récupérer les dates importantes (tous types: date_importante, examen, evenement, vacances)
  const { data: datesImportantes } = await supabase
    .from('evenements')
    .select('*')
    .order('date_debut', { ascending: true })

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'examen':
        return { label: 'Examen', className: 'bg-red-100 text-red-800' }
      case 'vacances':
        return { label: 'Vacances', className: 'bg-green-100 text-green-800' }
      case 'reunion':
        return { label: 'Réunion', className: 'bg-blue-100 text-blue-800' }
      case 'evenement':
        return { label: 'Événement', className: 'bg-purple-100 text-purple-800' }
      default:
        return { label: 'Date importante', className: 'bg-slate-100 text-slate-800' }
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Dates Importantes</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="eleve_dates_importantes" seenValue={datesImportantes?.length ?? 0} />
          <div className="max-w-4xl mx-auto">
            {datesImportantes && datesImportantes.length > 0 ? (
              <div className="space-y-4">
                {datesImportantes.map((date: any) => {
                  const dateDebut = new Date(date.date_debut)
                  const dateFormatted = formatDate(dateDebut, { day: 'numeric', month: 'long', year: 'numeric' })
                  const heureFormatted = formatTime(dateDebut)
                  const typeBadge = getTypeBadge(date.type || 'evenement')

                  return (
                    <div
                      key={date.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="bg-indigo-50 text-indigo-600 p-3 rounded-lg">
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
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-800 mb-1">{date.titre}</h3>
                              <div className="flex items-center gap-3 text-sm text-slate-600">
                                <span className="flex items-center gap-1">
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
                                    <path d="M8 2v4m8-4v4"></path>
                                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                                    <path d="M3 10h18"></path>
                                  </svg>
                                  {dateFormatted}
                                </span>
                                {heureFormatted && (
                                  <span className="flex items-center gap-1">
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
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    {heureFormatted}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${typeBadge.className}`}>
                              {typeBadge.label}
                            </span>
                          </div>
                          {date.description && (
                            <p className="text-slate-700 whitespace-pre-wrap">{date.description}</p>
                          )}
                        </div>
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
                  <path d="M8 2v4m8-4v4"></path>
                  <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                  <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
                </svg>
                <p className="text-slate-600 font-medium">Aucune date importante</p>
                <p className="text-sm text-slate-400 mt-2">Les dates importantes apparaîtront ici lorsqu'elles seront ajoutées.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
