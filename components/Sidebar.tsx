'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface SidebarProps {
  user: {
    nom: string
    prenom?: string
    role: 'admin' | 'prof' | 'eleve'
    code_login: string
    classe?: string | null
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [userData, setUserData] = useState(user)
  const [matieres, setMatieres] = useState<string[]>([])
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // Récupérer les données utilisateur depuis l'API si nécessaire
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUserData(data.user)
          // Si c'est un prof, récupérer ses matières
          if (data.user.role === 'prof') {
            fetch(`/api/prof/${data.user.id}/matieres`)
              .then(res => res.json())
              .then(matieresData => {
                if (matieresData.matieres) {
                  setMatieres(matieresData.matieres)
                }
              })
              .catch(() => {})
          }
        }
      })
      .catch(() => {})
  }, [])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/admin/eleves', label: 'Élèves', icon: 'users' },
    { href: '/admin/professeurs', label: 'Professeurs', icon: 'user-check' },
    { href: '/admin/comptes', label: 'Créer des comptes', icon: 'user-plus' },
    { href: '/admin/identifiants', label: 'Identifiants', icon: 'key' },
    { href: '/admin/avis', label: 'Avis', icon: 'megaphone' },
    { href: '/admin/dates-importantes', label: 'Dates importantes', icon: 'calendar-days' },
    { href: '/admin/programme-annee', label: 'Programme de l\'année', icon: 'calendar-check' },
    { href: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
  ]

  const profLinks = [
    { href: '/prof/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { href: '/prof/fiches-cours', label: 'Fiches de cours', icon: 'book' },
    { href: '/prof/devoirs', label: 'Devoirs', icon: 'file-text' },
    { href: '/prof/quiz', label: 'Quiz & Évaluations', icon: 'clipboard-check' },
    { href: '/prof/correction', label: 'Correction & Notes', icon: 'check-circle' },
    { href: '/prof/avis', label: 'Avis', icon: 'megaphone' },
    { href: '/prof/programme-annee', label: 'Dates importantes', icon: 'calendar-check' },
    { href: '/prof/parametres', label: 'Paramètres', icon: 'settings' },
  ]

  const eleveLinks = [
    { href: '/eleve/dashboard', label: 'Vue d\'ensemble', icon: 'layout-dashboard' },
    { href: '/eleve/fiches-cours', label: 'Fiche de Cours', icon: 'book' },
    { href: '/eleve/devoirs', label: 'Devoirs', icon: 'file-text' },
    { href: '/eleve/evaluations', label: 'Evaluations', icon: 'clipboard-check' },
    { href: '/eleve/avis', label: 'Avis importants', icon: 'megaphone' },
    { href: '/eleve/dates-importantes', label: 'Dates Importantes', icon: 'calendar-days' },
    { href: '/eleve/programme-annee', label: 'Programme de l\'année', icon: 'calendar-check' },
    { href: '/eleve/carnet', label: 'Carnet', icon: 'book-open' },
    { href: '/eleve/parametres', label: 'Paramètres', icon: 'settings' },
  ]

  const links = userData.role === 'admin' ? adminLinks : userData.role === 'prof' ? profLinks : eleveLinks

  const renderIcon = (iconName: string) => {
    const iconProps = {
      xmlns: "http://www.w3.org/2000/svg",
      width: "20",
      height: "20",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "2",
      strokeLinecap: "round" as const,
      strokeLinejoin: "round" as const,
    }

    switch (iconName) {
      case 'layout-dashboard':
        return (
          <svg {...iconProps}>
            <rect width="7" height="9" x="3" y="3" rx="1"></rect>
            <rect width="7" height="5" x="14" y="3" rx="1"></rect>
            <rect width="7" height="9" x="14" y="12" rx="1"></rect>
            <rect width="7" height="5" x="3" y="16" rx="1"></rect>
          </svg>
        )
      case 'users':
        return (
          <svg {...iconProps}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M22 21v-2a4 4 0 0 0-3-3.87m-4-12a4 4 0 0 1 .87 7.75"></path>
          </svg>
        )
      case 'user-check':
        return (
          <svg {...iconProps}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="m16 11l2 2l4-4"></path>
          </svg>
        )
      case 'user-plus':
        return (
          <svg {...iconProps}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M19 8v6m3-3h-6"></path>
          </svg>
        )
      case 'megaphone':
        return (
          <svg {...iconProps}>
            <path d="m3 11l18-5v12L3 14v-3zm18-5v12M3 14v3"></path>
          </svg>
        )
      case 'calendar-days':
        return (
          <svg {...iconProps}>
            <path d="M8 2v4m8-4v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"></path>
          </svg>
        )
      case 'calendar-check':
        return (
          <svg {...iconProps}>
            <path d="M8 2v4m8-4v4"></path>
            <rect width="18" height="18" x="3" y="4" rx="2"></rect>
            <path d="M3 10h18M9 16l2 2l4-4"></path>
          </svg>
        )
      case 'settings':
        return (
          <svg {...iconProps}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        )
      case 'book':
        return (
          <svg {...iconProps}>
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20"></path>
          </svg>
        )
      case 'book-open':
        return (
          <svg {...iconProps}>
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
          </svg>
        )
      case 'file-text':
        return (
          <svg {...iconProps}>
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path>
            <path d="M14 2v4a2 2 0 0 0 2 2h4M10 9H8M16 13H8M16 17H8M10 5H8"></path>
          </svg>
        )
      case 'clipboard-check':
        return (
          <svg {...iconProps}>
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"></rect>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <path d="m9 14l2 2l4-4"></path>
          </svg>
        )
      case 'check-circle':
        return (
          <svg {...iconProps}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <path d="m9 11l3 3l6-6"></path>
          </svg>
        )
      case 'message-square':
        return (
          <svg {...iconProps}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )
      case 'key':
        return (
          <svg {...iconProps}>
            <circle cx="8" cy="15" r="3"></circle>
            <path d="M15 8a7.5 7.5 0 0 1 5.5 5.5M15 8l-3 3m6-3l-3 3m3-3v3"></path>
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <aside
      className={`flex-shrink-0 bg-slate-900 text-slate-400 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="pt-8 pb-6 px-4 border-b border-slate-800 relative">
        {/* Bouton collapse/expand */}
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label={collapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
        >
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
            {collapsed ? (
              <>
                <path d="m9 18 6-6-6-6" />
              </>
            ) : (
              <>
                <path d="m15 18-6-6 6-6" />
              </>
            )}
          </svg>
        </button>

        <div className="flex flex-col items-center">
          <div className="h-20 w-20 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-slate-400"
            >
              {userData.role === 'admin' ? (
                <path d="M12 22s8-4 8-10V5l-8-3l-8 3v7c0 6 8 10 8 10"></path>
              ) : (
                <>
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </>
              )}
            </svg>
          </div>
          {!collapsed && (
            <>
              {userData.role === 'admin' ? (
                <>
                  <h2 className="text-lg font-semibold text-white mb-1">Direction Générale</h2>
                  <p className="text-sm text-slate-300 mb-1">Institution Nouvelle Source</p>
                  <p className="text-sm text-slate-400">Administrateur</p>
                </>
              ) : userData.role === 'prof' ? (
                <>
                  <h2 className="text-lg font-semibold text-white mb-1">{userData.nom}</h2>
                  <p className="text-sm text-slate-300 mb-1">Institution Nouvelle Source</p>
                  {matieres.length > 0 && (
                    <p className="text-sm text-slate-400">{matieres.join(' • ')}</p>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-white mb-1">{userData.nom}</h2>
                  <p className="text-sm text-slate-300 mb-1">Institution Nouvelle Source</p>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Informations de Contact - Admin et Prof */}
      {(userData.role === 'admin' || userData.role === 'prof') && !collapsed && (
        <div className="px-6 py-4 border-b border-slate-800">
          <div className="space-y-3">
            {userData.role === 'admin' ? (
              <>
                <div className="flex items-center gap-2">
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
                    className="text-slate-500"
                  >
                    <path d="m22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  </svg>
                  <span className="text-sm text-slate-300">admin@ins.edu</span>
                </div>
                <div className="flex items-center gap-2">
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
                    className="text-slate-500"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2a19.79 19.79 0 0 1-8.63-3.07a19.5 19.5 0 0 1-6-6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span className="text-sm text-slate-300">+509 36 00 00 00</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
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
                    className="text-slate-500"
                  >
                    <path d="m22 7l-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                    <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  </svg>
                  <span className="text-sm text-slate-300">{(userData as any).email || 'email@ins.edu'}</span>
                </div>
                <div className="flex items-center gap-2">
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
                    className="text-slate-500"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2a19.79 19.79 0 0 1-8.63-3.07a19.5 19.5 0 0 1-6-6a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span className="text-sm text-slate-300">+509 36 12 34 56</span>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 h-px bg-slate-800"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto no-scrollbar py-4 ${collapsed ? 'px-1' : 'px-3'} space-y-1`}>
        {links.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center py-2.5 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'hover:text-white hover:bg-slate-800'
              } ${collapsed ? 'justify-center px-2' : 'px-3'}`}
            >
              <span className={`${collapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400'}`}>
                {renderIcon(link.icon)}
              </span>
              {!collapsed && (
                <span className="truncate">
                  {link.label}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Classe élève en bas */}
      {userData.role === 'eleve' && userData.classe && !collapsed && (
        <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <span>Classe</span>
          <span className="font-semibold text-slate-200">{userData.classe}</span>
        </div>
      )}

      {/* Logout */}
      <div className={`${collapsed ? 'px-2' : 'px-6'} py-4 border-t border-slate-800`}>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center py-2.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors border border-red-400/30 hover:border-red-400/50 ${
            collapsed ? 'px-2' : 'px-4'
          }`}
          title="Déconnexion"
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
            <path d="m16 17l5-5l-5-5m5 5H9m0 9H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
          </svg>
        </button>
      </div>
    </aside>
  )
}
