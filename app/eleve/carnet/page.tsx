import { redirect } from 'next/navigation'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'

export default async function CarnetPage() {
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

  // Récupérer les notes de l'élève
  const { data: notes } = await supabase
    .from('notes')
    .select(`
      *,
      prof:users!notes_prof_id_fkey(nom, prenom)
    `)
    .eq('eleve_id', user.id)
    .order('created_at', { ascending: false })

  // Grouper les notes par matière
  const notesParMatiere = notes?.reduce((acc: any, note: any) => {
    const matiere = note.matiere || 'Autre'
    if (!acc[matiere]) {
      acc[matiere] = []
    }
    acc[matiere].push(note)
    return acc
  }, {}) || {}

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Carnet de Notes</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-7xl mx-auto">
            {Object.keys(notesParMatiere).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(notesParMatiere).map(([matiere, notesMatiere]: [string, any]) => {
                  const moyenne = notesMatiere.reduce((sum: number, n: any) => sum + (n.note || 0), 0) / notesMatiere.length

                  return (
                    <div key={matiere} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-slate-800">{matiere}</h3>
                        <div className="text-right">
                          <p className="text-xs text-slate-500">Moyenne</p>
                          <p className="text-2xl font-bold text-blue-600">{moyenne.toFixed(2)}/20</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {notesMatiere.map((note: any) => {
                          const profNom = note.prof?.prenom
                            ? `${note.prof.prenom[0]}. ${note.prof.nom}`
                            : note.prof?.nom || 'Professeur'
                          const dateFormatted = new Date(note.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })

                          return (
                            <div
                              key={note.id}
                              className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-sm font-medium text-slate-800">{note.type || 'Note'}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-500">P. {profNom}</span>
                                  <span className="text-xs text-slate-500">•</span>
                                  <span className="text-xs text-slate-400">{dateFormatted}</span>
                                </div>
                                {note.commentaire && (
                                  <p className="text-sm text-slate-600 mt-1">{note.commentaire}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <span className="text-2xl font-bold text-slate-800">{note.note}</span>
                                <span className="text-sm text-slate-500">/{note.points_total || 20}</span>
                              </div>
                            </div>
                          )
                        })}
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
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
                </svg>
                <p className="text-slate-600 font-medium">Aucune note disponible</p>
                <p className="text-sm text-slate-400 mt-2">Vos notes apparaîtront ici lorsqu'elles seront attribuées.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
