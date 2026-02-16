import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { formatDate, formatTime } from '@/lib/utils'
import NotificationSeen from '@/components/NotificationSeen'

export const dynamic = 'force-dynamic'

export default async function AvisPage() {
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

  // Récupérer les avis (visibles pour profs) — dernier posté en premier (created_at puis id)
  const { data: avis } = await supabase
    .from('avis')
    .select('*')
    .eq('visible_profs', true)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Avis</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="prof_avis" seenValue={avis?.length ?? 0} />
          <div className="max-w-4xl mx-auto">
            {avis && avis.length > 0 ? (
              <div className="space-y-6">
                {avis.map((avisItem: any) => {
                  const dateFormatted = formatDate(avisItem.created_at, { day: 'numeric', month: 'long', year: 'numeric' })
                  const heureFormatted = formatTime(avisItem.created_at)

                  return (
                    <article
                      key={avisItem.id}
                      className={`bg-white rounded-xl border-2 shadow-sm p-6 ${
                        avisItem.urgent
                          ? 'border-red-300 ring-1 ring-red-200'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Direction</p>
                          <p className="text-xs text-slate-400">
                            {dateFormatted} • {heureFormatted}
                          </p>
                        </div>
                        {avisItem.urgent && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-300">
                            Urgent
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-semibold text-slate-800 mb-3">{avisItem.titre}</h3>

                      <div className="prose max-w-none text-slate-700 whitespace-pre-wrap mb-4">
                        {avisItem.contenu}
                      </div>

                      {avisItem.cible_classe && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-xs text-slate-500">
                            <span className="font-medium">Destiné à:</span> {avisItem.cible_classe}
                          </p>
                        </div>
                      )}
                    </article>
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
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
                </svg>
                <p className="text-slate-600 font-medium">Aucun avis</p>
                <p className="text-sm text-slate-400 mt-2">Les avis de la direction apparaîtront ici lorsqu'ils seront publiés.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
