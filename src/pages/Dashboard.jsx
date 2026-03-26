import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom"

export default function Dashboard() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut(auth)
    navigate("/")
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard</h1>
      <p>Welcome! You are logged in.</p>
      <button onClick={handleLogout} style={{
        marginTop: "20px", padding: "10px 20px",
        background: "#e24b4a", color: "#fff",
        border: "none", borderRadius: "8px", cursor: "pointer"
      }}>
        Logout
      </button>
    </div>
  )
}