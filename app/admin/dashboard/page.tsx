import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import DashboardStats from '@/components/DashboardStats'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function AdminDashboard() {
  const user = await getCurrentUserFromCookies()

  if (!user || user.role !== 'admin') {
    redirect('/login')
  }

  // Récupérer les stats directement depuis Supabase
  const supabase = getSupabaseAdmin()

  const [eleves, profs, elevesBloques, avis, datesImportantes, nouveauxComptes, changementsStatut] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'eleve').eq('actif', true),
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'prof').eq('actif', true),
    supabase.from('users').select('id', { count: 'exact' }).eq('role', 'eleve').eq('actif', false),
    supabase.from('avis').select('id', { count: 'exact' }),
    supabase.from('evenements').select('id', { count: 'exact' }).eq('type', 'date_importante'),
    supabase.from('users').select('id, nom, role, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('id, nom, role, actif, created_at').eq('role', 'eleve').order('created_at', { ascending: false }).limit(10),
  ])

  // Filtrer les changements de statut récents (élèves bloqués/débloqués)
  const changementsRecents = changementsStatut.data?.filter((user, index, self) => {
    // Trouver les changements de statut (actif -> inactif ou vice versa)
    // Pour simplifier, on prend les 5 derniers élèves avec leur statut actuel
    return index < 5
  }) || []

  const stats = {
    eleves: eleves.count || 0,
    profs: profs.count || 0,
    elevesBloques: elevesBloques.count || 0,
    avis: avis.count || 0,
    datesImportantes: datesImportantes.count || 0,
  }

  const activites = {
    nouveauxComptes: nouveauxComptes.data || [],
    changementsStatut: changementsRecents,
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
            <DashboardStats role="admin" stats={stats} activites={activites} />
          </div>
        </main>
      </div>
    </div>
  )
}
