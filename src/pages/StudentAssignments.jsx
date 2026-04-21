import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function StudentAssignments() {
  const { userData } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userData?.class) {
      fetchAssignments()
    } else {
      setLoading(false)
    }
  }, [userData?.class])

  const fetchAssignments = async () => {
    try {
      const q = query(
        collection(db, "assignments"),
        where("classes", "array-contains", userData.class),
        orderBy("deadline", "asc")
      )
      const snap = await getDocs(q)
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getStatus = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: "Completed/Passed", color: "#64748b", bg: "#f1f5f9" }
    if (diff === 0) return { label: "Due Today", color: "#d97706", bg: "#fffbeb" }
    return { label: `Due in ${diff} days`, color: "#16a34a", bg: "#f0fdf4" }
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.heading}>Assignments & Notes</h2>
        <p style={styles.sub}>Check your upcoming tasks and study materials for {userData?.class || "your class"}</p>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading assignments...</div>
      ) : assignments.length === 0 ? (
        <div style={styles.empty}>
          <p style={{fontSize: "48px"}}>📚</p>
          <h3>Nothing to show here</h3>
          <p>Your teachers haven't posted any assignments or notes for {userData?.class} yet.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {assignments.map(a => {
            const status = getStatus(a.deadline)
            return (
              <div key={a.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={{flex: 1}}>
                    <h4 style={styles.title}>{a.title}</h4>
                    <span style={styles.subjectTag}>{a.subjectCode}</span>
                  </div>
                  <div style={{...styles.status, color: status.color, background: status.bg}}>
                    {status.label}
                  </div>
                </div>

                {a.notes && <p style={styles.notes}>{a.notes}</p>}

                {a.attachmentUrl && (
                  <a href={a.attachmentUrl} target="_blank" rel="noreferrer" style={styles.attachment}>
                    📄 View Attachment
                  </a>
                )}

                <div style={styles.footer}>
                  <div style={styles.meta}>
                    <span style={styles.icon}>📅</span>
                    <span>Deadline: <strong>{new Date(a.deadline).toLocaleDateString()}</strong></span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Layout>
  )
}

const styles = {
  header: { marginBottom: "32px" },
  heading: { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1e293b" },
  sub: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "20px" },
  card: { background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", display: "flex", flexDirection: "column" },
  cardHeader: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "16px" },
  title: { margin: "0 0 6px", fontSize: "17px", fontWeight: "700", color: "#1e293b" },
  subjectTag: { background: "#f0fdfa", color: "#0d9488", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "700" },
  status: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600" },
  notes: { margin: "0 0 16px", fontSize: "13px", color: "#475569", lineHeight: "1.6" },
  attachment: { display: "inline-block", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", color: "#0d9488", fontWeight: "600", fontSize: "13px", textDecoration: "none", marginBottom: "16px", border: "1px solid #e2e8f0" },
  footer: { marginTop: "auto", paddingTop: "16px", borderTop: "1px solid #f8fafc" },
  meta: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b" },
  icon: { fontSize: "14px" },
  loading: { textAlign: "center", padding: "80px", color: "#94a3b8" },
  empty: { textAlign: "center", padding: "100px 20px", color: "#94a3b8", background: "#fff", borderRadius: "20px" }
}
