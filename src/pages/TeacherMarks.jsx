import { useState, useEffect } from "react"
import { collection, getDocs, query, where, doc, setDoc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

// Fixed distribution as requested
const FIXED_TESTS = [
  { name: "Mid-Sem", max: 15 },
  { name: "Practical", max: 15 },
  { name: "CAP", max: 10 },
  { name: "End-Sem", max: 60 }
]

export default function TeacherMarks() {
  const { currentUser, userData } = useAuth()
  const [students, setStudents] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [savingCell, setSavingCell] = useState(null)

  const subjectCode = userData?.subjectCode || ""
  const classes = userData?.classes || []

  useEffect(() => {
    if (!subjectCode) { setLoading(false); return }
    setSelectedClass(classes[0] || null)
    fetchData()
  }, [subjectCode])

  const fetchData = async () => {
    try {
      const studSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")))
      setStudents(studSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      const marksSnap = await getDocs(query(collection(db, "marks"), where("subjectCode", "==", subjectCode)))
      const marksData = marksSnap.docs.map(d => ({ id: d.id, ...d.data() }))
      setMarks(marksData)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const studentsInClass = students.filter(s => s.class === selectedClass)

  const getScore = (studentId, testName) => {
    const m = marks.find(m => m.studentId === studentId && m.testName === testName)
    return m?.score ?? ""
  }

  const handleScoreChange = async (studentId, testName, maxScore, value) => {
    const score = value === "" ? null : parseFloat(value)
    if (score !== null && (score < 0 || score > maxScore)) {
      alert(`Score must be between 0 and ${maxScore}`)
      return
    }
    const cellKey = `${studentId}_${testName}`
    setSavingCell(cellKey)
    const docId = `${currentUser.uid}_${studentId}_${testName}`
    try {
      await setDoc(doc(db, "marks", docId), {
        teacherId: currentUser.uid,
        studentId,
        subjectCode,
        testName,
        score: score ?? 0,
        maxScore,
        date: new Date().toISOString().split("T")[0]
      })
      setMarks(prev => {
        const existing = prev.findIndex(m => m.studentId === studentId && m.testName === testName)
        const updated = { teacherId: currentUser.uid, studentId, subjectCode, testName, score: score ?? 0, maxScore, date: new Date().toISOString().split("T")[0] }
        if (existing >= 0) { const n = [...prev]; n[existing] = updated; return n }
        return [...prev, updated]
      })
    } catch (e) { console.error(e) }
    finally { setSavingCell(null) }
  }

  const getTotal = (studentId) => {
    const studentMarks = marks.filter(m => m.studentId === studentId && FIXED_TESTS.some(t => t.name === m.testName))
    if (!studentMarks.length) return { score: "-", max: "-", pct: 0 }
    const score = studentMarks.reduce((a, b) => a + (b.score || 0), 0)
    const max = FIXED_TESTS.reduce((a, b) => a + b.max, 0)
    return { score, max, pct: max ? Math.round((score / max) * 100) : 0 }
  }

  if (loading) return <Layout><div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>Loading...</div></Layout>

  if (!subjectCode) return (
    <Layout>
      <div style={styles.emptyState}>
        <p style={{ fontSize: "48px" }}>⚠️</p>
        <h3>No subject linked to your profile</h3>
        <p style={{ color: "#64748b" }}>Please re-register as a teacher with a subject code.</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h2 style={styles.heading}>Marks Management</h2>
          <p style={styles.sub}>Subject: <strong>{subjectCode}</strong> · Academic Distribution Mode</p>
        </div>
      </div>

      <div style={styles.distributionInfo}>
        <span style={styles.distBadge}>Mid-Sem: 15</span>
        <span style={styles.distBadge}>Practical: 15</span>
        <span style={styles.distBadge}>CAP: 10</span>
        <span style={styles.distBadge}>End-Sem: 60</span>
        <span style={{...styles.distBadge, background: "#f0fdfa", color: "#0d9488"}}>Total: 100</span>
      </div>

      {/* Class tabs */}
      <div style={styles.tabs}>
        {classes.map(cls => (
          <button key={cls} onClick={() => setSelectedClass(cls)}
            style={{ ...styles.tab, ...(selectedClass === cls ? styles.tabActive : {}) }}>
            {cls} Class
          </button>
        ))}
      </div>

      <div style={styles.tableWrap}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{ ...styles.th, ...styles.stickyCol, width: "200px" }}>Student</th>
              <th style={{ ...styles.th, width: "120px" }}>Roll No</th>
              {FIXED_TESTS.map(t => (
                <th key={t.name} style={styles.th}>
                  {t.name}<br /><span style={{ fontWeight: "400", fontSize: "11px", color: "#94a3b8" }}>/{t.max}</span>
                </th>
              ))}
              <th style={styles.th}>Total (100)</th>
            </tr>
          </thead>
          <tbody>
            {studentsInClass.length === 0 ? (
              <tr><td colSpan={FIXED_TESTS.length + 3} style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
                No students in {selectedClass} class.
              </td></tr>
            ) : studentsInClass.map(student => {
              const totals = getTotal(student.id)
              return (
                <tr key={student.id} style={styles.tr}>
                  <td style={{ ...styles.td, ...styles.stickyCol }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={styles.avatar}>{(student.name || student.email)?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: "500", color: "#1e293b", fontSize: "13px" }}>{student.name || student.email?.split("@")[0]}</span>
                    </div>
                  </td>
                  <td style={{ ...styles.td, color: "#64748b", fontSize: "12px" }}>{student.rollNo || "—"}</td>
                  {FIXED_TESTS.map(t => {
                    const cellKey = `${student.id}_${t.name}`
                    const isSaving = savingCell === cellKey
                    return (
                      <td key={t.name} style={styles.td}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          <input
                            type="number"
                            min="0"
                            max={t.max}
                            defaultValue={getScore(student.id, t.name)}
                            onBlur={e => handleScoreChange(student.id, t.name, t.max, e.target.value)}
                            style={{ ...styles.scoreInput, opacity: isSaving ? 0.5 : 1 }}
                          />
                          {isSaving && <span style={{ fontSize: "9px", color: "#0d9488", marginTop: "2px" }}>saving…</span>}
                        </div>
                      </td>
                    )
                  })}
                  <td style={styles.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{
                        fontWeight: "700", color: totals.pct < 40 ? "#dc2626" : "#0d9488",
                        fontSize: "14px"
                      }}>
                        {totals.score === "-" ? "0/100" : `${totals.score}/100`}
                      </span>
                      <div style={styles.miniProgress}>
                        <div style={{...styles.miniProgressFill, width: `${totals.pct}%`, background: totals.pct < 40 ? "#fecaca" : "#ccfbf1"}} />
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  heading: { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1e293b" },
  sub: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  distributionInfo: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" },
  distBadge: { padding: "4px 12px", borderRadius: "6px", background: "#f1f5f9", fontSize: "12px", fontWeight: "600", color: "#475569" },
  tabs: { display: "flex", gap: "8px", marginBottom: "16px" },
  tab: { padding: "8px 18px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontWeight: "500", fontSize: "13px" },
  tabActive: { background: "#0d9488", color: "#fff", border: "1.5px solid #0d9488" },
  tableWrap: { background: "#fff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: "800px" },
  th: { padding: "14px 16px", background: "#f8fafc", color: "#64748b", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", textAlign: "left" },
  stickyCol: { position: "sticky", left: 0, background: "#f8fafc", zIndex: 2, borderRight: "1px solid #e2e8f0" },
  tr: { borderBottom: "1px solid #f1f5f9" },
  td: { padding: "12px 16px", fontSize: "14px", color: "#334155" },
  scoreInput: { width: "50px", padding: "6px 4px", borderRadius: "6px", border: "1.5px solid #e2e8f0", fontSize: "13px", textAlign: "center", outline: "none" },
  avatar: { width: "28px", height: "28px", borderRadius: "50%", background: "#0d9488", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "11px", flexShrink: 0 },
  miniProgress: { width: "60px", height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" },
  miniProgressFill: { height: "100%", borderRadius: "3px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }
}
