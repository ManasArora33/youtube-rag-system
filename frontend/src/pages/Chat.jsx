import { useParams, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAuth } from '../context/authContext'
import api from '../api/api'

// Markdown component for AI messages
function MarkdownContent({ content }) {
  return (
    <div className="text-sm leading-relaxed prose prose-invert prose-sm max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            return inline ? (
              <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            ) : (
              <pre className="bg-black/50 p-3 rounded-lg overflow-x-auto text-sm my-2">
                <code className={className} {...props}>{children}</code>
              </pre>
            )
          },
          h1: ({ children }) => <h1 className="text-2xl font-semibold mt-4 mb-2">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold mt-4 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc my-2 ml-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal my-2 ml-4">{children}</ol>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default function Chat() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth()

  const [chats, setChats] = useState([])
  const [messages, setMessages] = useState([])
  const [currentChat, setCurrentChat] = useState(null)
  const [suggestedQuestions, setSuggestedQuestions] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [creatingChat, setCreatingChat] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [editingChat, setEditingChat] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const messagesEndRef = useRef(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatStatus, setChatStatus] = useState('ready')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    console.log('User in Chat:', user)
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchChats()
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  useEffect(() => {
    if (!authLoading && isAuthenticated && chatId) {
      fetchMessages(chatId)
      const chat = chats.find(c => c._id === chatId)
      setCurrentChat(chat)
      if (chat) {
        setChatStatus(chat.status || 'ready')
      }
    } else if (!chatId) {
      setMessages([])
      setCurrentChat(null)
      setSuggestedQuestions([])
      setChatStatus('ready')
    }
  }, [chatId, chats, authLoading, isAuthenticated])

  // Poll for status if processing
  useEffect(() => {
    let interval;
    if (chatId && chatStatus === 'processing') {
      interval = setInterval(async () => {
        try {
          const response = await api.get(`/chats/${chatId}/status`)
          if (response.data.status === 'ready') {
            setChatStatus('ready')
            // Refresh chats list to update the internal status
            fetchChats()
          }
        } catch (err) {
          console.error('Status poll failed:', err)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [chatId, chatStatus])

  const fetchChats = async () => {
    try {
      const response = await api.get('/chats/all')
      console.log('Chats response:', response.data)
      setChats(response.data)
    } catch (err) {
      console.error('Failed to fetch chats:', err.response?.data || err.message)
    }
  }

  const fetchMessages = async (id) => {
    try {
      const response = await api.get(`/messages/${id}`)
      console.log('Messages response:', response.data)
      setMessages(response.data)
    } catch (err) {
      console.error('Failed to fetch messages:', err.response?.data || err.message)
      setMessages([])
    }
  }

  const renameChat = async (id) => {
    if (!editTitle.trim()) {
      setEditingChat(null)
      return
    }
    try {
      await api.patch(`/chats/${id}`, { title: editTitle })
      setChats(chats.map(c => c._id === id ? { ...c, title: editTitle } : c))
      if (currentChat?._id === id) {
        setCurrentChat({ ...currentChat, title: editTitle })
      }
    } catch (err) {
      console.error('Failed to rename chat:', err)
    } finally {
      setEditingChat(null)
      setEditTitle('')
    }
  }

  const deleteChat = async (id) => {
    if (!confirm('Are you sure you want to delete this chat?')) return
    try {
      await api.delete(`/chats/${id}`)
      setChats(chats.filter(c => c._id !== id))
      if (chatId === id) {
        navigate('/chat')
      }
    } catch (err) {
      console.error('Failed to delete chat:', err)
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || !chatId) return
    try {
      setLoading(true)
      const response = await api.post(`/messages/${chatId}`, { content: inputMessage })
      setMessages([...messages, response.data.userMessage, response.data.assistantMessage])
      setInputMessage('')
      setSuggestedQuestions([])
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question)
  }

  const startEditing = (chat) => {
    setEditingChat(chat._id)
    setEditTitle(chat.title)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const createNewChat = async (e) => {
    e.preventDefault()
    if (!videoUrl.trim()) return

    setCreatingChat(true)
    try {
      const response = await api.post('/chats/create', { videoUrl: videoUrl.trim() })
      const newChat = response.data.chat
      setChats([newChat, ...chats])
      navigate(`/chat/${newChat._id}`)
    } catch (err) {
      console.error('Failed to create chat:', err)
      alert(err.response?.data?.message || 'Failed to create chat')
    } finally {
      setCreatingChat(false)
    }
  }

  return (
    <div className="h-screen flex bg-black text-white">
      <style>{`
        .sidebar {
          background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
          border-right: 1px solid rgba(255,255,255,0.08);
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            z-index: 50;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 40;
          }
          .sidebar-overlay.open {
            display: block;
          }
        }
        @media (min-width: 769px) {
          .sidebar-overlay {
            display: none !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
        }
        .chat-item {
          transition: all 0.2s ease;
        }
        .chat-item:hover {
          background: rgba(255,255,255,0.05);
        }
        .chat-item.active {
          background: rgba(255,255,255,0.08);
        }
        .user-avatar {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        .dropdown-menu {
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
        }
        .main-area {
          background: #000;
        }
        .message-user {
          background: white;
          color: black;
        }
        .message-ai {
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .suggested-chip {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          transition: all 0.2s ease;
        }
        .suggested-chip:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }
        .input-area {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .input-area:focus-within {
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
        }
        .btn-send {
          background: white;
          color: black;
          transition: all 0.2s ease;
        }
        .btn-send:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.15);
        }
        .btn-new-chat {
          background: white;
          color: black;
          transition: all 0.2s ease;
        }
        .btn-new-chat:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.15);
        }
      `}</style>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div className={`w-64 sidebar flex flex-col ${sidebarOpen ? 'open' : ''}`}>
        {/* Mobile Close Button */}
        <div className="md:hidden p-3 border-b border-white/10 flex items-center justify-between">
          <span className="font-semibold">Chats</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* New Chat Button */}
        <div className="p-3 border-b border-white/10">
          <button
            onClick={() => navigate('/chat')}
            disabled={loading}
            className="btn-new-chat w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Chat
          </button>
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat._id}
              className={`chat-item group flex items-center gap-2 p-3 rounded-lg cursor-pointer ${chat._id === chatId ? 'active' : ''}`}
            >
              {editingChat === chat._id ? (
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => renameChat(chat._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') renameChat(chat._id)
                    if (e.key === 'Escape') {
                      setEditingChat(null)
                      setEditTitle('')
                    }
                  }}
                  autoFocus
                  className="flex-1 bg-transparent text-white border border-white/20 rounded px-2 py-1 text-sm focus:outline-none focus:border-white/40"
                />
              ) : (
                <>
                  <Link
                    to={`/chat/${chat._id}`}
                    className="flex-1 truncate text-sm text-neutral-300 hover:text-white transition-colors"
                  >
                    {chat.title || 'New Chat'}
                  </Link>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEditing(chat)}
                      className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteChat(chat._id)}
                      className="p-1 hover:bg-white/10 rounded text-neutral-400 hover:text-red-400 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* User Profile */}
        <div className="p-3 border-t border-white/10 relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 user-avatar rounded-full flex items-center justify-center text-sm font-medium">
              {user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
            <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* User Menu Dropdown */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 dropdown-menu rounded-lg py-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-neutral-300 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col main-area">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-menu-btn md:hidden p-2 hover:bg-white/10 rounded-lg text-neutral-400 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="text-neutral-400 hover:text-white transition-colors hidden sm:block" title="Home">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <h1 className="text-base md:text-lg font-semibold text-white tracking-tight truncate max-w-[200px] md:max-w-md">
              {currentChat?.title || 'New Chat'}
            </h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 md:space-y-6">
          {/* Suggested Questions */}
          {suggestedQuestions.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuestion(question)}
                  className="suggested-chip px-3 py-1.5 text-neutral-300 text-sm rounded-full"
                >
                  {question}
                </button>
              ))}
            </div>
          )}

          {/* Messages or New Chat Form */}
          {!chatId ? (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-md w-full">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-2 tracking-tight">Start a new chat</h2>
                  <p className="text-neutral-500 text-sm">Enter a YouTube URL to begin</p>
                </div>

                <form onSubmit={createNewChat} className="space-y-4">
                  <div className="input-area rounded-xl p-1">
                    <input
                      type="url"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      disabled={creatingChat}
                      className="w-full px-4 py-3 bg-transparent border-0 rounded-lg text-white placeholder-neutral-600 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!videoUrl.trim() || creatingChat}
                    className="btn-new-chat w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {creatingChat ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Chat
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          ) : messages.length === 0 && !loading ? (
            <div className="h-full flex items-center justify-center text-neutral-500">
              <p>Start a new conversation</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message._id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-3xl px-3 md:px-4 py-2.5 md:py-3 rounded-2xl ${message.role === 'user'
                    ? 'message-user'
                    : 'message-ai text-white'
                    }`}
                >
                  {message.role === 'user' ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  ) : (
                    <MarkdownContent content={message.content} />
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loading Spinner */}
          {loading && (
            <div className="flex justify-start">
              <div className="message-ai px-4 py-3 rounded-2xl flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-neutral-400" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-sm text-neutral-400">AI is thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />

          {/* Input Box or Processing Status */}
          <div className="pt-4 px-4 md:px-0">
            {chatId && chatStatus === 'processing' ? (
              <div className="input-area rounded-xl p-4 flex items-center justify-center gap-3 text-neutral-400 italic">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing video transcript... (This takes a moment during service wake-up)</span>
              </div>
            ) : (
              <div className="flex gap-2 md:gap-3 items-end">
                <div className="flex-1 input-area rounded-xl transition-all">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={chatId ? 'Ask anything about this video...' : 'Select a chat from the sidebar'}
                    disabled={loading || !chatId}
                    className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-transparent border-0 rounded-xl resize-y focus:outline-none disabled:opacity-50 min-h-[44px] md:min-h-[48px] max-h-[120px] text-white placeholder-neutral-600 text-sm md:text-base"
                    rows={1}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || loading}
                  className="btn-send flex-shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 hover:scale-105 active:scale-95"
                >
                  {loading ? (
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
