import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function StudentsData() {
  const { userData } = useAuth()
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState(null)
  const [selectedStudent, setSelectedStudent] = useState(null)

  const teacherSubject = userData?.subjectCode || ""
  const teacherClasses = userData?.classes || []

  useEffect(() => {
    if (!teacherSubject) { setLoading(false); return }
    setSelectedClass(teacherClasses[0] || null)
    const fetchData = async () => {
      try {
        const studentsSnap = await getDocs(query(collection(db, "users"), where("role", "==", "student")))
        const studentsList = studentsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        setStudents(studentsList)

        const attSnap = await getDocs(query(collection(db, "attendance"), where("subjectCode", "==", teacherSubject)))
        setAttendance(attSnap.docs.map(d => d.data()))

        const marksSnap = await getDocs(query(collection(db, "marks"), where("subjectCode", "==", teacherSubject)))
        setMarks(marksSnap.docs.map(d => d.data()))
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [teacherSubject])

  const studentsInClass = students.filter(s => s.class === selectedClass)

  const getAttendance = (studentId) => {
    const recs = attendance.filter(a => a.studentId === studentId)
    const total = recs.length
    const present = recs.filter(r => r.present).length
    return { total, present, pct: total === 0 ? 0 : Math.round((present / total) * 100), recs }
  }

  const getMarks = (studentId) => marks.filter(m => m.studentId === studentId)

  const getTotalScore = (studentId) => {
    const m = getMarks(studentId)
    if (!m.length) return null
    const score = m.reduce((a, b) => a + (b.score || 0), 0)
    const max = m.reduce((a, b) => a + (b.maxScore || 0), 0)
    return { score, max, pct: max ? Math.round((score / max) * 100) : 0 }
  }

  if (loading) return <Layout><div style={{ padding: "60px", textAlign: "center", color: "#64748b" }}>Loading...</div></Layout>

  if (!teacherSubject) return (
    <Layout>
      <div style={styles.emptyState}>
        <p style={{ fontSize: "48px" }}>⚠️</p>
        <h3>No subject linked to your profile</h3>
        <p style={{ color: "#64748b" }}>Your account doesn't have a subject code. Please re-register as a teacher.</p>
      </div>
    </Layout>
  )

  return (
    <Layout>
      <div style={styles.pageHeader}>
        <div>
          <h2 style={styles.heading}>Students Data</h2>
          <p style={styles.sub}>Subject: <strong>{teacherSubject}</strong> · {studentsInClass.length} students in selected class</p>
        </div>
      </div>

      {/* Class tabs */}
      {teacherClasses.length > 0 && (
        <div style={styles.tabs}>
          {teacherClasses.map(cls => (
            <button
              key={cls}
              onClick={() => { setSelectedClass(cls); setSelectedStudent(null) }}
              style={{ ...styles.tab, ...(selectedClass === cls ? styles.tabActive : {}) }}
            >
              {cls} Class
            </button>
          ))}
        </div>
      )}

      <div style={styles.layout}>
        {/* Student list */}
        <div style={styles.listPane}>
          {studentsInClass.length === 0 ? (
            <div style={styles.emptyList}>No students found in {selectedClass} class.</div>
          ) : studentsInClass.map(student => {
            const att = getAttendance(student.id)
            const isSelected = selectedStudent?.id === student.id
            return (
              <div
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                style={{ ...styles.studentRow, ...(isSelected ? styles.studentRowActive : {}) }}
              >
                <div style={styles.avatar}>{(student.name || student.email)?.[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <p style={styles.studentName}>{student.name || student.email?.split("@")[0]}</p>
                  <p style={styles.studentMeta}>{student.rollNo || "No roll no"} · {att.pct}% attendance</p>
                </div>
                <span style={{
                  ...styles.statusDot,
                  background: att.pct < 75 ? "#fee2e2" : "#dcfce7",
                  color: att.pct < 75 ? "#991b1b" : "#166534"
                }}>
                  {att.pct < 75 ? "⚠ Risk" : "✓ Good"}
                </span>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        <div style={styles.detailPane}>
          {!selectedStudent ? (
            <div style={styles.selectHint}>
              <p style={{ fontSize: "40px" }}>👈</p>
              <p style={{ color: "#94a3b8" }}>Select a student to view their details</p>
            </div>
          ) : (() => {
            const att = getAttendance(selectedStudent.id)
            const studentMarks = getMarks(selectedStudent.id)
            const totals = getTotalScore(selectedStudent.id)
            return (
              <div>
                {/* Student header */}
                <div style={styles.detailHeader}>
                  <div style={styles.detailAvatar}>{(selectedStudent.name || selectedStudent.email)?.[0]?.toUpperCase()}</div>
                  <div>
                    <h3 style={{ margin: 0, color: "#1e293b" }}>{selectedStudent.name || selectedStudent.email?.split("@")[0]}</h3>
                    <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: "13px" }}>
                      {selectedStudent.email} · Roll: {selectedStudent.rollNo || "N/A"}
                    </p>
                  </div>
                  <span style={{
                    ...styles.bigStatus,
                    background: att.pct < 75 ? "#fef2f2" : "#f0fdf4",
                    color: att.pct < 75 ? "#dc2626" : "#16a34a",
                    border: `1px solid ${att.pct < 75 ? "#fecaca" : "#bbf7d0"}`
                  }}>
                    {att.pct < 75 ? "⚠ At Risk" : "✓ Good Standing"}
                  </span>
                </div>

                {/* Attendance stats */}
                <div style={styles.statsRow}>
                  {[
                    { label: "Attended", val: att.present, color: "#16a34a", bg: "#f0fdf4" },
                    { label: "Total Classes", val: att.total, color: "#2563eb", bg: "#eff6ff" },
                    { label: "Attendance %", val: `${att.pct}%`, color: att.pct < 75 ? "#dc2626" : "#16a34a", bg: att.pct < 75 ? "#fef2f2" : "#f0fdf4" },
                    { label: "Missed", val: att.total - att.present, color: "#dc2626", bg: "#fef2f2" }
                  ].map(s => (
                    <div key={s.label} style={{ ...styles.statBox, background: s.bg }}>
                      <p style={{ ...styles.statVal, color: s.color }}>{s.val}</p>
                      <p style={styles.statLabel}>{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Attendance progress bar */}
                <div style={styles.attSection}>
                  <p style={styles.sectionLabel}>Attendance Progress</p>
                  <div style={styles.progBg}>
                    <div style={{ ...styles.progFill, width: `${att.pct}%`, background: att.pct < 75 ? "#ef4444" : "#10b981" }} />
                  </div>
                  {att.pct < 75 && (
                    <p style={styles.riskNote}>
                      Needs {Math.ceil((0.75 * att.total - att.present) / 0.25)} more classes to reach 75%
                    </p>
                  )}
                </div>

                {/* Attendance records */}
                {att.recs.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <p style={styles.sectionLabel}>Recent Attendance Records</p>
                    <div style={styles.recordGrid}>
                      {att.recs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map((r, i) => (
                        <div key={i} style={{
                          ...styles.recordChip,
                          background: r.present ? "#f0fdf4" : "#fef2f2",
                          color: r.present ? "#16a34a" : "#dc2626"
                        }}>
                          {r.date} · {r.present ? "P" : "A"}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Marks */}
                <div>
                  <p style={styles.sectionLabel}>Test Scores — {teacherSubject}</p>
                  {studentMarks.length === 0 ? (
                    <p style={{ color: "#94a3b8", fontSize: "13px" }}>No marks recorded yet.</p>
                  ) : (
                    <>
                      <div style={styles.marksGrid}>
                        {studentMarks.map((m, i) => (
                          <div key={i} style={styles.markCard}>
                            <p style={styles.testName}>{m.testName}</p>
                            <p style={styles.testScore}>{m.score}<span style={{ fontSize: "13px", color: "#94a3b8" }}>/{m.maxScore}</span></p>
                            <p style={styles.testDate}>{m.date}</p>
                          </div>
                        ))}
                      </div>
                      {totals && (
                        <div style={styles.totalScore}>
                          Total: <strong>{totals.score}/{totals.max}</strong> ({totals.pct}%)
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" },
  heading: { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1e293b" },
  sub: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  tabs: { display: "flex", gap: "8px", marginBottom: "20px" },
  tab: { padding: "8px 18px", borderRadius: "8px", border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontWeight: "500", fontSize: "13px" },
  tabActive: { background: "#4f46e5", color: "#fff", border: "1.5px solid #4f46e5" },
  layout: { display: "grid", gridTemplateColumns: "300px 1fr", gap: "16px", alignItems: "start" },
  listPane: { background: "#fff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", overflow: "hidden" },
  studentRow: { display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", borderBottom: "1px solid #f1f5f9", transition: "background 0.15s" },
  studentRowActive: { background: "#eef2ff" },
  avatar: { width: "36px", height: "36px", borderRadius: "50%", background: "#4f46e5", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "14px", flexShrink: 0 },
  studentName: { margin: 0, fontSize: "14px", fontWeight: "500", color: "#1e293b" },
  studentMeta: { margin: "2px 0 0", fontSize: "11px", color: "#94a3b8" },
  statusDot: { fontSize: "11px", fontWeight: "600", padding: "3px 8px", borderRadius: "10px", whiteSpace: "nowrap" },
  emptyList: { padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: "14px" },
  detailPane: { background: "#fff", borderRadius: "14px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", padding: "24px", minHeight: "400px" },
  selectHint: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "300px", color: "#94a3b8" },
  detailHeader: { display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", flexWrap: "wrap" },
  detailAvatar: { width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "20px", flexShrink: 0 },
  bigStatus: { marginLeft: "auto", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "600" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" },
  statBox: { padding: "12px", borderRadius: "10px", textAlign: "center" },
  statVal: { margin: 0, fontSize: "22px", fontWeight: "700" },
  statLabel: { margin: "2px 0 0", fontSize: "11px", color: "#64748b" },
  attSection: { marginBottom: "20px" },
  sectionLabel: { margin: "0 0 8px", fontSize: "12px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" },
  progBg: { height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", marginBottom: "6px" },
  progFill: { height: "100%", borderRadius: "4px", transition: "width 0.4s" },
  riskNote: { fontSize: "12px", color: "#dc2626", margin: 0 },
  recordGrid: { display: "flex", flexWrap: "wrap", gap: "6px" },
  recordChip: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "6px" },
  marksGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: "10px", marginBottom: "12px" },
  markCard: { background: "#f8fafc", borderRadius: "10px", padding: "12px", textAlign: "center" },
  testName: { margin: 0, fontSize: "11px", color: "#64748b", fontWeight: "600" },
  testScore: { margin: "6px 0 2px", fontSize: "22px", fontWeight: "700", color: "#1e293b" },
  testDate: { margin: 0, fontSize: "10px", color: "#94a3b8" },
  totalScore: { fontSize: "14px", color: "#475569", background: "#f1f5f9", padding: "10px 14px", borderRadius: "8px" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }
}
