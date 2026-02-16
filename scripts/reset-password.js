const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  const args = process.argv.slice(2)
  
  if (args.length < 2) {
    console.log('Usage: node scripts/reset-password.js <code_login> <nouveau_mot_de_passe>')
    console.log('Exemple: node scripts/reset-password.js INS-413494 INS-AbC123XyZ')
    process.exit(1)
  }

  const codeLogin = args[0]
  const newPassword = args[1]

  try {
    // Vérifier si l'utilisateur existe
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, nom, role, code_login, actif')
      .eq('code_login', codeLogin)
      .single()

    if (fetchError || !user) {
      console.error('❌ Utilisateur non trouvé:', codeLogin)
      process.exit(1)
    }

    console.log('📋 Utilisateur trouvé:')
    console.log('   Nom:', user.nom)
    console.log('   Rôle:', user.role)
    console.log('   Actif:', user.actif)
    console.log('')

    // Hasher le nouveau mot de passe
    console.log('🔐 Hachage du nouveau mot de passe...')
    const passwordHash = await bcrypt.hash(newPassword, 12)

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_plain: newPassword, // Stocker aussi en clair pour l'admin
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour:', updateError.message)
      process.exit(1)
    }

    console.log('✅ Mot de passe réinitialisé avec succès!')
    console.log('')
    console.log('📋 Nouveaux identifiants:')
    console.log('   Code de connexion:', codeLogin)
    console.log('   Mot de passe:', newPassword)
    console.log('')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

resetPassword()
