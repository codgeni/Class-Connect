import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import NotificationSeen from '@/components/NotificationSeen'

export default async function ProgrammeAnneePage() {
  const user = await getCurrentUserFromCookies()

  if (!user || user.role !== 'eleve') {
    redirect('/login')
  }

  const { getSupabaseAdmin } = await import('@/lib/supabase')
  const supabase = getSupabaseAdmin()

  // Récupérer les informations complètes de l'élève
  const { data: eleveData } = await supabase
    .from('users')
    .select('nom, prenom')
    .eq('id', user.id)
    .single()

  const userWithPrenom = { ...user, prenom: eleveData?.prenom }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Programme de l'année</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="eleve_programme_annee" />
          <div className="max-w-4xl mx-auto">
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
              <p className="text-slate-600 font-medium">Programme de l'année</p>
              <p className="text-sm text-slate-400 mt-2">Le programme de l'année sera disponible prochainement.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
