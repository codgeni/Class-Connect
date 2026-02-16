import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import NotificationSeen from '@/components/NotificationSeen'

export const dynamic = 'force-dynamic'

export default async function ProgrammeAnneePage() {
  const user = await getCurrentUserFromCookies()

  if (!user || user.role !== 'prof') {
    redirect('/login')
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les informations complètes du professeur
  const { data: profData } = await supabase
    .from('users')
    .select('nom, prenom')
    .eq('id', user.id)
    .single()

  const userWithPrenom = { ...user, prenom: profData?.prenom }

  // Récupérer les événements (programme de l'année)
  const { data: evenements } = await supabase
    .from('evenements')
    .select('*')
    .order('date_debut', { ascending: true })

  const fmtDate = (dateStr: string) => formatDate(dateStr, { day: 'numeric', month: 'long', year: 'numeric' })

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'date_importante': return 'Date importante'
      case 'examen': return 'Examen'
      case 'vacances': return 'Vacances'
      case 'evenement': return 'Événement'
      default: return type
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Dates importantes</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="prof_dates_importantes" seenValue={evenements?.length ?? 0} />
          <div className="max-w-4xl mx-auto">
            {evenements && evenements.length > 0 ? (
              <div className="space-y-4">
                {evenements.map((evt: any) => (
                  <div
                    key={evt.id}
                    className="bg-white rounded-xl border border-slate-200 shadow-sm p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 mb-2">
                          {getTypeLabel(evt.type)}
                        </span>
                        <h3 className="text-lg font-semibold text-slate-800">{evt.titre}</h3>
                        {evt.description && (
                          <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{evt.description}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-3">
                          {fmtDate(evt.date_debut)}
                          {evt.date_fin && ` – ${fmtDate(evt.date_fin)}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
                  <path d="M3 10h18"></path>
                  <path d="m9 16 2 2 4-4"></path>
                </svg>
                <p className="text-slate-600 font-medium">Dates importantes</p>
                <p className="text-sm text-slate-400 mt-2">Les dates importantes seront disponibles prochainement.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
