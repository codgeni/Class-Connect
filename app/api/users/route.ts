import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { createEleveAccount, createProfAccount } from '@/lib/codes'

// GET - Liste des utilisateurs (admin uniquement)
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('users')
    .select('id, nom, prenom, email, role, code_login, password_plain, actif, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

// POST - Créer un utilisateur (admin uniquement)
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request)

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
  }

  const { nom, prenom, email, role, classe, section, matieres, classesAssignees } = await request.json()

  if (!nom || !role) {
    return NextResponse.json(
      { error: 'Nom et rôle requis' },
      { status: 400 }
    )
  }

  if (!['eleve', 'prof'].includes(role)) {
    return NextResponse.json(
      { error: 'Rôle invalide' },
      { status: 400 }
    )
  }

  const supabase = getSupabaseAdmin()

  // Construire le nom complet pour l'affichage (prénom + nom)
  const nomComplet = prenom ? `${prenom} ${nom}` : nom

  let accountData
  if (role === 'eleve') {
    accountData = await createEleveAccount(nomComplet)
  } else {
    accountData = await createProfAccount(nomComplet)
  }

  // Créer l'utilisateur
  // On stocke le nom complet dans 'nom' et le prénom séparément dans 'prenom'
  // On stocke aussi le mot de passe en clair pour que l'admin puisse le voir
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      nom: nomComplet,
      prenom: prenom || null,
      email: email || null,
      role,
      code_login: accountData.code_login,
      password_hash: accountData.password_hash,
      password_plain: accountData.password, // Stocker le mot de passe en clair
      actif: true,
    })
    .select('id, nom, role, code_login, actif, created_at')
    .single()

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  // Gérer les relations selon le rôle
  if (role === 'eleve' && classe) {
    // Trouver ou créer la classe
    let { data: classeData } = await supabase
      .from('classes')
      .select('id')
      .eq('nom', classe)
      .single()

    if (!classeData) {
      const { data: newClasse } = await supabase
        .from('classes')
        .insert({ nom: classe })
        .select('id')
        .single()
      classeData = newClasse
    }

    if (classeData) {
      // Créer la relation élève-classe
      await supabase.from('eleve_classes').insert({
        eleve_id: userData.id,
        classe_id: classeData.id,
        section: section || null,
      })
    }
  } else if (role === 'prof') {
    // Gérer les matières
    if (matieres && matieres.length > 0) {
      for (const matiereNom of matieres) {
        let { data: matiereData } = await supabase
          .from('matieres')
          .select('id')
          .eq('nom', matiereNom)
          .single()

        if (!matiereData) {
          const { data: newMatiere } = await supabase
            .from('matieres')
            .insert({ nom: matiereNom })
            .select('id')
            .single()
          matiereData = newMatiere
        }

        if (matiereData) {
          await supabase.from('prof_matieres').insert({
            prof_id: userData.id,
            matiere_id: matiereData.id,
          })
        }
      }
    }

    // Gérer les classes assignées
    if (classesAssignees && classesAssignees.length > 0) {
      for (const classeNom of classesAssignees) {
        let { data: classeData } = await supabase
          .from('classes')
          .select('id')
          .eq('nom', classeNom)
          .single()

        if (!classeData) {
          const { data: newClasse } = await supabase
            .from('classes')
            .insert({ nom: classeNom })
            .select('id')
            .single()
          classeData = newClasse
        }

        if (classeData) {
          await supabase.from('prof_classes').insert({
            prof_id: userData.id,
            classe_id: classeData.id,
          })
        }
      }
    }
  }

  // Vérifier que l'utilisateur a bien été créé
  const { data: verifyUser, error: verifyError } = await supabase
    .from('users')
    .select('id, nom, code_login, role, actif')
    .eq('id', userData.id)
    .single()

  if (verifyError || !verifyUser) {
    console.error('Error verifying created user:', verifyError)
    return NextResponse.json(
      { error: 'Compte créé mais erreur de vérification' },
      { status: 500 }
    )
  }

  console.log('User created successfully:', {
    id: verifyUser.id,
    code_login: verifyUser.code_login,
    role: verifyUser.role,
    actif: verifyUser.actif
  })

  return NextResponse.json({
    user: userData,
    credentials: {
      code_login: accountData.code_login,
      password: accountData.password,
    },
  })
}
