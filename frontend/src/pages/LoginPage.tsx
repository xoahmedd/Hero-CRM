import { useState } from "react"
import type { User } from "../data/mock"
import { MOCK_USERS } from "../data/mock"
import { authApi } from "../api/services"
import captureImg from "../imports/Capture.PNG"

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("sarah.chen@herocrm.com")
  const [password, setPassword] = useState("Password123!")
  const [confirmPassword, setConfirmPassword] = useState("")
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

  const demoAccounts = [
    { email: "sarah.chen@herocrm.com", role: "Admin", label: "Sarah Chen" },
    { email: "james.okafor@herocrm.com", role: "Developer", label: "James Okafor" },
  ]

  return (
    <div className="min-h-screen flex" style={{ background: "#0d1b3e" }}>
      {/* Left panel */}
      <div className="flex-1 hidden lg:flex flex-col justify-between p-14">
        <div>
          <img
            src={captureImg}
            alt="Hero Middle East & Africa"
            style={{
              height: 30,
              objectFit: "contain",
              objectPosition: "left",
              opacity: 0.88,
              marginBottom: 8,
            }}
          />
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "#4a8220",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            CRM &amp; Project Platform
          </div>
        </div>

        <div style={{ paddingRight: 48 }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 42,
              color: "#f0f6ff",
              lineHeight: 1.2,
              marginBottom: 24,
              letterSpacing: "-0.01em",
              paddingLeft: 10,
            }}
          >
            Project management
            <br />
            built for execution.
          </h1>
          <p style={{ color: "#5a7aaa", fontSize: 16, lineHeight: 1.8, marginBottom: 8, paddingLeft: 10 }}>
            Unified workspace for Hero — track projects, manage tasks,
            monitor progress, and stay aligned.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "8+", label: "Active Projects" },
            { value: "6", label: "Developers" },
            { value: "5+", label: "Departments" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl"
              style={{ background: "#152654", border: "1px solid #1e3470", padding: "20px 18px" }}
            >
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 28,
                  color: "#4a8220",
                  marginBottom: 6,
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: "#5a7aaa", fontSize: 13, lineHeight: 1.4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div
        className="w-full lg:w-[460px] flex items-center justify-center px-10 py-12 overflow-y-auto"
        style={{ background: "#f8fafc" }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h2
              style={{
                fontFamily: "Doppio One, var(--font-display)",
                fontWeight: 700,
                fontSize: 26,
                color: "#0f172a",
                marginBottom: 6,
              }}
            >
              {isRegister ? "Create account" : "Sign in"}
            </h2>
            <p style={{ color: "#64748b", fontSize: 14 }}>
              {isRegister
                ? "Register as a Developer in Hero CRM"
                : "Access your Hero CRM workspace"}
            </p>
          </div>

          {error && (
            <div
              className="mb-4 px-4 py-3 rounded-lg text-sm"
              style={{
                background: "#fee2e2",
                color: "#b91c1c",
                border: "1px solid #fca5a5",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569", fontFamily: "var(--font-display)" }}
                >
                  Full name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#0f172a",
                    padding: "10px 14px",
                  }}
                  placeholder="e.g. Alex Morgan"
                />
              </div>
            )}

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#475569", fontFamily: "var(--font-display)" }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#0f172a",
                  padding: "10px 14px",
                }}
                placeholder="you@herocrm.com"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1.5"
                style={{ color: "#475569", fontFamily: "var(--font-display)" }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl text-sm outline-none transition-all"
                style={{
                  border: "1px solid #e2e8f0",
                  background: "white",
                  color: "#0f172a",
                  padding: "10px 14px",
                }}
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div>
                <label
                  className="block text-sm font-medium mb-1.5"
                  style={{ color: "#475569", fontFamily: "var(--font-display)" }}
                >
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl text-sm outline-none transition-all"
                  style={{
                    border: "1px solid #e2e8f0",
                    background: "white",
                    color: "#0f172a",
                    padding: "10px 14px",
                  }}
                  placeholder="••••••••"
                />
              </div>
            )}

            {isRegister && (
              <div
                className="text-xs p-3 rounded-lg leading-relaxed"
                style={{ background: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0" }}
              >
                ℹ️ New accounts are registered with the <strong>Developer</strong> role. Administrator privileges are reserved and granted only by system admins.
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-semibold text-sm transition-opacity cursor-pointer"
              style={{
                background: "#1a3896",
                color: "white",
                fontFamily: "var(--font-display)",
                opacity: loading ? 0.7 : 1,
                padding: "11px 0",
                border: "1px solid white",
                marginTop: 8,
              }}
            >
              {loading
                ? isRegister
                  ? "Creating account…"
                  : "Signing in…"
                : isRegister
                ? "Create account"
                : "Sign in"}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-4 text-center">
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
              className="text-sm font-medium transition-colors hover:underline cursor-pointer"
              style={{ color: "#1a3896" }}
            >
              {isRegister
                ? "Already have an account? Sign in"
                : "Don't have an account? Create one"}
            </button>
          </div>

          <div style={{ marginTop: 28, borderWidth: 1, borderColor: "#e2e8f0", borderStyle: "solid", borderRadius: 12, padding: "16px 18px", background: "white" }}>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-3 flex items-center justify-between"
              style={{ color: "#94a3b8", fontFamily: "var(--font-display)" }}
            >
              <span>Demo accounts</span>
              <span className="text-[11px] font-normal lowercase tracking-normal text-slate-400">click to autofill</span>
            </div>
            <div className="space-y-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => {
                    setIsRegister(false)
                    setEmail(acc.email)
                    setPassword("Password123!")
                    setError("")
                  }}
                  className="w-full flex items-center justify-between rounded-lg text-sm transition-colors hover:bg-slate-50 cursor-pointer"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    padding: "8px 12px",
                  }}
                >
                  <span style={{ color: "#475569", fontFamily: "var(--font-body)" }}>
                    {acc.label}
                  </span>
                  <span
                    className="rounded text-xs font-medium"
                    style={{
                      background: acc.role === "Admin" ? "#fef3c7" : "#dce8ff",
                      color: acc.role === "Admin" ? "#92400e" : "#1a3896",
                      fontFamily: "var(--font-mono)",
                      padding: "2px 8px",
                    }}
                  >
                    {acc.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
