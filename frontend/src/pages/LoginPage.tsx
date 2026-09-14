import { useState } from "react"
import type { User } from "../data/mock"
import { MOCK_USERS } from "../data/mock"
import { authApi } from "../api/services"
import captureImg from "../imports/Capture.PNG"

interface LoginPageProps {
  onLogin: (user: User) => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("sarah.chen@herocrm.com")
  const [password, setPassword] = useState("Password123!")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Email and password are required.")
      return
    }
    setLoading(true)
    try {
      const user = await authApi.login(email, password)
      onLogin(user)
    } catch (err: any) {
      // Fallback to mock users if API is offline or returns error
      const mockUser = MOCK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase())
      if (mockUser && password.length >= 8) {
        onLogin(mockUser)
      } else {
        setError(err?.message || "Invalid credentials. Please try again.")
        setLoading(false)
      }
    }
  }


  const demoAccounts = [
    { email: "sarah.chen@herocrm.com", role: "Admin", label: "Sarah Chen" },
    { email: "james.okafor@herocrm.com", role: "Developer", label: "James Okafor" },
    { email: "aisha.nwosu@herocrm.com", role: "Dept. User", label: "Aisha Nwosu" },
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
            Unified workspace for Hero teams — track projects, manage customers,
            monitor progress, and stay aligned.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "8+", label: "Active Projects" },
            { value: "6", label: "Developers" },
            { value: "7", label: "Customers" },
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
        className="w-full lg:w-[420px] flex items-center justify-center px-10 py-12"
        style={{ background: "#f8fafc" }}
      >
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2
              style={{
                fontFamily: "Doppio One, var(--font-display)",
                fontWeight: 700,
                fontSize: 26,
                color: "#0f172a",
                marginBottom: 8,
              }}
            >
              Sign in
            </h2>
            <p style={{ color: "#64748b", fontSize: 14 }}>
              Access your Hero CRM workspace
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                  padding: "12px 14px",
                }}
                placeholder="you@herocrm.com"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-2"
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
                  padding: "12px 14px",
                }}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl font-semibold text-sm transition-opacity"
              style={{
                background: "#1a3896",
                color: "white",
                fontFamily: "var(--font-display)",
                opacity: loading ? 0.7 : 1,
                padding: "11px 0",
                border: "1px solid white",
                marginTop: 12,
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div style={{ marginTop: 48, borderWidth: 1, borderColor: "white", borderStyle: "solid", borderRadius: 12, padding: "20px 18px" }}>
            <div
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#94a3b8", fontFamily: "var(--font-display)" }}
            >
              Demo accounts
            </div>
            <div className="space-y-3">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => {
                    setEmail(acc.email)
                    setPassword("Password123!")
                  }}
                  className="w-full flex items-center justify-between rounded-lg text-sm transition-colors"
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #e2e8f0",
                    padding: "10px 14px",
                  }}
                >
                  <span style={{ color: "#475569", fontFamily: "var(--font-body)" }}>
                    {acc.label}
                  </span>
                  <span
                    className="rounded text-xs font-medium"
                    style={{
                      background: "#dce8ff",
                      color: "#1a3896",
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
