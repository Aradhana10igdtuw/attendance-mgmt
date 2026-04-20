import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function Attendance() {
  const { currentUser } = useAuth()
  const [subjects, setSubjects] = useState([])
  const [attendanceMap, setAttendanceMap] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const subSnap = await getDocs(collection(db, "subjects"))
      const subList = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setSubjects(subList)

      const attQ = query(
        collection(db, "attendance"),
        where("studentId", "==", currentUser.email)
      )
      const attSnap = await getDocs(attQ)
      const records = attSnap.docs.map((d) => d.data())

      const map = {}
      subList.forEach((s) => {
        const subRecords = records.filter((r) => r.subjectCode === s.code)
        const total = subRecords.length
        const attended = subRecords.filter((r) => r.present).length
        const percentage = total === 0 ? 0 : Math.round((attended / total) * 100)
        map[s.code] = { total, attended, percentage, records: subRecords }
      })
      setAttendanceMap(map)
    } catch (err) {
      console.error("Error fetching data:", err)
    } finally {
      setLoading(false)
    }
  }

  const getColor = (pct) => {
    if (pct >= 75) return "#0f6e56"
    if (pct >= 60) return "#854f0b"
    return "#a32d2d"
  }

  const getBg = (pct) => {
    if (pct >= 75) return "#e1f5ee"
    if (pct >= 60) return "#faeeda"
    return "#fcebeb"
  }

  if (loading) return (
    <Layout>
      <p style={{ color: "#666" }}>Loading attendance...</p>
    </Layout>
  )

  return (
    <Layout>
      <h2 style={styles.heading}>Attendance</h2>
      <p style={styles.sub}>Your subject-wise attendance summary</p>

      {Object.values(attendanceMap).some((a) => a.percentage < 75 && a.total > 0) && (
        <div style={styles.warning}>
          You have subjects below 75% attendance. Risk of detainment!
        </div>
      )}

      <div style={styles.grid}>
        {subjects.map((sub) => {
          const att = attendanceMap[sub.code] || { total: 0, attended: 0, percentage: 0 }
          return (
            <div key={sub.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div>
                  <p style={styles.subjectName}>{sub.name}</p>
                  <p style={styles.subjectCode}>{sub.code} · {sub.teacher}</p>
                </div>
                <div style={{
                  ...styles.badge,
                  background: getBg(att.percentage),
                  color: getColor(att.percentage)
                }}>
                  {att.percentage}%
                </div>
              </div>

              <div style={styles.progressBg}>
                <div style={{
                  ...styles.progressFill,
                  width: `${att.percentage}%`,
                  background: getColor(att.percentage)
                }} />
              </div>

              <div style={styles.statsRow}>
                <span style={styles.stat}>Attended: <strong>{att.attended}</strong></span>
                <span style={styles.stat}>Total: <strong>{att.total}</strong></span>
                <span style={styles.stat}>Missed: <strong>{att.total - att.attended}</strong></span>
              </div>

              {att.percentage < 75 && att.total > 0 && (
                <p style={styles.alert}>
                  Need {Math.ceil((0.75 * att.total - att.attended) / 0.25)} more classes to reach 75%
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div style={styles.tableCard}>
        <h3 style={styles.tableTitle}>Detailed records</h3>
        <table style={styles.table}>
          <thead>
            <tr>
              {["Subject", "Date", "Status"].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {subjects.flatMap((sub) =>
              (attendanceMap[sub.code]?.records || [])
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((r, i) => (
                  <tr key={`${sub.code}-${i}`} style={styles.tr}>
                    <td style={styles.td}>{sub.name}</td>
                    <td style={styles.td}>{r.date}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        background: r.present ? "#e1f5ee" : "#fcebeb",
                        color: r.present ? "#0f6e56" : "#a32d2d"
                      }}>
                        {r.present ? "Present" : "Absent"}
                      </span>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

const styles = {
  heading: { margin: 0, fontSize: "24px", color: "#1a1a2e" },
  sub: { color: "#666", marginTop: "4px", marginBottom: "24px" },
  warning: {
    background: "#fcebeb", color: "#a32d2d", padding: "12px 16px",
    borderRadius: "8px", marginBottom: "24px", fontSize: "14px",
    border: "1px solid #f09595"
  },
  grid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "24px" },
  card: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" },
  subjectName: { margin: 0, fontSize: "15px", fontWeight: "500", color: "#1a1a2e" },
  subjectCode: { margin: "4px 0 0", fontSize: "12px", color: "#888" },
  badge: { fontSize: "18px", fontWeight: "600", padding: "6px 12px", borderRadius: "8px" },
  progressBg: { height: "6px", background: "#f0f0f0", borderRadius: "3px", marginBottom: "12px" },
  progressFill: { height: "6px", borderRadius: "3px", transition: "width 0.3s" },
  statsRow: { display: "flex", gap: "16px" },
  stat: { fontSize: "13px", color: "#666" },
  alert: { margin: "12px 0 0", fontSize: "12px", color: "#a32d2d", background: "#fcebeb", padding: "6px 10px", borderRadius: "6px" },
  tableCard: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  tableTitle: { margin: "0 0 16px", fontSize: "16px", color: "#1a1a2e" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 12px", fontSize: "12px", color: "#888", borderBottom: "1px solid #f0f0f0" },
  tr: { borderBottom: "1px solid #f5f5f5" },
  td: { padding: "12px", fontSize: "14px", color: "#444" },
  statusBadge: { padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "500" }
}