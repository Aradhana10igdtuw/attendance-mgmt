import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function Notifications() {
  const { userData } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userData?.class && userData?.role === "student") {
      setLoading(false)
      return
    }
    fetchNotifications()
  }, [userData])

  const fetchNotifications = async () => {
    try {
      let q;
      if (userData.role === "teacher") {
        // Teachers see notifications they sent or general ones
        q = query(
          collection(db, "notifications"),
          orderBy("createdAt", "desc"),
          limit(50)
        )
      } else {
        // Students see notifications for their specific class
        q = query(
          collection(db, "notifications"),
          where("targetClass", "==", userData.class),
          orderBy("createdAt", "desc"),
          limit(50)
        )
      }
      
      const snap = await getDocs(q)
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error("Error fetching notifications:", e)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type) => {
    switch (type) {
      case "assignment": return "📝"
      case "warning": return "⚠️"
      case "info": return "ℹ️"
      default: return "🔔"
    }
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.heading}>Notifications</h2>
        <p style={styles.sub}>Stay updated with recent academic activities</p>
      </div>

      <div style={styles.list}>
        {loading ? (
          <div style={styles.empty}>Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div style={styles.empty}>
            <p style={{fontSize: "40px"}}>📭</p>
            <p>No notifications for your class yet.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div key={n.id} style={styles.item}>
              <div style={{...styles.iconBox, background: n.type === 'assignment' ? '#f0fdfa' : '#fff7ed'}}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <p style={styles.message}>{n.message}</p>
                <div style={styles.meta}>
                  <span style={styles.tag}>{n.subjectCode}</span>
                  <span style={styles.time}>{new Date(n.createdAt).toLocaleString()}</span>
                  {n.teacherName && <span style={styles.teacher}>• {n.teacherName}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  )
}

const styles = {
  header: { marginBottom: "24px" },
  heading: { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1e293b" },
  sub: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  item: { 
    background: "#fff", padding: "16px", borderRadius: "12px", 
    display: "flex", gap: "16px", alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9"
  },
  iconBox: { 
    width: "44px", height: "44px", borderRadius: "10px", 
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px"
  },
  message: { margin: "0 0 6px", fontSize: "14px", fontWeight: "500", color: "#334155" },
  meta: { display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#94a3b8" },
  tag: { background: "#f0fdfa", padding: "2px 8px", borderRadius: "4px", color: "#0d9488", fontWeight: "600", fontSize: "10px" },
  time: { fontStyle: "italic" },
  teacher: { color: "#0d9488", fontWeight: "500" },
  empty: { textAlign: "center", padding: "60px", color: "#94a3b8", background: "#fff", borderRadius: "16px" }
}
