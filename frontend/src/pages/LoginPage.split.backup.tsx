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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#0a1638]">
      {/* Left Stage - Spacious White background showcasing the blue Hero logo */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-12 sm:p-20 lg:p-28 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 relative overflow-hidden">
        {/* Subtle decorative radial atmosphere */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            background: "radial-gradient(circle at 50% 50%, rgba(0, 50, 140, 0.04) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 w-full flex items-center justify-center">
          <img
            src={heroLogo}
            alt="Hero"
            className="w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[520px] object-contain select-none transition-transform duration-300 hover:scale-[1.02]"
          />
        </div>
      </div>

      {/* Right Stage - Dark Blue background with widely spread out, spacious contents */}
      <div className="w-full lg:w-1/2 flex-1 flex flex-col justify-center items-center p-8 sm:p-14 lg:p-20 xl:p-24 relative overflow-y-auto bg-[#0a1638]">
        {/* Subtle ambient light in the background */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none opacity-25"
          style={{
            background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="relative z-10 w-full max-w-[560px]">
          {/* Header */}
          <div className="mb-10 sm:mb-12">
            <h1
              className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {isRegister ? "Create account" : "Sign in"}
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mt-3 sm:mt-4 leading-relaxed">
              {isRegister
                ? "Register as a developer to start collaborating"
                : "Welcome back! Enter your credentials to continue"}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-sm sm:text-base flex items-start gap-3.5 shadow-xl">
              <span className="text-xl leading-none">⚠️</span>
              <span className="flex-1 leading-relaxed font-medium">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-7 sm:space-y-8">
            {isRegister && (
              <div>
                <label
                  className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Full Name
                </label>
                <div className="flex items-center w-full rounded-2xl bg-[#122353] border border-[#223d82] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/30 px-5 py-4 sm:py-4.5 transition-all">
                  <span className="text-slate-400 mr-4 flex-shrink-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none p-0 m-0 text-white placeholder:text-slate-400 text-base sm:text-lg min-w-0"
                    placeholder="e.g. Alex Morgan"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Email Address
              </label>
              <div className="flex items-center w-full rounded-2xl bg-[#122353] border border-[#223d82] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/30 px-5 py-4 sm:py-4.5 transition-all">
                <span className="text-slate-400 mr-4 flex-shrink-0 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none p-0 m-0 text-white placeholder:text-slate-400 text-base sm:text-lg min-w-0"
                  placeholder="you@herocrm.com"
                />
              </div>
            </div>

            <div>
              <label
                className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Password
              </label>
              <div className="flex items-center w-full rounded-2xl bg-[#122353] border border-[#223d82] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/30 px-5 py-4 sm:py-4.5 transition-all">
                <span className="text-slate-400 mr-4 flex-shrink-0 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 bg-transparent border-0 outline-none p-0 m-0 text-white placeholder:text-slate-400 text-base sm:text-lg min-w-0"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="text-slate-400 hover:text-white ml-3.5 flex-shrink-0 cursor-pointer p-1 flex items-center focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isRegister && (
              <div>
                <label
                  className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-200 mb-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Confirm Password
                </label>
                <div className="flex items-center w-full rounded-2xl bg-[#122353] border border-[#223d82] focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/30 px-5 py-4 sm:py-4.5 transition-all">
                  <span className="text-slate-400 mr-4 flex-shrink-0 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 bg-transparent border-0 outline-none p-0 m-0 text-white placeholder:text-slate-400 text-base sm:text-lg min-w-0"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div className="text-xs sm:text-sm p-4 rounded-2xl leading-relaxed bg-blue-950/70 text-blue-200 border border-blue-800/70">
                ℹ️ New accounts are registered with the <strong>Developer</strong> role. Administrator privileges are granted only by system admins.
              </div>
            )}

            {/* Action Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl font-bold text-base sm:text-lg bg-white text-[#0a1638] hover:bg-slate-100 shadow-2xl active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-3 py-4 sm:py-4.5"
                style={{ opacity: loading ? 0.75 : 1 }}
              >
                {loading && (
                  <span className="w-5 h-5 border-3 border-[#0a1638] border-t-transparent rounded-full animate-spin" />
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

          {/* Toggle Login / Register */}
          <div className="mt-8 sm:mt-10 text-center text-sm sm:text-base text-slate-300">
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
              className="font-semibold text-blue-300 hover:text-white underline underline-offset-4 ml-1.5 cursor-pointer"
            >
              {isRegister ? "Sign in" : "Create one"}
            </button>
          </div>

          {/* Demo Accounts Section - Spread across 2 columns with generous padding */}
          <div className="mt-12 sm:mt-16 pt-8 sm:pt-10 border-t border-white/10">
            <div className="flex items-center justify-between text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 px-1">
              <span>⚡ Quick Demo Login</span>
              <span className="text-xs font-normal text-slate-400 lowercase">click to autofill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(false)
                  setEmail("sarah.chen@herocrm.com")
                  setPassword("Password123!")
                  setError("")
                }}
                className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#122353] border border-[#223d82] hover:border-blue-400 hover:bg-[#182e6c] transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-sm sm:text-base font-semibold text-white group-hover:text-blue-200 truncate">
                    Sarah Chen
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-0.5">System Admin</div>
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
                className="flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#122353] border border-[#223d82] hover:border-blue-400 hover:bg-[#182e6c] transition-all text-left cursor-pointer group shadow-md"
              >
                <div className="min-w-0 pr-3">
                  <div className="text-sm sm:text-base font-semibold text-white group-hover:text-blue-200 truncate">
                    James Okafor
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-0.5">Developer</div>
                </div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 flex-shrink-0">
                  Dev
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
