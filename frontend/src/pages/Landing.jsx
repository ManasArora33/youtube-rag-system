import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/authContext'

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const featuresRef = useRef(null)
  const heroRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible')
        }
      })
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' })

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white/20">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        
        .font-sans {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        /* Text reveal animation */
        .reveal-text {
          opacity: 0;
          transform: translateY(40px);
          filter: blur(8px);
        }
        .reveal-text.visible {
          animation: text-reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        @keyframes text-reveal {
          0% {
            opacity: 0;
            transform: translateY(40px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }
        
        /* Stagger delays */
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        
        /* Gradient text shimmer */
        .shimmer {
          background: linear-gradient(
            90deg,
            #fff 0%,
            #fff 40%,
            rgba(255,255,255,0.5) 50%,
            #fff 60%,
            #fff 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
        
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        
        /* Smooth fade for other elements */
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), 
                      transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        /* Elegant text styling */
        .hero-text {
          letter-spacing: -0.02em;
          text-shadow: 0 0 80px rgba(255,255,255,0.1);
        }
        
        /* Subtle glow for headlines */
        .text-glow {
          text-shadow: 0 0 40px rgba(255,255,255,0.15), 0 0 80px rgba(255,255,255,0.1);
        }
        
        .spotlight {
          background: radial-gradient(600px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), 
            rgba(255,255,255,0.06), 
            transparent 40%
          );
        }
        
        .card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .card:hover {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1);
        }
        
        .spotlight-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .spotlight-card:hover {
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .spotlight-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(800px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), 
            rgba(255,255,255,0.06), 
            transparent 40%
          );
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }
        .spotlight-card:hover::before {
          opacity: 1;
        }
        
        .btn-primary {
          background: white;
          color: black;
          font-weight: 500;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 1px 2px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.05);
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255,255,255,0.15), 0 0 0 1px rgba(255,255,255,0.2);
        }
        
        .btn-secondary {
          background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.9);
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%);
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .nav-blur {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .text-gradient {
          background: linear-gradient(to right, #fff 20%, rgba(255,255,255,0.6) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .glow {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%);
          pointer-events: none;
        }
        
        .mobile-menu {
          display: none;
        }
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu {
            display: flex;
            flex-direction: column;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding: 1rem;
            gap: 0.5rem;
          }
        }
      `}</style>

      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'nav-blur' : 'bg-transparent'
        }`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-sm font-medium tracking-tight">
            YT Chat AI
          </Link>

          {/* Desktop Navigation */}
          <div className="desktop-nav hidden md:flex items-center gap-1">
            <button
              onClick={scrollToFeatures}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              Features
            </button>
            <Link
              to={isAuthenticated ? '/chat' : '/login'}
              className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors"
            >
              {isAuthenticated ? 'Chat' : 'Sign In'}
            </Link>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <Link
              to={isAuthenticated ? '/chat' : '/register'}
              className="px-4 py-2 text-sm font-medium text-white hover:text-neutral-300 transition-colors"
            >
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu md:hidden">
            <button
              onClick={() => {
                scrollToFeatures()
                setMobileMenuOpen(false)
              }}
              className="w-full px-4 py-3 text-left text-sm text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              Features
            </button>
            <Link
              to={isAuthenticated ? '/chat' : '/login'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full px-4 py-3 text-left text-sm text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {isAuthenticated ? 'Chat' : 'Sign In'}
            </Link>
            <Link
              to={isAuthenticated ? '/chat' : '/register'}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full px-4 py-3 text-left text-sm font-medium text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {isAuthenticated ? 'Dashboard' : 'Get Started'}
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex items-center justify-center pt-16 pb-20 overflow-hidden"
        style={{
          '--mouse-x': `${mousePosition.x}px`,
          '--mouse-y': `${mousePosition.y}px`
        }}
      >
        <div className="absolute inset-0 grid-pattern opacity-50" />
        <div className="absolute inset-0 spotlight pointer-events-none" />

        <div className="absolute top-1/4 left-1/4 glow" />
        <div className="absolute bottom-1/4 right-1/4 glow" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="reveal-text delay-100 visible inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-neutral-400">AI-Powered Conversations</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            <span className="reveal-text delay-200 visible block text-white">Chat with any</span>
            <span className="reveal-text delay-300 visible block shimmer">
              YouTube video
            </span>
          </h1>

          <p className="reveal-text delay-400 visible max-w-lg mx-auto text-base md:text-lg text-neutral-400 leading-relaxed mb-10 font-light">
            Transform videos into interactive conversations. Ask questions,
            get summaries, and extract insights instantly.
          </p>

          <div className="reveal-text delay-500 visible flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? '/chat' : '/register'}
              className="btn-primary px-6 py-2.5 rounded-md text-sm"
            >
              Start for Free
            </Link>
            <button
              onClick={scrollToFeatures}
              className="btn-secondary px-6 py-2.5 rounded-md text-sm"
            >
              Learn More
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <svg className="w-5 h-5 text-neutral-600 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresRef} className="relative py-24 md:py-32 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">
              Everything you need
            </h2>
            <p className="text-neutral-500 max-w-md mx-auto">
              A complete toolkit for understanding and interacting with video content
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 rounded-lg overflow-hidden">
            {[
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                ),
                title: 'AI Conversations',
                description: 'Ask questions and get context-aware answers from any video content.'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                title: 'Smart Summaries',
                description: 'Extract key points and get concise summaries without watching entire videos.'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Instant Answers',
                description: 'Get responses in seconds. No waiting, just immediate insights.'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                ),
                title: 'Private & Secure',
                description: 'Your conversations are encrypted. We prioritize your privacy.'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWeight={1.5}>
                    <path strokeLinecap="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                ),
                title: 'Universal Support',
                description: 'Works with any public YouTube video. Just paste the URL.'
              },
              {
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                ),
                title: 'Persistent History',
                description: 'All conversations saved. Resume anytime from where you left off.'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="fade-in spotlight-card bg-black p-6 group"
                style={{
                  transitionDelay: `${index * 50}ms`,
                  '--spotlight-x': '50%',
                  '--spotlight-y': '50%'
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  e.currentTarget.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`)
                  e.currentTarget.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`)
                }}
              >
                <div className="w-10 h-10 rounded-md border border-white/10 bg-white/5 flex items-center justify-center text-neutral-400 mb-4 group-hover:text-white group-hover:border-white/20 transition-colors">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="fade-in card rounded-xl p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Ready to get started?
            </h2>
            <p className="text-neutral-500 mb-8 max-w-md mx-auto">
              Join others who are transforming how they interact with video content.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to={isAuthenticated ? '/chat' : '/register'}
                className="btn-primary px-6 py-2.5 rounded-md text-sm w-full sm:w-auto"
              >
                Create Free Account
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  className="btn-secondary px-6 py-2.5 rounded-md text-sm w-full sm:w-auto"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm font-medium">YT Chat AI</span>

            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to={isAuthenticated ? '/chat' : '/login'} className="hover:text-white transition-colors">
                {isAuthenticated ? 'Chat' : 'Login'}
              </Link>
              <button onClick={scrollToFeatures} className="hover:text-white transition-colors">
                Features
              </button>
            </div>

            <span className="text-sm text-neutral-600">2024</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
