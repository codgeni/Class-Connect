import { getSupabaseAdmin } from './supabase'
import { hashPassword } from './auth'

/**
 * Génère un mot de passe aléatoire (commence par INS-)
 */
export function generatePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let randomPart = ''
  for (let i = 0; i < 9; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `INS-${randomPart}`
}

/**
 * Génère un code unique pour un élève (INS-XXXXXX)
 */
export async function generateEleveCode(): Promise<string> {
  const supabase = getSupabaseAdmin()
  let code: string
  let exists = true

  // Générer un code unique
  while (exists) {
    const random = Math.floor(100000 + Math.random() * 900000)
    code = `INS-${random.toString().padStart(6, '0')}`

    const { data } = await supabase
      .from('users')
      .select('code_login')
      .eq('code_login', code)
      .single()

    exists = !!data
  }

  return code!
}

/**
 * Génère un code unique pour un professeur (INS-XXXXXX)
 */
export async function generateProfCode(): Promise<string> {
  const supabase = getSupabaseAdmin()
  let code: string
  let exists = true

  // Générer un code unique
  while (exists) {
    const random = Math.floor(100000 + Math.random() * 900000)
    code = `INS-${random.toString().padStart(6, '0')}`

    const { data } = await supabase
      .from('users')
      .select('code_login')
      .eq('code_login', code)
      .single()

    exists = !!data
  }

  return code!
}

/**
 * Crée un compte élève avec code et mot de passe générés
 */
export async function createEleveAccount(nom: string): Promise<{
  code_login: string
  password: string
  password_hash: string
}> {
  const code_login = await generateEleveCode()
  const password = generatePassword()
  const password_hash = await hashPassword(password)

  return {
    code_login,
    password,
    password_hash,
  }
}

/**
 * Crée un compte professeur avec code et mot de passe générés
 */
export async function createProfAccount(nom: string): Promise<{
  code_login: string
  password: string
  password_hash: string
}> {
  const code_login = await generateProfCode()
  const password = generatePassword()
  const password_hash = await hashPassword(password)

  return {
    code_login,
    password,
    password_hash,
  }
}
