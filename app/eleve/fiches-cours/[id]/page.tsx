import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUserFromCookies } from '@/lib/auth'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getClasseNom } from '@/lib/utils'

export default async function FicheCoursDetailPage({ params }: { params: { id: string } }) {
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

  // Récupérer la classe de l'élève (si besoin plus tard)
  const { data: eleveClasse } = await supabase
    .from('eleve_classes')
    .select('classe:classes(nom)')
    .eq('eleve_id', user.id)
    .single()

  const classeNom = getClasseNom(eleveClasse?.classe as { nom?: string } | { nom?: string }[] | null)

  const userWithPrenom = { ...user, prenom: eleveData?.prenom, classe: classeNom }

  // Récupérer la fiche de cours
  const { data: cours, error } = await supabase
    .from('cours')
    .select(`
      *,
      prof:users!cours_prof_id_fkey(nom, prenom)
    `)
    .eq('id', params.id)
    .single()

  if (error || !cours) {
    redirect('/eleve/fiches-cours')
  }

  const dateFormatted = new Date(cours.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  const profNom = cours.prof?.prenom 
    ? `${cours.prof.prenom} ${cours.prof.nom}`
    : cours.prof?.nom || 'Professeur'

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={userWithPrenom} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-4 shadow-sm z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/eleve/fiches-cours"
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Retour"
              >
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
                  <path d="m12 19-7-7 7-7"></path>
                  <path d="M19 12H5"></path>
                </svg>
              </Link>
              <h2 className="text-2xl font-semibold text-slate-800">Fiche de Cours</h2>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
              {/* Titre */}
              <h1 className="text-3xl font-bold text-slate-800 mb-6">{cours.titre}</h1>

              {/* Métadonnées */}
              <div className="flex flex-wrap gap-4 mb-6 pb-6 border-b border-slate-200">
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
                  <span className="font-medium">Matière:</span>
                  <span>{cours.matiere}</span>
                </div>
                {cours.classe && (
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
                    <span className="font-medium">Classe:</span>
                    <span>{cours.classe}</span>
                  </div>
                )}
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
                  <span className="font-medium">Professeur:</span>
                  <span>{profNom}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
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
                    <path d="M8 2v4m8-4v4"></path>
                    <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                    <path d="M3 10h18"></path>
                  </svg>
                  <span>Publié le {dateFormatted}</span>
                </div>
              </div>

              {/* Description */}
              {cours.description && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Description</h3>
                  <p className="text-slate-700 whitespace-pre-wrap">{cours.description}</p>
                </div>
              )}

              {/* Contenu */}
              {cours.contenu && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">Contenu</h3>
                  <div className="prose max-w-none text-slate-700 whitespace-pre-wrap">{cours.contenu}</div>
                </div>
              )}

              {/* Fichier */}
              {cours.fichier_url && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">Fichier joint</h3>
                  {cours.fichier_url.startsWith('http') ? (
                    <a
                      href={cours.fichier_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Ouvrir le fichier
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">{cours.fichier_url}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
