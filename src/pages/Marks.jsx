import { useState, useEffect } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function Marks() {
  const { currentUser } = useAuth()
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => { fetchMarks() }, [])

  const fetchMarks = async () => {
    try {
      const q = query(
        collection(db, "marks"),
        where("studentId", "==", currentUser.email)
      )
      const snap = await getDocs(q)
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      setMarks(data)
      if (data.length > 0) setSelected(data[0])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getInternal = (m) => (m.midSem || 0) + (m.internals || 0) + (m.practicals || 0)
  const getInternalMax = (m) => m.midSemMax + m.internalsMax + m.practicalsMax
  const getTotal = (m) => getInternal(m) + (m.endTerm || 0)
  const getTotalMax = (m) => getInternalMax(m) + m.endTermMax
  const getPct = (val, max) => Math.round((val / max) * 100)

  const getGrade = (pct) => {
    if (pct >= 90) return { grade: "O", label: "Outstanding", color: "#0f6e56", bg: "#e1f5ee" }
    if (pct >= 80) return { grade: "A+", label: "Excellent", color: "#185fa5", bg: "#e6f1fb" }
    if (pct >= 70) return { grade: "A", label: "Very Good", color: "#534AB7", bg: "#EEEDFE" }
    if (pct >= 60) return { grade: "B+", label: "Good", color: "#854f0b", bg: "#faeeda" }
    if (pct >= 50) return { grade: "B", label: "Average", color: "#854f0b", bg: "#faeeda" }
    return { grade: "F", label: "Fail", color: "#a32d2d", bg: "#fcebeb" }
  }

  const getNeeded = (m) => {
    const internal = getInternal(m)
    const needed60 = Math.ceil(0.6 * getTotalMax(m) - internal)
    const needed75 = Math.ceil(0.75 * getTotalMax(m) - internal)
    return {
      for60: Math.min(Math.max(needed60, 0), m.endTermMax),
      for75: Math.min(Math.max(needed75, 0), m.endTermMax),
    }
  }

  const ProgressBar = ({ value, max, color }) => (
    <div style={{ background: "#f0f0f0", borderRadius: "4px", height: "8px", overflow: "hidden" }}>
      <div style={{
        width: `${getPct(value, max)}%`, height: "100%",
        background: color, borderRadius: "4px",
        transition: "width 0.6s ease"
      }} />
    </div>
  )

  if (loading) return <Layout><p style={{ color: "#666" }}>Loading marks...</p></Layout>

  const overallPct = marks.length
    ? Math.round(marks.reduce((sum, m) => sum + getPct(getInternal(m), getInternalMax(m)), 0) / marks.length)
    : 0

  return (
    <Layout>
      <h2 style={styles.heading}>Marks</h2>
      <p style={styles.sub}>Internal assessment — {new Date().getFullYear()}</p>

      {/* Summary cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Overall internals</p>
          <p style={{ ...styles.summaryValue, color: overallPct >= 75 ? "#0f6e56" : "#a32d2d" }}>{overallPct}%</p>
          <ProgressBar value={overallPct} max={100} color={overallPct >= 75 ? "#0f6e56" : "#a32d2d"} />
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Best subject</p>
          <p style={{ ...styles.summaryValue, color: "#185fa5" }}>
            {marks.length ? marks.reduce((best, m) =>
              getPct(getInternal(m), getInternalMax(m)) > getPct(getInternal(best), getInternalMax(best)) ? m : best
            ).subjectCode : "-"}
          </p>
          <p style={styles.summaryHint}>Highest internal score</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>End term status</p>
          <p style={{ ...styles.summaryValue, color: "#854f0b" }}>Pending</p>
          <p style={styles.summaryHint}>Results awaited</p>
        </div>
        <div style={styles.summaryCard}>
          <p style={styles.summaryLabel}>Subjects tracked</p>
          <p style={{ ...styles.summaryValue, color: "#534AB7" }}>{marks.length}</p>
          <p style={styles.summaryHint}>This semester</p>
        </div>
      </div>

      <div style={styles.twoCol}>
        {/* Subject list */}
        <div style={styles.subjectList}>
          {marks.map((m) => {
            const pct = getPct(getInternal(m), getInternalMax(m))
            const { grade, color, bg } = getGrade(pct)
            const isSelected = selected?.id === m.id
            return (
              <div
                key={m.id}
                onClick={() => setSelected(m)}
                style={{
                  ...styles.subjectItem,
                  border: isSelected ? "2px solid #4f46e5" : "2px solid transparent",
                  background: isSelected ? "#f8f7ff" : "#fff"
                }}
              >
                <div style={styles.subjectItemLeft}>
                  <p style={styles.subjectItemName}>{m.subjectName}</p>
                  <p style={styles.subjectItemCode}>{m.subjectCode}</p>
                  <div style={{ marginTop: "8px" }}>
                    <ProgressBar value={getInternal(m)} max={getInternalMax(m)} color={color} />
                  </div>
                </div>
                <div style={{ ...styles.gradeCircle, background: bg, color }}>
                  {grade}
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail panel */}
        {selected && (() => {
          const needed = getNeeded(selected)
          const pct = getPct(getInternal(selected), getInternalMax(selected))
          const { grade, label, color, bg } = getGrade(pct)
          return (
            <div style={styles.detailPanel}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
                <div>
                  <h3 style={styles.detailTitle}>{selected.subjectName}</h3>
                  <p style={styles.detailCode}>{selected.subjectCode}</p>
                </div>
                <div style={{ ...styles.bigGrade, background: bg, color }}>
                  <span style={{ fontSize: "24px", fontWeight: "700" }}>{grade}</span>
                  <span style={{ fontSize: "11px", marginTop: "2px" }}>{label}</span>
                </div>
              </div>

              {/* Mark breakdown */}
              {[
                { label: "Mid semester", val: selected.midSem, max: selected.midSemMax, color: "#4f46e5" },
                { label: "Internals", val: selected.internals, max: selected.internalsMax, color: "#0f6e56" },
                { label: "Practicals", val: selected.practicals, max: selected.practicalsMax, color: "#854f0b" },
              ].map((row) => (
                <div key={row.label} style={styles.markRow}>
                  <div style={styles.markRowHeader}>
                    <span style={styles.markLabel}>{row.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: row.color }}>
                      {row.val ?? "—"} / {row.max}
                    </span>
                  </div>
                  <ProgressBar value={row.val || 0} max={row.max} color={row.color} />
                  <p style={styles.markPct}>{row.val ? getPct(row.val, row.max) : 0}%</p>
                </div>
              ))}

              {/* Divider */}
              <div style={styles.divider} />

              {/* Internal total */}
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Internal total</span>
                <span style={{ ...styles.totalValue, color }}>
                  {getInternal(selected)} / {getInternalMax(selected)}
                </span>
              </div>

              {/* End term */}
              <div style={{ ...styles.endTermBox }}>
                <div style={styles.markRowHeader}>
                  <span style={styles.markLabel}>End term exam</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", color: "#888" }}>
                    {selected.endTerm ?? "Pending"} / {selected.endTermMax}
                  </span>
                </div>
                {!selected.endTerm && (
                  <div style={styles.predictionBox}>
                    <p style={styles.predictionTitle}>Score needed in end term</p>
                    <div style={styles.predictionRow}>
                      <div style={{ ...styles.predictionChip, background: "#e1f5ee", color: "#0f6e56" }}>
                        <span style={{ fontSize: "18px", fontWeight: "700" }}>{needed.for60}</span>
                        <span style={{ fontSize: "11px" }}>for 60% (Pass)</span>
                      </div>
                      <div style={{ ...styles.predictionChip, background: "#e6f1fb", color: "#185fa5" }}>
                        <span style={{ fontSize: "18px", fontWeight: "700" }}>{needed.for75}</span>
                        <span style={{ fontSize: "11px" }}>for 75% (Distinction)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>
    </Layout>
  )
}

const styles = {
  heading: { margin: 0, fontSize: "24px", color: "#1a1a2e" },
  sub: { color: "#666", marginTop: "4px", marginBottom: "24px" },
  summaryGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px", marginBottom: "24px" },
  summaryCard: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  summaryLabel: { margin: "0 0 8px", fontSize: "12px", color: "#888" },
  summaryValue: { margin: "0 0 8px", fontSize: "28px", fontWeight: "600" },
  summaryHint: { margin: "6px 0 0", fontSize: "12px", color: "#aaa" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "16px" },
  subjectList: { display: "flex", flexDirection: "column", gap: "12px" },
  subjectItem: { background: "#fff", borderRadius: "12px", padding: "16px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", transition: "all 0.2s" },
  subjectItemLeft: { flex: 1, marginRight: "12px" },
  subjectItemName: { margin: 0, fontSize: "14px", fontWeight: "500", color: "#1a1a2e" },
  subjectItemCode: { margin: "2px 0 0", fontSize: "12px", color: "#888" },
  gradeCircle: { width: "44px", height: "44px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", flexShrink: 0 },
  detailPanel: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  detailTitle: { margin: 0, fontSize: "16px", fontWeight: "600", color: "#1a1a2e" },
  detailCode: { margin: "4px 0 0", fontSize: "13px", color: "#888" },
  bigGrade: { padding: "10px 16px", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center" },
  markRow: { marginBottom: "16px" },
  markRowHeader: { display: "flex", justifyContent: "space-between", marginBottom: "6px" },
  markLabel: { fontSize: "13px", color: "#555" },
  markPct: { margin: "4px 0 0", fontSize: "11px", color: "#aaa", textAlign: "right" },
  divider: { height: "1px", background: "#f0f0f0", margin: "16px 0" },
  totalRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" },
  totalLabel: { fontSize: "14px", fontWeight: "500", color: "#1a1a2e" },
  totalValue: { fontSize: "20px", fontWeight: "700" },
  endTermBox: { background: "#f8f8f8", borderRadius: "10px", padding: "16px" },
  predictionBox: { marginTop: "12px" },
  predictionTitle: { margin: "0 0 10px", fontSize: "12px", color: "#666" },
  predictionRow: { display: "flex", gap: "12px" },
  predictionChip: { flex: 1, borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" },
}