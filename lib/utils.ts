/** Fuseau horaire plateforme : Eastern Standard Time (EST) UTC-5 */
export const PLATFORM_TIMEZONE = 'America/New_York'

/**
 * Formate une date en EST
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('fr-FR', { timeZone: PLATFORM_TIMEZONE, ...options })
}

/**
 * Formate heure en EST
 */
export function formatTime(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('fr-FR', { timeZone: PLATFORM_TIMEZONE, hour: '2-digit', minute: '2-digit', ...options })
}

/**
 * Formate date + heure en EST
 */
export function formatDateTime(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('fr-FR', {
    timeZone: PLATFORM_TIMEZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  })
}

/**
 * Formate un nom complet en évitant les duplications
 * Le champ 'nom' peut contenir déjà le nom complet (prénom + nom)
 * Si c'est le cas, on utilise seulement le nom
 * Sinon, on combine prénom + nom
 */
export function formatNomComplet(nom?: string | null, prenom?: string | null): string {
  if (!nom) return 'Non renseigné'
  
  // Si pas de prénom, utiliser seulement le nom
  if (!prenom) {
    return nom.trim()
  }
  
  // Vérifier si le nom commence par le prénom (pour éviter la duplication)
  const nomTrimmed = nom.trim()
  const prenomTrimmed = prenom.trim()
  
  // Si le nom commence par le prénom suivi d'un espace, utiliser seulement le nom
  if (nomTrimmed.toLowerCase().startsWith(prenomTrimmed.toLowerCase() + ' ')) {
    return nomTrimmed
  }
  
  // Si le nom contient déjà le prénom (mais pas au début), utiliser seulement le nom
  if (nomTrimmed.toLowerCase().includes(prenomTrimmed.toLowerCase())) {
    return nomTrimmed
  }
  
  // Sinon, combiner prénom + nom
  return `${prenomTrimmed} ${nomTrimmed}`.trim()
}

/**
 * Retourne un tableau d’URLs à partir de fichier_url (une URL ou un JSON de plusieurs URLs).
 */
export function getFichierUrls(fichier_url: string | string[] | undefined): string[] {
  if (!fichier_url) return []
  if (Array.isArray(fichier_url)) return fichier_url
  try {
    if (typeof fichier_url === 'string' && fichier_url.startsWith('[')) {
      return JSON.parse(fichier_url) as string[]
    }
  } catch (_) {}
  return [fichier_url]
}
