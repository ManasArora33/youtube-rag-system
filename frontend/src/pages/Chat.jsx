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
      setChats(response.data)
    } catch (err) {
      console.error('Failed to fetch chats:', err)
    }
  }

  const fetchMessages = async (id) => {
    try {
      const response = await api.get(`/messages/${id}`)
      setMessages(response.data)
    } catch (err) {
      console.error('Failed to fetch messages:', err)
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
    }
  }

  const deleteChat = async (id) => {
    if (!confirm('Delete this chat?')) return
    try {
      await api.delete(`/chats/${id}`)
      setChats(chats.filter(c => c._id !== id))
      if (chatId === id) navigate('/chat')
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
      alert(err.response?.data?.message || 'Failed to create chat')
    } finally {
      setCreatingChat(false)
    }
  }

  return (
    <div className="h-[100dvh] flex bg-black text-white overflow-hidden fixed inset-0">
      <style>{`
        body { 
          overflow: hidden !important; 
          height: 100dvh;
          position: fixed;
          width: 100%;
        }
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
            background: #0a0a0a !important;
            box-shadow: 20px 0 50px rgba(0,0,0,0.5);
          }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay {
            display: none;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(4px);
            z-index: 40;
          }
          .sidebar-overlay.open { display: block; }
        }
        .chat-item { transition: all 0.2s ease; }
        .chat-item:hover { background: rgba(255,255,255,0.05); }
        .chat-item.active { background: rgba(255,255,255,0.08); }
        .user-avatar { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); }
        .dropdown-menu {
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          backdrop-filter: blur(12px);
        }
        .message-user { background: white; color: black; }
        .message-ai {
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .input-area {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .btn-send, .btn-new-chat { background: white; color: black; transition: all 0.2s ease; }
        .btn-send:hover:not(:disabled), .btn-new-chat:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.15);
        }
      `}</style>

      {/* Mobile Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar flex flex-col w-72 h-full z-50 ${sidebarOpen ? 'open text-left' : ''}`}>
        <div className="p-4 flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8 px-2">
            <div className="text-sm font-bold tracking-tight">YT Chat AI</div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-2 hover:bg-white/10 rounded-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button onClick={() => { navigate('/chat'); setSidebarOpen(false); }} className="btn-new-chat w-full py-3 mb-6 rounded-lg font-medium flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto space-y-1">
            {chats.map((chat) => (
              <div key={chat._id} className={`chat-item group flex items-center gap-2 p-3 rounded-lg cursor-pointer ${chat._id === chatId ? 'active' : ''}`}>
                {editingChat === chat._id ? (
                  <input
                    type="text" value={editTitle} autoFocus
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => renameChat(chat._id)}
                    onKeyDown={(e) => e.key === 'Enter' && renameChat(chat._id)}
                    className="flex-1 bg-transparent border border-white/20 rounded px-2 py-1 text-sm outline-none"
                  />
                ) : (
                  <>
                    <Link to={`/chat/${chat._id}`} onClick={() => setSidebarOpen(false)} className="flex-1 truncate text-sm text-neutral-300 group-hover:text-white">{chat.title || 'New Chat'}</Link>
                    <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEditing(chat)} className="p-1 hover:text-white text-neutral-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2} /></svg></button>
                      <button onClick={() => deleteChat(chat._id)} className="p-1 hover:text-red-400 text-neutral-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2} /></svg></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 mt-4 border-t border-white/10 relative">
            <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
              <div className="w-8 h-8 user-avatar rounded-full flex items-center justify-center text-sm font-medium">{user?.name?.[0]?.toUpperCase()}</div>
              <div className="flex-1 text-left truncate">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
            </button>
            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 dropdown-menu rounded-lg py-1">
                <button onClick={handleLogout} className="w-full px-4 py-2 text-left hover:bg-white/10 flex items-center gap-2 text-sm text-neutral-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth={2} /></svg> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-black">
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-white/5">
          <div className="flex items-center gap-4 truncate">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-neutral-400 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <Link to="/" className="text-neutral-500 hover:text-white transition-colors" title="Home">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth={2} /></svg>
            </Link>
            <h1 className="text-sm md:text-base font-semibold truncate tracking-tight">{currentChat?.title || 'New Chat'}</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {!chatId ? (
            <div className="h-full flex items-center justify-center p-6">
              <div className="max-w-md w-full text-center">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={1.5} /></svg>
                </div>
                <h2 className="text-xl font-bold mb-2">Converse with any Video</h2>
                <p className="text-neutral-500 text-sm mb-8">Paste a YouTube URL to start an AI-powered insights session.</p>
                <form onSubmit={createNewChat} className="space-y-3">
                  <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube URL..." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors text-sm" />
                  <button type="submit" disabled={!videoUrl.trim() || creatingChat} className="w-full btn-new-chat py-3 rounded-xl font-semibold text-sm disabled:opacity-50">
                    {creatingChat ? 'Analyzing...' : 'Create Insights Session'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] px-4 py-3 rounded-2xl ${m.role === 'user' ? 'message-user shadow-lg' : 'message-ai'}`}>
                    {m.role === 'user' ? <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{m.content}</p> : <MarkdownContent content={m.content} />}
                  </div>
                </div>
              ))}
              {loading && <div className="flex justify-start"><div className="message-ai px-4 py-3 rounded-2xl flex items-center gap-3 animate-pulse"><div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.2s]" /><div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:0.4s]" /></div></div>}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="p-4 md:p-6 bg-black">
          <div className="max-w-3xl mx-auto w-full">
            {chatId && chatStatus === 'processing' ? (
              <div className="input-area rounded-xl p-4 text-center text-sm text-neutral-500 border border-white/10 italic">
                Analyzing transcript... (Service is waking up, please wait)
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1 input-area rounded-2xl overflow-hidden focus-within:ring-1 ring-white/20 transition-all">
                  <textarea
                    value={inputMessage} onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={chatId ? "Ask anything..." : "Select a chat..."}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                    className="w-full bg-transparent border-none text-sm md:text-base p-4 outline-none resize-none max-h-32 min-h-[56px]"
                    rows={1} disabled={!chatId || loading}
                  />
                </div>
                <button onClick={sendMessage} disabled={!inputMessage.trim() || loading} className="w-12 h-12 btn-send rounded-2xl flex items-center justify-center disabled:opacity-40"><svg className="w-5 h-5 -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" strokeWidth={2} /></svg></button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
