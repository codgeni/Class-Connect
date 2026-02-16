const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  console.error('Assurez-vous d\'avoir NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setup() {
  console.log('🚀 Configuration de CodGeni Education...\n')

  try {
    // Vérifier si l'admin existe déjà
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('code_login', 'admin1')
      .single()

    if (existingAdmin) {
      console.log('✅ Compte admin existe déjà')
      console.log('   Code: admin1')
      console.log('   Mot de passe: admin123\n')
      return
    }

    // Créer le compte admin
    const password = 'admin123'
    const passwordHash = await bcrypt.hash(password, 12)

    const { data: admin, error } = await supabase
      .from('users')
      .insert({
        nom: 'Administrateur',
        role: 'admin',
        code_login: 'admin1',
        password_hash: passwordHash,
        actif: true,
      })
      .select('id, nom, role, code_login')
      .single()

    if (error) {
      console.error('❌ Erreur lors de la création de l\'admin:', error.message)
      process.exit(1)
    }

    console.log('✅ Compte administrateur créé avec succès!\n')
    console.log('📋 Identifiants de connexion:')
    console.log('   Code de connexion: admin1')
    console.log('   Mot de passe: admin123\n')
    console.log('⚠️  IMPORTANT: Changez le mot de passe après la première connexion!\n')

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

setup()
