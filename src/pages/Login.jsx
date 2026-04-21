import { useState } from "react"
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { auth, db } from "../firebase"
import { useNavigate } from "react-router-dom"

const CLASS_OPTIONS = ["IT1", "IT2", "IT3", "CSE1", "CSE2", "ECE1", "ECE2"]

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("student")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Teacher-specific fields
  const [subjectCode, setSubjectCode] = useState("")
  const [teacherClasses, setTeacherClasses] = useState([])

  // Student-specific fields
  const [rollNo, setRollNo] = useState("")
  const [studentClass, setStudentClass] = useState("IT1")

  const toggleClass = (cls) => {
    setTeacherClasses(prev =>
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (!isLogin && role === "teacher" && teacherClasses.length === 0) {
      setError("Please select at least one class you teach.")
      setLoading(false)
      return
    }
    if (!isLogin && role === "teacher" && !subjectCode.trim()) {
      setError("Please enter your subject code.")
      setLoading(false)
      return
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
        navigate("/dashboard")
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user
        const userData = { email: user.email, role }
        if (role === "teacher") {
          userData.subjectCode = subjectCode.trim().toUpperCase()
          userData.classes = teacherClasses
        } else {
          userData.rollNo = rollNo.trim()
          userData.class = studentClass
        }
        await setDoc(doc(db, "users", user.uid), userData)
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
        <div style={styles.logoArea}>
          <div style={styles.logoCircle}>🎓</div>
          <h2 style={styles.title}>IGDTUW Portal</h2>
          <p style={styles.subtitle}>{isLogin ? "Sign in to continue" : "Create your account"}</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>College Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="yourname@igdtuw.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>I am a</label>
                <div style={styles.roleRow}>
                  {["student", "teacher"].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      style={{
                        ...styles.roleBtn,
                        ...(role === r ? styles.roleBtnActive : {})
                      }}
                    >
                      {r === "student" ? "🎓 Student" : "📚 Teacher"}
                    </button>
                  ))}
                </div>
              </div>

              {role === "teacher" && (
                <>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Subject Code <span style={styles.hint}>(e.g. BIT208)</span></label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. BIT208"
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value)}
                      required
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Classes You Teach <span style={styles.hint}>(select all that apply)</span></label>
                    <div style={styles.classGrid}>
                      {CLASS_OPTIONS.map(cls => (
                        <button
                          key={cls}
                          type="button"
                          onClick={() => toggleClass(cls)}
                          style={{
                            ...styles.classChip,
                            ...(teacherClasses.includes(cls) ? styles.classChipActive : {})
                          }}
                        >
                          {cls}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {role === "student" && (
                <>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Roll Number</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="e.g. 22BIT001"
                      value={rollNo}
                      onChange={(e) => setRollNo(e.target.value)}
                    />
                  </div>
                  <div style={styles.fieldGroup}>
                    <label style={styles.label}>Your Class</label>
                    <select
                      style={styles.input}
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                    >
                      {CLASS_OPTIONS.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.button} type="submit" disabled={loading}>
            {loading
              ? (isLogin ? "Signing in..." : "Creating account...")
              : (isLogin ? "Sign In" : "Create Account")}
          </button>
        </form>

        <p style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={styles.toggleLink} onClick={() => { setIsLogin(!isLogin); setError("") }}>
            {isLogin ? "Sign up" : "Sign in"}
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
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
  },
  card: {
    background: "#fff", padding: "40px",
    borderRadius: "20px", width: "100%", maxWidth: "440px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
  },
  logoArea: { textAlign: "center", marginBottom: "28px" },
  logoCircle: { fontSize: "36px", marginBottom: "8px" },
  title: { margin: 0, fontSize: "24px", fontWeight: "700", color: "#1a1a2e" },
  subtitle: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  hint: { fontSize: "11px", fontWeight: "400", color: "#9ca3af" },
  input: {
    padding: "11px 14px", borderRadius: "10px",
    border: "1.5px solid #e5e7eb", fontSize: "14px",
    outline: "none", transition: "border 0.2s",
    color: "#1a1a2e"
  },
  roleRow: { display: "flex", gap: "10px" },
  roleBtn: {
    flex: 1, padding: "10px", border: "1.5px solid #e5e7eb",
    borderRadius: "10px", cursor: "pointer", fontSize: "13px",
    fontWeight: "500", background: "#f8fafc", color: "#475569",
    transition: "all 0.2s"
  },
  roleBtnActive: {
    border: "1.5px solid #0d9488", background: "#f0fdfa", color: "#0d9488"
  },
  classGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  classChip: {
    padding: "6px 14px", borderRadius: "20px", border: "1.5px solid #e5e7eb",
    background: "#f8fafc", color: "#64748b", cursor: "pointer",
    fontSize: "13px", fontWeight: "500", transition: "all 0.2s"
  },
  classChipActive: {
    border: "1.5px solid #0d9488", background: "#f0fdfa", color: "#0d9488"
  },
  button: {
    padding: "13px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #0d9488, #0f766e)",
    color: "#fff", fontSize: "15px", cursor: "pointer",
    fontWeight: "600", marginTop: "4px", letterSpacing: "0.3px"
  },
  error: { color: "#dc2626", fontSize: "13px", margin: 0, background: "#fef2f2", padding: "8px 12px", borderRadius: "8px" },
  toggleText: { marginTop: "20px", fontSize: "14px", textAlign: "center", color: "#6b7280" },
  toggleLink: { color: "#0d9488", cursor: "pointer", fontWeight: "600" }
}