import { useState } from "react"
import type { User } from "../data/mock"
import { authApi } from "../api/services"
import heroLogo from "../imports/hero-logo.png"

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("sarah.chen@herocrm.com")
  const [password, setPassword] = useState("Password123!")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (isRegister) {
      if (!fullName.trim() || !email.trim() || !password) {
        setError("All fields are required.")
        return
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters.")
        return
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.")
        return
      }
      setLoading(true)
      try {
        const user = await authApi.register(fullName.trim(), email.trim(), password)
        onLogin(user)
      } catch (err: any) {
        setError(err?.message || "Registration failed. Please try again.")
        setLoading(false)
      }
      return
    }

    // Login flow
    if (!email || !password) {
      setError("Email and password are required.")
      return
    }
    setLoading(true)
    try {
      const user = await authApi.login(email, password)
      onLogin(user)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err?.message || "Invalid email or password. Please verify the backend is running.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#070d1e] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full pointer-events-none opacity-20"
        style={{
          background: "radial-gradient(circle, #1a3896 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full pointer-events-none opacity-15"
        style={{
          background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
          filter: "blur(90px)",
        }}
      />

      {/* Main Floating Card Container (Inspired by Reference Design) */}
      <div className="w-full max-w-[1080px] bg-[#0c1326] border border-white/10 rounded-[32px] shadow-2xl shadow-black/70 p-3.5 sm:p-5 lg:p-6 flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch relative z-10">
        {/* Left Inset Showcase Panel - Logo Centered */}
        <div
          className="w-full lg:w-[46%] min-h-[300px] sm:min-h-[380px] lg:min-h-[580px] rounded-3xl overflow-hidden relative flex items-center justify-center p-8 sm:p-12 text-white border border-white/10 shadow-inner"
          style={{
            background: "linear-gradient(155deg, #091a42 0%, #122a68 50%, #061026 100%)",
          }}
        >
          {/* Subtle ambient light glow behind the logo */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.25) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div
            className="absolute w-48 h-48 rounded-full pointer-events-none opacity-40"
            style={{
              background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
          />

          {/* Centered Hero Logo */}
          <div className="relative z-10 flex items-center justify-center w-full max-w-[240px] sm:max-w-[300px]">
            <img
              src={heroLogo}
              alt="Hero"
              className="w-full h-auto object-contain select-none filter brightness-0 invert drop-shadow-2xl transition-transform duration-300 hover:scale-105"
            />
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-[54%] flex flex-col justify-center px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1
              className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isRegister ? "Create an account" : "Sign in to your account"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              <span>{isRegister ? "Already have an account?" : "Don't have an account?"}</span>{" "}
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError("")
                  if (!isRegister) {
                    setEmail("")
                    setPassword("")
                    setConfirmPassword("")
                  } else {
                    setEmail("sarah.chen@herocrm.com")
                    setPassword("Password123!")
                  }
                }}
                className="font-semibold text-blue-400 hover:text-blue-300 underline underline-offset-4 ml-1 cursor-pointer"
              >
                {isRegister ? "Log in" : "Create one"}
              </button>
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg">
              <span className="text-base leading-none">⚠️</span>
              <span className="flex-1 leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 sm:gap-6">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Full Name
                </label>
                <div className="flex items-center w-full rounded-2xl bg-[#141d36] border border-[#243358] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 px-4 py-3.5 sm:py-4 transition-all">
                  <span className="text-slate-400 mr-3 flex-shrink-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none p-0 text-white placeholder:text-slate-500 text-sm sm:text-base font-medium min-w-0"
                    placeholder="e.g. Fletcher Morgan"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center w-full rounded-2xl bg-[#141d36] border border-[#243358] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 px-4 py-3.5 sm:py-4 transition-all">
                <span className="text-slate-400 mr-3 flex-shrink-0 flex items-center pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none p-0 text-white placeholder:text-slate-500 text-sm sm:text-base font-medium min-w-0"
                  placeholder="you@herocrm.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="flex items-center w-full rounded-2xl bg-[#141d36] border border-[#243358] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 px-4 py-3.5 sm:py-4 transition-all">
                <span className="text-slate-400 mr-3 flex-shrink-0 flex items-center pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none p-0 text-white placeholder:text-slate-500 text-sm sm:text-base font-medium min-w-0"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-slate-400 hover:text-white ml-2.5 p-1 cursor-pointer flex items-center focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  Confirm Password
                </label>
                <div className="flex items-center w-full rounded-2xl bg-[#141d36] border border-[#243358] focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 px-4 py-3.5 sm:py-4 transition-all">
                  <span className="text-slate-400 mr-3 flex-shrink-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none p-0 text-white placeholder:text-slate-500 text-sm sm:text-base font-medium min-w-0"
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            )}


            {/* Primary Action Button (Hero Royal Blue) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl font-bold text-base sm:text-lg bg-[#1a3896] hover:bg-[#2348bd] text-white shadow-xl shadow-blue-950/40 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-3 py-4 sm:py-4.5"
                style={{ opacity: loading ? 0.75 : 1 }}
              >
                {loading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {loading
                    ? isRegister
                      ? "Creating account…"
                      : "Signing in…"
                    : isRegister
                    ? "Create account"
                    : "Sign in"}
                </span>
              </button>
            </div>
          </form>

          {/* Divider Line (Non-collapsible flexbox with real height) */}
          <div className="flex items-center gap-3 sm:gap-4 my-7 sm:my-9 w-full select-none">
            <div className="flex-1 h-px bg-slate-700/60" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap shrink-0">
              Or sign in with demo accounts
            </span>
            <div className="flex-1 h-px bg-slate-700/60" />
          </div>

          {/* Bottom Dual Pill Buttons (Sarah Chen Admin / James Okafor Dev) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setEmail("sarah.chen@herocrm.com")
                setPassword("Password123!")
                setError("")
              }}
              className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#141d36] hover:bg-[#1a2749] border border-[#243358] hover:border-amber-400/50 text-white transition-all cursor-pointer group shadow-sm text-left"
            >
              <div className="min-w-0 pr-3">
                <div className="text-sm font-semibold text-white group-hover:text-amber-200 truncate">
                  Sarah Chen
                </div>
                <div className="text-xs text-slate-400 mt-0.5">System Admin</div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 flex-shrink-0">
                Admin
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegister(false)
                setEmail("james.okafor@herocrm.com")
                setPassword("Password123!")
                setError("")
              }}
              className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#141d36] hover:bg-[#1a2749] border border-[#243358] hover:border-blue-400/50 text-white transition-all cursor-pointer group shadow-sm text-left"
            >
              <div className="min-w-0 pr-3">
                <div className="text-sm font-semibold text-white group-hover:text-blue-200 truncate">
                  James Okafor
                </div>
                <div className="text-xs text-slate-400 mt-0.5">Developer</div>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                Dev
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

