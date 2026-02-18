'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'

interface Message {
  id: string
  expediteur_id: string
  destinataire_id: string
  contenu: string
  lu: boolean
  created_at: string
  expediteur?: {
    nom: string
    prenom?: string
  }
  destinataire?: {
    nom: string
    prenom?: string
  }
}

interface Conversation {
  eleve_id: string
  eleve: {
    nom: string
    prenom?: string
    classe?: string
  }
  lastMessage?: Message
  unreadCount: number
}

export default function MessagesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [availableEleves, setAvailableEleves] = useState<Array<{ id: string; nom: string; prenom?: string; classe?: string }>>([])

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user && data.user.role === 'prof') {
          setUser(data.user)
          loadConversations(data.user.id)
          loadAvailableEleves(data.user.id)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (user) {
      loadAvailableEleves(user.id)
      loadConversations(user.id)
    }
  }, [user])

  useEffect(() => {
    if (selectedConversation && user) {
      loadMessages(selectedConversation.eleve_id)
      // Marquer les messages comme lus
      markAsRead(selectedConversation.eleve_id)
      // Recharger les conversations pour mettre à jour le compteur
      loadConversations(user.id)
    }
  }, [selectedConversation, user])

  useEffect(() => {
    // Auto-scroll vers le bas quand de nouveaux messages arrivent
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Polling pour les nouveaux messages
  useEffect(() => {
    if (!user) return

    const interval = setInterval(() => {
      loadConversations(user.id)
      if (selectedConversation) {
        loadMessages(selectedConversation.eleve_id)
      }
    }, 5000) // Toutes les 5 secondes

    return () => clearInterval(interval)
  }, [user, selectedConversation])

  const loadAvailableEleves = async (profId: string) => {
    try {
      const res = await fetch(`/api/prof/${profId}/eleves`)
      const data = await res.json()
      if (data.eleves) {
        setAvailableEleves(data.eleves)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadConversations = async (profId: string) => {
    try {
      const res = await fetch('/api/messages/conversations')
      const data = await res.json()
      
      if (res.ok && data.conversations) {
        setConversations(data.conversations)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const loadMessages = async (eleveId: string) => {
    try {
      const res = await fetch(`/api/messages/${eleveId}`)
      const data = await res.json()
      
      if (res.ok && data.messages) {
        setMessages(data.messages)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const markAsRead = async (eleveId: string) => {
    try {
      await fetch(`/api/messages/${eleveId}/read`, { method: 'POST' })
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectEleve = (eleveId: string) => {
    const conv = conversations.find(c => c.eleve_id === eleveId)
    if (conv) {
      setSelectedConversation(conv)
    } else {
      const eleve = availableEleves.find(e => e.id === eleveId)
      if (eleve) {
        setSelectedConversation({
          eleve_id: eleve.id,
          eleve: { nom: eleve.nom, prenom: eleve.prenom, classe: eleve.classe },
          unreadCount: 0,
        })
      }
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !user || sending) return

    setSending(true)

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destinataire_id: selectedConversation.eleve_id,
          contenu: newMessage.trim(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Erreur lors de l\'envoi')
        setSending(false)
        return
      }

      setNewMessage('')
      // Recharger les messages
      await loadMessages(selectedConversation.eleve_id)
      // Recharger les conversations
      await loadConversations(user.id)
    } catch (err) {
      alert('Erreur de connexion')
    } finally {
      setSending(false)
    }
  }

  const getInitials = (nom: string, prenom?: string) => {
    if (prenom) {
      return `${prenom[0]}${nom[0]}`.toUpperCase()
    }
    return nom.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-pink-500',
      'bg-indigo-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatTime = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    } else if (days === 1) {
      return 'Hier'
    } else if (days < 7) {
      return `${days} jours`
    } else {
      return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    }
  }

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    const fullName = `${c.eleve.prenom || ''} ${c.eleve.nom}`.toLowerCase()
    return fullName.includes(searchLower) || c.eleve.nom.toLowerCase().includes(searchLower)
  })

  if (!user || loading) {
    return <div className="h-screen flex items-center justify-center">Chargement...</div>
  }

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm z-10">
          <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">Messages</h1>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar des élèves */}
          <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
            {/* Barre de recherche */}
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un élève..."
                  className="w-full px-4 py-2 pl-10 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
            </div>

            {/* Liste des élèves */}
            <div className="flex-1 overflow-y-auto">
              {availableEleves
                .filter(eleve => {
                  if (!searchQuery) return true
                  const searchLower = searchQuery.toLowerCase()
                  const fullName = `${eleve.prenom || ''} ${eleve.nom}`.toLowerCase()
                  return fullName.includes(searchLower) || eleve.nom.toLowerCase().includes(searchLower)
                })
                .map((eleve) => {
                  const conv = conversations.find(c => c.eleve_id === eleve.id)
                  const isSelected = selectedConversation?.eleve_id === eleve.id
                  
                  return (
                    <div
                      key={eleve.id}
                      onClick={() => handleSelectEleve(eleve.id)}
                      className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${
                        isSelected ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`${getAvatarColor(eleve.nom)} w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0`}>
                          {getInitials(eleve.nom, eleve.prenom)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-slate-800 text-sm truncate">
                              {eleve.prenom} {eleve.nom}
                            </h3>
                            {conv?.lastMessage && (
                              <span className="text-xs text-slate-500 flex-shrink-0 ml-2">
                                {formatTime(conv.lastMessage.created_at)}
                              </span>
                            )}
                          </div>
                          {eleve.classe && (
                            <p className="text-xs text-slate-500 mb-1">{eleve.classe}</p>
                          )}
                          {conv?.lastMessage && (
                            <p className="text-sm text-slate-600 truncate">
                              {conv.lastMessage.contenu}
                            </p>
                          )}
                          {!conv && (
                            <p className="text-xs text-slate-400 italic">Aucun message</p>
                          )}
                        </div>
                        {conv && conv.unreadCount > 0 && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              {availableEleves.length === 0 && (
                <div className="p-8 text-center text-slate-500 text-sm">
                  Aucun élève assigné
                </div>
              )}
            </div>
          </div>

          {/* Zone de chat */}
          <div className="flex-1 flex flex-col bg-white">
            {selectedConversation ? (
              <>
                {/* En-tête du chat */}
                <div className="px-6 py-4 border-b border-slate-200">
                  <h2 className="font-semibold text-slate-800">
                    {selectedConversation.eleve.prenom} {selectedConversation.eleve.nom}
                  </h2>
                  {selectedConversation.eleve.classe && (
                    <p className="text-sm text-slate-600">{selectedConversation.eleve.classe}</p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => {
                    const isFromProf = msg.expediteur_id === user.id
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-start gap-3 ${isFromProf ? 'flex-row-reverse' : ''}`}
                      >
                        <div className={`${getAvatarColor(isFromProf ? user.nom : selectedConversation.eleve.nom)} w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs flex-shrink-0`}>
                          {isFromProf
                            ? getInitials(user.nom, user.prenom)
                            : getInitials(selectedConversation.eleve.nom, selectedConversation.eleve.prenom)}
                        </div>
                        <div className={`flex flex-col ${isFromProf ? 'items-end' : 'items-start'} max-w-[70%]`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isFromProf
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.contenu}</p>
                          </div>
                          <span className="text-xs text-slate-500 mt-1">
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input de message */}
                <div className="px-6 py-4 border-t border-slate-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      placeholder="Tapez votre message..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sending}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <p className="text-lg font-medium mb-2">Sélectionnez une conversation</p>
                  <p className="text-sm">ou créez un nouveau message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
