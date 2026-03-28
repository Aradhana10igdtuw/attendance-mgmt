import { useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../firebase"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate("/dashboard")
    } catch {
      setError("Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Attendance Management</h2>
        <p style={styles.subtitle}>IGDTUW Portal</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: "100vh", display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "#f0f2f5"
  },
  card: {
    background: "#fff", padding: "40px",
    borderRadius: "12px", width: "100%", maxWidth: "400px",
    boxShadow: "0 2px 16px rgba(0,0,0,0.1)"
  },
  title: { margin: 0, fontSize: "22px", color: "#1a1a2e" },
  subtitle: { color: "#666", marginBottom: "24px", marginTop: "4px" },
  form: { display: "flex", flexDirection: "column", gap: "12px" },
  input: {
    padding: "12px", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "14px", outline: "none"
  },
  button: {
    padding: "12px", borderRadius: "8px", border: "none",
    background: "#4f46e5", color: "#fff",
    fontSize: "15px", cursor: "pointer", fontWeight: "500"
  },
  error: { color: "#e24b4a", fontSize: "13px", margin: 0 }
}