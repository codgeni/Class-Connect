import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import NotificationSeen from '@/components/NotificationSeen'
import { formatNomComplet } from '@/lib/utils'

export default async function DevoirsPage() {
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

  const classeNom = eleveClasse?.classe?.nom || null

  const userWithPrenom = { ...user, prenom: eleveData?.prenom, classe: classeNom }

  // Récupérer les devoirs (filtrés par classe)
  let devoirsQuery = supabase
    .from('devoirs')
    .select(`
      id,
      titre,
      description,
      matiere,
      classe,
      date_limite,
      created_at,
      fichiers_joints,
      prof:users!devoirs_prof_id_fkey(nom, prenom)
    `)
    .order('created_at', { ascending: false })

  if (classeNom) {
    devoirsQuery = devoirsQuery.eq('classe', classeNom)
  }

  const { data: devoirs } = await devoirsQuery

  // Pour chaque devoir, vérifier s'il y a une soumission
  const devoirsWithStatus = await Promise.all(
    (devoirs || []).map(async (devoir: any) => {
      const { data: soumission } = await supabase
        .from('soumissions')
        .select('id, submitted_at, note, corrige')
        .eq('devoir_id', devoir.id)
        .eq('eleve_id', user.id)
        .single()

      const dateLimite = devoir.date_limite ? new Date(devoir.date_limite) : null
      const maintenant = new Date()
      const estEnRetard = dateLimite && maintenant > dateLimite && !soumission

      return {
        ...devoir,
        soumission: soumission || null,
        statut: soumission
          ? soumission.corrige
            ? 'corrige'
            : 'soumis'
          : estEnRetard
          ? 'en_retard'
          : 'non_soumis',
      }
    })
  )

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'corrige':
        return { label: 'Corrigé', className: 'bg-green-100 text-green-800' }
      case 'soumis':
        return { label: 'Soumis', className: 'bg-blue-100 text-blue-800' }
      case 'en_retard':
        return { label: 'En retard', className: 'bg-red-100 text-red-800' }
      default:
        return { label: 'Non soumis', className: 'bg-amber-100 text-amber-800' }
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm z-10">
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Devoirs</h2>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <NotificationSeen sectionKey="eleve_devoirs" seenValue={devoirsWithStatus?.length ?? 0} />
          <div className="max-w-7xl mx-auto">
            {devoirsWithStatus && devoirsWithStatus.length > 0 ? (
              <div className="space-y-4">
                {devoirsWithStatus.map((devoir: any) => {
                  const statutBadge = getStatutBadge(devoir.statut)
                  const dateLimite = devoir.date_limite
                    ? new Date(devoir.date_limite).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : null
                  // Formatage du nom du professeur (sans duplication)
                  // Utiliser seulement la première lettre du prénom si le nom ne contient pas déjà le prénom
                  let profNom = formatNomComplet(devoir.prof?.nom, devoir.prof?.prenom)
                  // Si le nom ne contient pas déjà le prénom au début, utiliser le format "P. Nom"
                  if (devoir.prof?.prenom && devoir.prof?.nom && 
                      !devoir.prof.nom.toLowerCase().startsWith(devoir.prof.prenom.toLowerCase() + ' ')) {
                    profNom = `${devoir.prof.prenom[0]}. ${devoir.prof.nom}`
                  }

                  return (
                    <div
                      key={devoir.id}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-slate-800 mb-2">{devoir.titre}</h3>
                          {devoir.description && (
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">{devoir.description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                            <span>{devoir.matiere}</span>
                            {devoir.classe && <span>• {devoir.classe}</span>}
                            <span>• P. {profNom}</span>
                            {dateLimite && (
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
                                Échéance: {dateLimite}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statutBadge.className}`}>
                          {statutBadge.label}
                        </span>
                      </div>

                      {devoir.fichiers_joints && devoir.fichiers_joints.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {devoir.fichiers_joints.map((fichier: string, idx: number) => {
                            const isUrl = typeof fichier === 'string' && fichier.startsWith('http')
                            const label = isUrl ? decodeURIComponent(fichier.split('/').pop() || 'Fichier') : fichier
                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${isUrl ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                                  <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>
                                </svg>
                                {isUrl ? (
                                  <a href={fichier} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                    {label}
                                  </a>
                                ) : (
                                  label
                                )}
                              </span>
                            )
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                        {devoir.soumission && devoir.soumission.corrige && devoir.soumission.note !== null && (
                          <div className="text-sm text-slate-600">
                            <span className="font-medium">Note:</span>{' '}
                            <span className="text-green-600 font-semibold">{devoir.soumission.note}/20</span>
                          </div>
                        )}
                        <Link
                          href={`/eleve/devoirs/${devoir.id}/soumettre`}
                          className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm font-semibold"
                        >
                          {devoir.soumission ? 'Voir ma soumission' : 'Voir'}
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
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
                  <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8"></path>
                </svg>
                <p className="text-slate-600 font-medium">Aucun devoir disponible</p>
                <p className="text-sm text-slate-400 mt-2">Les devoirs apparaîtront ici lorsqu'ils seront publiés.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
