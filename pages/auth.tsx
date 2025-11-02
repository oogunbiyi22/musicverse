import { useState } from "react"
import Link from "next/link"
import { supabase } from "@/utils/supabase"

export default function AuthPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLogin, setIsLogin] = useState(true)
  const [message, setMessage] = useState("")

  const handleAuth = async (e: any) => {
    e.preventDefault()
    setMessage("")

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setMessage(error ? error.message : "✅ Logged in successfully!")
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      setMessage(error ? error.message : "✅ Check your email for verification link.")
    }
  }

  return (
    <div style={{ padding: 30, maxWidth: 400, margin: "auto" }}>
      <h1>{isLogin ? "Login" : "Sign Up"}</h1>
      <form onSubmit={handleAuth}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ display: "block", margin: "10px 0", padding: 8, width: "100%" }}
        />
        <button type="submit" style={{ padding: 10, width: "100%" }}>
          {isLogin ? "Login" : "Sign Up"}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <span
          onClick={() => setIsLogin(!isLogin)}
          style={{ color: "blue", cursor: "pointer" }}
        >
          {isLogin ? "Sign up" : "Login"}
        </span>
      </p>

      <p style={{ marginTop: 8 }}>
        Prefer a dedicated page? <Link href="/signup" style={{ color: "blue", textDecoration: "underline" }}>Sign up</Link>
      </p>

      {message && <p style={{ marginTop: 10 }}>{message}</p>}

      <button
        onClick={async () => {
          setMessage('')
          try {
            const { data, error } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/profile` : undefined,
                queryParams: { prompt: 'select_account' }
              }
            })
            if (error) {
              setMessage(error.message)
              return
            }
            if (data?.url && typeof window !== 'undefined') {
              window.location.href = data.url
            }
          } catch (e: any) {
            setMessage(e.message || 'Google sign-in failed')
          }
        }}
        style={{ marginTop: 12, padding: 10, width: '100%', border: '1px solid #e5e7eb', borderRadius: 6 }}
      >
        Continue with Google
      </button>
    </div>
  )
}
