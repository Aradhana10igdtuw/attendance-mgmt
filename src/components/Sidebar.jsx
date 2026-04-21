import { useNavigate, useLocation } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../firebase"
import { useAuth } from "../hooks/useAuth"

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Attendance", path: "/attendance", studentOnly: true },
  { label: "Students Data", path: "/students-data", teacherOnly: true },
  { label: "Marks", path: "/marks" },
  { label: "Assignments", path: "/assignments" },
  { label: "Notifications", path: "/notifications" },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, userData } = useAuth()

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  return (
    <div style={styles.sidebar}>
      <div>
        <div style={styles.brand}>
          <p style={styles.brandTitle}>IGDTUW Portal</p>
          <p style={styles.brandSub}>Attendance System</p>
        </div>

        <div style={styles.userBox}>
          <div style={styles.avatar}>
            {currentUser?.email?.[0]?.toUpperCase()}
          </div>
          <p style={styles.userEmail}>{currentUser?.email}</p>
        </div>

        <nav>
          {navItems
            .filter(item => {
              if (item.teacherOnly && userData?.role !== "teacher") return false
              if (item.studentOnly && userData?.role !== "student") return false
              return true
            })
            .map((item) => (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                ...(location.pathname === item.path ? styles.navActive : {})
              }}
            >
              {item.label}
            </div>
          ))}
        </nav>
      </div>

      <button onClick={handleLogout} style={styles.logoutBtn}>
        Logout
      </button>
    </div>
  )
}

const styles = {
  sidebar: {
    width: "240px", minHeight: "100vh",
    background: "#1a1a2e", color: "#fff",
    display: "flex", flexDirection: "column",
    justifyContent: "space-between", padding: "24px 16px",
    position: "fixed", top: 0, left: 0,
  },
  brand: { marginBottom: "24px", paddingLeft: "8px" },
  brandTitle: { margin: 0, fontSize: "16px", fontWeight: "600", color: "#fff" },
  brandSub: { margin: "4px 0 0", fontSize: "12px", color: "#8888aa" },
  userBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#2a2a4a", borderRadius: "8px",
    padding: "10px 12px", marginBottom: "24px"
  },
  avatar: {
    width: "32px", height: "32px", borderRadius: "50%",
    background: "#0d9488", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: "14px", fontWeight: "600", flexShrink: 0
  },
  userEmail: {
    margin: 0, fontSize: "12px", color: "#ccc",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
  },
  navItem: {
    padding: "10px 12px", borderRadius: "8px",
    cursor: "pointer", fontSize: "14px", color: "#aaa",
    marginBottom: "4px", transition: "all 0.2s"
  },
  navActive: {
    background: "#0d9488", color: "#fff", fontWeight: "500"
  },
  logoutBtn: {
    padding: "10px", borderRadius: "8px", border: "none",
    background: "#3a1a1a", color: "#e24b4a",
    fontSize: "14px", cursor: "pointer", width: "100%"
  }
}