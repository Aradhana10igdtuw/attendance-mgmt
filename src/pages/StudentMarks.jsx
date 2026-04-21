import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function StudentMarks() {
  const { currentUser, userData } = useAuth()
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)

  const FIXED_TESTS = ["Mid-Sem", "Practical", "CAP", "End-Sem"]

  useEffect(() => {
    fetchMarks()
  }, [currentUser.uid])

  const fetchMarks = async () => {
    try {
      const q = query(collection(db, "marks"), where("studentId", "==", currentUser.uid))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => d.data())
      
      // Group marks by subjectCode
      const grouped = data.reduce((acc, curr) => {
        if (!acc[curr.subjectCode]) {
          acc[curr.subjectCode] = {
            subjectCode: curr.subjectCode,
            scores: {},
            total: 0,
            maxTotal: 100 // Based on our fixed distribution
          }
        }
        acc[curr.subjectCode].scores[curr.testName] = curr.score
        acc[curr.subjectCode].total += (curr.score || 0)
        return acc
      }, {})

      setMarks(Object.values(grouped))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div style={styles.header}>
        <h2 style={styles.heading}>Your Academic Marks</h2>
        <p style={styles.sub}>Track your performance across all subjects ({userData?.class || "General"})</p>
      </div>

      <div style={styles.tableWrap}>
        {loading ? (
          <div style={styles.empty}>Loading marks...</div>
        ) : marks.length === 0 ? (
          <div style={styles.empty}>
            <p style={{fontSize: "40px"}}>📊</p>
            <p>No marks have been uploaded for you yet.</p>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Subject</th>
                {FIXED_TESTS.map(t => (
                  <th key={t} style={styles.th}>{t}</th>
                ))}
                <th style={styles.th}>Total (100)</th>
                <th style={styles.th}>Status</th>
              </tr>
            </thead>
            <tbody>
              {marks.map(m => (
                <tr key={m.subjectCode} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.subjectTag}>{m.subjectCode}</span>
                  </td>
                  {FIXED_TESTS.map(t => (
                    <td key={t} style={styles.td}>
                      {m.scores[t] !== undefined ? m.scores[t] : "—"}
                    </td>
                  ))}
                  <td style={styles.td}>
                    <strong style={{fontSize: "16px"}}>{m.total}</strong>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.progressContainer}>
                      <div style={{...styles.progressBar, width: `${m.total}%`, background: m.total < 40 ? "#ef4444" : "#10b981"}} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

const styles = {
  header: { marginBottom: "24px" },
  heading: { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1e293b" },
  sub: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  tableWrap: { background: "#fff", borderRadius: "16px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "16px", background: "#f8fafc", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", borderBottom: "1px solid #f1f5f9", textAlign: "left" },
  tr: { borderBottom: "1px solid #f8fafc" },
  td: { padding: "16px", fontSize: "14px", color: "#334155" },
  subjectTag: { background: "#f0fdfa", color: "#0d9488", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "12px" },
  progressContainer: { width: "100px", height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" },
  progressBar: { height: "100%", transition: "width 0.4s ease" },
  empty: { textAlign: "center", padding: "60px", color: "#94a3b8" }
}
