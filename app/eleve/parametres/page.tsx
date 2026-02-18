import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'

export default async function ParametresPage() {
  const user = await getCurrentUserFromCookies()

  if (!user || user.role !== 'eleve') {
    redirect('/login')
  }

  const supabase = getSupabaseAdmin()

  // Récupérer les informations complètes de l'élève
  const { data: eleveData } = await supabase
    .from('users')
    .select('nom, prenom, email, code_login')
    .eq('id', user.id)
    .single()

  const userWithPrenom = { ...user, prenom: eleveData?.prenom, email: eleveData?.email }

  // Récupérer la classe de l'élève
  const { data: eleveClasse } = await supabase
    .from('eleve_classes')
    .select('classe:classes(nom), section')
    .eq('eleve_id', user.id)
    .single()

  const classeNom = getClasseNom(eleveClasse?.classe as { nom?: string } | { nom?: string }[] | null)

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Paramètres</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-6">Informations personnelles</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Nom complet</label>
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                    {userWithPrenom.prenom ? `${userWithPrenom.prenom} ${userWithPrenom.nom}` : userWithPrenom.nom}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                    {userWithPrenom.email || 'Non renseigné'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Code de connexion</label>
                  <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono">
                    {eleveData?.code_login || user.code_login}
                  </div>
                </div>

                {classeNom && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Classe</label>
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800">
                      {classeNom}
                      {eleveClasse?.section && ` - ${eleveClasse.section}`}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Pour modifier vos informations, veuillez contacter l'administrateur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
