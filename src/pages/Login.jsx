import { useState } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { useNavigate } from "react-router-dom"

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        navigate("/dashboard")
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: role
        })
        navigate("/dashboard")
      }
    } catch (err) {
      setError(err.message || "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Attendance Management</h2>
        <p style={styles.subtitle}>{isLogin ? "Login to Portal" : "Sign Up for Portal"}</p>

        <form onSubmit={handleSubmit} style={styles.form}>
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
            minLength={6}
          />
          
          {!isLogin && (
            <div style={styles.roleContainer}>
              <label style={styles.radioLabel}>
                <input 
                  type="radio" 
                  value="student" 
                  checked={role === "student"} 
                  onChange={(e) => setRole(e.target.value)} 
                /> Student
              </label>
              <label style={styles.radioLabel}>
                <input 
                  type="radio" 
                  value="teacher" 
                  checked={role === "teacher"} 
                  onChange={(e) => setRole(e.target.value)} 
                /> Teacher
              </label>
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}
          <button style={styles.button} type="submit" disabled={loading}>
            {loading ? (isLogin ? "Logging in..." : "Signing up...") : (isLogin ? "Login" : "Sign Up")}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={styles.toggleLink} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign up" : "Login"}
          </span>
        </p>
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
  roleContainer: { display: "flex", gap: "16px", margin: "4px 0" },
  radioLabel: { fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" },
  button: {
    padding: "12px", borderRadius: "8px", border: "none",
    background: "#4f46e5", color: "#fff",
    fontSize: "15px", cursor: "pointer", fontWeight: "500"
  },
  error: { color: "#e24b4a", fontSize: "13px", margin: 0 },
  toggleText: { marginTop: "16px", fontSize: "14px", textAlign: "center", color: "#666" },
  toggleLink: { color: "#4f46e5", cursor: "pointer", fontWeight: "500", textDecoration: "underline" }
}