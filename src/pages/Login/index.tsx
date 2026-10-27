import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LeafLogo } from '../../components/ui/LeafLogo'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const from = (location.state as any)?.from?.pathname || '/overview'

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, from])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    const trimmedEmail = email.trim()
    const trimmedPassword = password

    if (!trimmedEmail) {
      setErrorMsg('Please enter your email address or username.')
      return
    }

    if (!trimmedPassword) {
      setErrorMsg('Please enter your account password.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(trimmedEmail, trimmedPassword)
      navigate(from, { replace: true })
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0D141B] text-[#EDF3F8] font-sans flex flex-col justify-between selection:bg-[#15BDEB]/30">
      {/* Main Split Layout: 55% Branding / 45% Form on Desktop */}
      <div className="flex-1 flex flex-col lg:flex-row w-full min-h-[calc(100vh-60px)]">
        
        {/* LEFT COLUMN: 55% Branding Area */}
        <section 
          aria-label="SE-MAESTRO Introduction"
          className="lg:w-[55%] flex flex-col justify-between p-8 sm:p-12 lg:p-16 xl:p-20 relative border-b lg:border-b-0 lg:border-r border-[#263744]"
        >
          {/* Top Brand Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <LeafLogo size={28} className="w-7 h-7 flex-shrink-0" />
            <span className="font-display font-bold text-xl tracking-wide text-[#EDF3F8]">
              SE-MAESTRO
            </span>
          </div>

          {/* Core Value Proposition & Branching Graphic */}
          <div className="my-10 lg:my-auto max-w-xl">
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[52px] leading-[1.12] tracking-tight text-[#EDF3F8]">
              Your idea.<br />
              An AI engineering<br />
              <span className="text-[#15BDEB]">team.</span>
            </h1>

            <p className="mt-6 text-sm sm:text-base text-[#A8B8C8] leading-relaxed max-w-lg">
              Plan, build, test and refine software with an AI engineering team.
            </p>

            {/* Restrained Thin Cyan Branching Lines Decoration (SVG) */}
            <div className="mt-10 w-full max-w-md pointer-events-none select-none opacity-85" aria-hidden="true">
              <svg 
                viewBox="0 0 420 120" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-auto"
              >
                {/* Branch line 1: Central spine into multiple agent nodes */}
                <path 
                  d="M10 60 H 120 C 150 60 170 24 200 24 H 380" 
                  stroke="#15BDEB" 
                  strokeWidth="1.5" 
                  strokeOpacity="0.75"
                  strokeDasharray="4 2"
                />
                <path 
                  d="M120 60 H 380" 
                  stroke="#15BDEB" 
                  strokeWidth="1.75" 
                  strokeOpacity="0.9"
                />
                <path 
                  d="M120 60 C 150 60 170 96 200 96 H 380" 
                  stroke="#15BDEB" 
                  strokeWidth="1.5" 
                  strokeOpacity="0.75"
                  strokeDasharray="4 2"
                />

                {/* Node Points */}
                <circle cx="10" cy="60" r="3.5" fill="#2BC879" />
                <circle cx="120" cy="60" r="3" fill="#15BDEB" />
                
                <circle cx="200" cy="24" r="3" fill="#15BDEB" />
                <circle cx="380" cy="24" r="3.5" fill="#15BDEB" />
                <text x="390" y="27" fill="#788B9B" fontSize="10" fontFamily="JetBrains Mono">ARCHITECT</text>

                <circle cx="260" cy="60" r="3.5" fill="#0878F9" />
                <circle cx="380" cy="60" r="3.5" fill="#15BDEB" />
                <text x="390" y="63" fill="#788B9B" fontSize="10" fontFamily="JetBrains Mono">DEVELOPER</text>

                <circle cx="200" cy="96" r="3" fill="#15BDEB" />
                <circle cx="380" cy="96" r="3.5" fill="#15BDEB" />
                <text x="390" y="99" fill="#788B9B" fontSize="10" fontFamily="JetBrains Mono">TESTER</text>
              </svg>
            </div>
          </div>

          {/* Subdued footer annotation */}
          <div className="text-xs text-[#788B9B] font-mono hidden lg:block">
            Autonomous Multi-Agent Architecture &bull; Studio 2026
          </div>
        </section>

        {/* RIGHT COLUMN: 45% Form Area */}
        <section 
          aria-label="Sign in"
          className="lg:w-[45%] flex flex-col justify-center px-8 sm:px-14 lg:px-16 xl:px-24 py-12 lg:py-16 bg-[#0D141B]"
        >
          <div className="w-full max-w-sm mx-auto space-y-7">
            
            {/* Form Header */}
            <div className="space-y-2">
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#EDF3F8] tracking-tight">
                Welcome back
              </h2>
              <p className="text-sm text-[#A8B8C8]">
                Sign in to your SE-MAESTRO account.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div 
                role="alert"
                className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs leading-relaxed"
              >
                {errorMsg}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSignIn} className="space-y-5" noValidate>
              
              {/* Email / Username field */}
              <div>
                <label 
                  htmlFor="login-email" 
                  className="block text-xs font-medium text-[#EDF3F8] mb-2"
                >
                  Email address or username
                </label>
                <input
                  id="login-email"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="developer@se-maestro.ai"
                  className="w-full h-11 bg-[#121D26] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-sm rounded-lg px-3.5 focus:outline-none focus:border-[#15BDEB] focus:ring-1 focus:ring-[#15BDEB] transition-colors"
                />
              </div>

              {/* Password field */}
              <div>
                <label 
                  htmlFor="login-password" 
                  className="block text-xs font-medium text-[#EDF3F8] mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full h-11 bg-[#121D26] border border-[#263744] text-[#EDF3F8] placeholder-[#788B9B] text-sm rounded-lg pl-3.5 pr-11 focus:outline-none focus:border-[#15BDEB] focus:ring-1 focus:ring-[#15BDEB] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#788B9B] hover:text-[#EDF3F8] transition-colors focus:outline-none"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !email.trim() || !password.trim()}
                className="w-full h-11 bg-[#0878F9] hover:bg-[#15BDEB] disabled:opacity-50 disabled:pointer-events-none text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm mt-2 focus:outline-none focus:ring-2 focus:ring-[#15BDEB] focus:ring-offset-2 focus:ring-offset-[#0D141B]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign in</span>
                )}
              </button>
            </form>

            {/* Note on Enterprise Auth */}
            <div className="pt-2 text-center">
              <span className="text-xs text-[#788B9B]">
                Protected by SE-MAESTRO Governance & Isolation.
              </span>
            </div>

          </div>
        </section>

      </div>

      {/* Subdued Footer */}
      <footer className="h-14 border-t border-[#263744] px-8 sm:px-12 flex items-center justify-between text-xs text-[#788B9B] font-mono bg-[#0B131A]">
        <div>SE-MAESTRO &bull; Continuous Studio</div>
        <div>v2.4 Graphite Engine</div>
      </footer>
    </div>
  )
}
