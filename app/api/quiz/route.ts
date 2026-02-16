import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'

// GET - Liste des quiz
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  let query = supabase.from('quiz').select('*, prof:users!quiz_prof_id_fkey(nom)')

  // Les profs voient leurs propres quiz
  if (user.role === 'prof') {
    query = query.eq('prof_id', user.id)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Pour chaque quiz, récupérer le nombre de réponses et le nombre d'élèves de la classe
  const quizWithCounts = await Promise.all(
    (data || []).map(async (q: any) => {
      const [reponsesRes, total_eleves] = await Promise.all([
        supabase
          .from('reponses_quiz')
          .select('id', { count: 'exact', head: true })
          .eq('quiz_id', q.id),
        (async () => {
          if (!q.classe) return null
          const { data: classeRow } = await supabase
            .from('classes')
            .select('id')
            .eq('nom', q.classe)
            .maybeSingle()
          if (!classeRow?.id) return null
          const { count } = await supabase
            .from('eleve_classes')
            .select('id', { count: 'exact', head: true })
            .eq('classe_id', classeRow.id)
          return count ?? 0
        })(),
      ])
      return {
        ...q,
        reponses_count: (reponsesRes as any)?.count ?? 0,
        total_eleves: total_eleves ?? null,
        type_notation: 'automatique',
      }
    })
  )

  return NextResponse.json({ quiz: quizWithCounts })
}

// POST - Créer un quiz (prof uniquement)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'prof') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const body = await request.json()
  const { titre, description, matiere, classe, types_questions, date_debut, demarrer_maintenant, duree_minutes, temps_limite_question, note_automatique, note_sur, questions } = body

  const startNow = demarrer_maintenant === true
  if (!titre || !matiere || !classe || !duree_minutes) {
    return NextResponse.json(
      { error: 'Titre, matière, classe et temps limite requis' },
      { status: 400 }
    )
  }
  if (!startNow && !date_debut) {
    return NextResponse.json(
      { error: 'Indiquez une date de début ou choisissez « Démarrer maintenant »' },
      { status: 400 }
    )
  }

  // Vérifier qu'il y a au moins une question
  if (!questions || questions.length === 0) {
    return NextResponse.json(
      { error: 'Veuillez ajouter au moins une question' },
      { status: 400 }
    )
  }

  const bareme = Math.max(1, Number(note_sur) || 20)
  const totalPoints = questions.reduce((sum: number, q: any) => sum + (Number(q.points) || 0), 0)
  if (totalPoints !== bareme) {
    return NextResponse.json(
      { error: `Le total des points (${totalPoints}) doit être égal au barème (${bareme}).` },
      { status: 400 }
    )
  }

  // Déduire les types de questions si non fournis
  const questionTypes = types_questions && types_questions.length > 0 
    ? types_questions 
    : [...new Set(questions.map((q: any) => q.type))]

  const supabase = getSupabaseAdmin()
  
  // Vérifier que la matière est attribuée au professeur
  const { data: matiereData, error: matiereError } = await supabase
    .from('matieres')
    .select('id')
    .eq('nom', matiere)
    .single()

  if (matiereError || !matiereData) {
    console.error('Matière error:', matiereError)
    return NextResponse.json(
      { error: 'Matière non trouvée. Veuillez contacter l\'administrateur.' },
      { status: 400 }
    )
  }

  const { data: profMatiere, error: profMatiereError } = await supabase
    .from('prof_matieres')
    .select('id')
    .eq('prof_id', user.id)
    .eq('matiere_id', matiereData.id)
    .single()

  if (profMatiereError || !profMatiere) {
    console.error('Prof matière error:', profMatiereError)
    console.error('User ID:', user.id, 'Matiere ID:', matiereData.id)
    return NextResponse.json(
      { error: 'Vous n\'êtes pas autorisé à créer un quiz pour cette matière. Veuillez contacter l\'administrateur pour vous assigner cette matière.' },
      { status: 403 }
    )
  }

  // Vérifier que la classe est assignée au professeur (optionnel mais recommandé)
  const { data: classeData } = await supabase
    .from('classes')
    .select('id')
    .eq('nom', classe)
    .single()

  if (classeData) {
    const { data: profClasse } = await supabase
      .from('prof_classes')
      .select('id')
      .eq('prof_id', user.id)
      .eq('classe_id', classeData.id)
      .single()

    // On ne bloque pas si la classe n'est pas assignée, mais on peut logger
    if (!profClasse) {
      console.warn(`Classe ${classe} non assignée au professeur ${user.id}`)
    }
  }

  // Démarrer maintenant : quiz disponible tout de suite, expire dans 1 an. Programmer : date_debut = ouverture, date_limite = fin (début + 30 jours).
  const now = new Date()
  const dateDebutISO = startNow ? null : (date_debut || null)
  let dateLimiteISO: string | null
  if (startNow) {
    const unAnPlusTard = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)
    dateLimiteISO = unAnPlusTard.toISOString()
  } else if (date_debut) {
    const debut = new Date(date_debut)
    const fin = new Date(debut.getTime() + 30 * 24 * 60 * 60 * 1000)
    dateLimiteISO = fin.toISOString()
  } else {
    dateLimiteISO = null
  }

  // Stocker le barème dans le JSON questions pour ne pas dépendre d'une colonne note_sur
  const questionsPayload = Array.isArray(questions) ? questions : []
  const hasOpenQuestions = questionsPayload.some((q: any) => (q.type || q.question_type) === 'ouverte')
  const noteAutomatiqueFinal = hasOpenQuestions ? false : (note_automatique !== undefined ? note_automatique : true)

  const questionsWithBareme = { bareme, questions: questionsPayload }

  const quizData: any = {
    titre,
    description,
    matiere,
    classe,
    prof_id: user.id,
    questions: questionsWithBareme,
    duree_minutes: parseInt(duree_minutes),
    date_debut: dateDebutISO,
    date_limite: dateLimiteISO,
    type_questions: questionTypes,
    duree_par_question_secondes: temps_limite_question ? parseInt(temps_limite_question) : null,
    note_automatique: noteAutomatiqueFinal,
  }

  const { data, error } = await supabase
    .from('quiz')
    .insert(quizData)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ quiz: data })
}
