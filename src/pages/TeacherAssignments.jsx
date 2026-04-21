import { useState, useEffect } from "react"
import { collection, getDocs, query, where, addDoc, deleteDoc, doc } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"

export default function TeacherAssignments() {
  const { currentUser, userData } = useAuth()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    classes: [],
    notes: "",
    attachmentUrl: ""
  })

  const subjectCode = userData?.subjectCode || ""
  const teacherClasses = userData?.classes || []

  useEffect(() => {
    if (!subjectCode) { setLoading(false); return }
    fetchAssignments()
  }, [subjectCode])

  const fetchAssignments = async () => {
    try {
      const snap = await getDocs(query(collection(db, "assignments"), where("teacherId", "==", currentUser.uid)))
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      setAssignments(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const toggleFormClass = (cls) => {
    setForm(prev => ({
      ...prev,
      classes: prev.classes.includes(cls) ? prev.classes.filter(c => c !== cls) : [...prev.classes, cls]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.deadline) { alert("Title and deadline are required."); return }
    if (!form.classes.length) { alert("Select at least one class."); return }
    setSaving(true)
    try {
      const assignmentData = {
        teacherId: currentUser.uid,
        subjectCode,
        title: form.title.trim(),
        description: form.description.trim(),
        deadline: form.deadline,
        classes: form.classes,
        notes: form.notes.trim(),
        attachmentUrl: form.attachmentUrl.trim(),
        createdAt: new Date().toISOString()
      }

      await addDoc(collection(db, "assignments"), assignmentData)

      // Create notifications for selected classes
      for (const cls of form.classes) {
        await addDoc(collection(db, "notifications"), {
          message: `New assignment: ${form.title} for ${subjectCode}`,
          type: "assignment",
          targetClass: cls,
          subjectCode,
          teacherName: userData?.name || "Teacher",
          createdAt: new Date().toISOString()
        })
      }

      setForm({ title: "", description: "", deadline: "", classes: [], notes: "", attachmentUrl: "" })
      setShowForm(false)
      fetchAssignments()
    } catch (e) { console.error(e); alert("Failed to save assignment.") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm("Delete this assignment?")) return
    try {
      await deleteDoc(doc(db, "assignments", id))
      setAssignments(prev => prev.filter(a => a.id !== id))
    } catch (e) { console.error(e) }
  }

  const getDaysLeft = (deadline) => {
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const getDeadlineStatus = (deadline) => {
    const days = getDaysLeft(deadline)
    if (days < 0) return { label: "Overdue", color: "#dc2626", bg: "#fef2f2" }
    if (days === 0) return { label: "Due Today", color: "#d97706", bg: "#fffbeb" }
    if (days <= 3) return { label: `${days}d left`, color: "#d97706", bg: "#fffbeb" }
    return { label: `${days}d left`, color: "#16a34a", bg: "#f0fdf4" }
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
          <h2 style={styles.heading}>Assignments & Notes</h2>
          <p style={styles.sub}>Subject: <strong>{subjectCode}</strong> · Post tasks or learning materials</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          {showForm ? "✕ Cancel" : "+ New Post"}
        </button>
      </div>

      {/* Add Assignment Form */}
      {showForm && (
        <div style={styles.formCard}>
          <h3 style={{ margin: "0 0 20px", color: "#1e293b" }}>Create New Assignment/Note</h3>
          <form onSubmit={handleSubmit}>
            <div style={styles.formGrid}>
              <div style={styles.field}>
                <label style={styles.label}>Post Title *</label>
                <input style={styles.input} placeholder="e.g. Lab Report 1 or Unit 2 Notes" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Deadline *</label>
                <input style={styles.input} type="date" value={form.deadline}
                  onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} required
                  min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
            
            <div style={{...styles.formGrid, marginTop: "12px"}}>
              <div style={styles.field}>
                <label style={styles.label}>PDF/Attachment URL (Optional)</label>
                <input style={styles.input} placeholder="https://drive.google.com/..." value={form.attachmentUrl}
                  onChange={e => setForm(p => ({ ...p, attachmentUrl: e.target.value }))} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Assign to Classes *</label>
                <div style={styles.classGrid}>
                  {teacherClasses.map(cls => (
                    <button key={cls} type="button" onClick={() => toggleFormClass(cls)}
                      style={{ ...styles.classChip, ...(form.classes.includes(cls) ? styles.classChipActive : {}) }}>
                      {cls}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ ...styles.field, marginTop: "16px" }}>
              <label style={styles.label}>Description & Notes</label>
              <textarea
                style={{ ...styles.input, minHeight: "100px", resize: "vertical", fontFamily: "inherit" }}
                placeholder="Detailed instructions or study notes..."
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              />
            </div>

            <button type="submit" disabled={saving} style={styles.submitBtn}>
              {saving ? "Posting..." : "Post to Students"}
            </button>
          </form>
        </div>
      )}

      {/* Assignment Cards */}
      {assignments.length === 0 ? (
        <div style={styles.emptyCards}>
          <p style={{ fontSize: "48px" }}>📝</p>
          <h3 style={{ color: "#1e293b" }}>No posts yet</h3>
          <p style={{ color: "#64748b" }}>Click "New Post" to share materials with your classes.</p>
        </div>
      ) : (
        <div style={styles.cardsGrid}>
          {assignments.map(a => {
            const status = getDeadlineStatus(a.deadline)
            return (
              <div key={a.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={{ flex: 1 }}>
                    <h4 style={styles.cardTitle}>{a.title}</h4>
                    <p style={styles.cardSubject}>{a.subjectCode}</p>
                  </div>
                  <span style={{ ...styles.deadlineBadge, background: status.bg, color: status.color }}>
                    {status.label}
                  </span>
                </div>

                {a.notes && (
                  <p style={styles.cardDesc}>{a.notes}</p>
                )}

                {a.attachmentUrl && (
                  <a href={a.attachmentUrl} target="_blank" rel="noreferrer" style={styles.pdfLink}>
                    📄 View PDF Attachment
                  </a>
                )}

                <div style={styles.cardMeta}>
                  <div style={styles.metaRow}>
                    <span style={styles.metaIcon}>📅</span>
                    <span>Deadline: <strong>{new Date(a.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
                  </div>
                  <div style={styles.metaRow}>
                    <span style={styles.metaIcon}>🎓</span>
                    <span>{(a.classes || []).join(", ")}</span>
                  </div>
                </div>

                <div style={styles.cardActions}>
                  <button onClick={() => handleDelete(a.id)} style={styles.deleteBtn}>Delete Post</button>
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
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  heading: { margin: 0, fontSize: "26px", fontWeight: "700", color: "#1e293b" },
  sub: { color: "#64748b", marginTop: "4px", fontSize: "14px" },
  addBtn: { padding: "10px 20px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  formCard: { background: "#fff", borderRadius: "16px", padding: "28px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginBottom: "24px" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  field: { display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "13px", fontWeight: "600", color: "#374151" },
  input: { padding: "11px 14px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: "14px", outline: "none", color: "#1a1a2e", width: "100%", boxSizing: "border-box" },
  classGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  classChip: { padding: "7px 16px", borderRadius: "20px", border: "1.5px solid #e5e7eb", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontSize: "12px", fontWeight: "500" },
  classChipActive: { border: "1.5px solid #0d9488", background: "#f0fdfa", color: "#0d9488" },
  submitBtn: { marginTop: "20px", padding: "12px 28px", background: "linear-gradient(135deg, #0d9488, #0f766e)", color: "#fff", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", fontSize: "15px" },
  cardsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "16px" },
  card: { background: "#fff", borderRadius: "16px", padding: "22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", border: "1px solid #f1f5f9" },
  cardTop: { display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" },
  cardTitle: { margin: 0, fontSize: "16px", fontWeight: "700", color: "#1e293b" },
  cardSubject: { margin: "3px 0 0", fontSize: "12px", color: "#94a3b8", fontWeight: "500" },
  deadlineBadge: { padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", whiteSpace: "nowrap" },
  cardDesc: { margin: "0 0 14px", fontSize: "13px", color: "#475569", lineHeight: "1.6", whiteSpace: "pre-wrap" },
  pdfLink: { color: "#0d9488", fontSize: "13px", fontWeight: "600", textDecoration: "none", display: "inline-block", marginBottom: "16px", padding: "8px 12px", background: "#f0fdfa", borderRadius: "8px" },
  cardMeta: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" },
  metaRow: { display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#64748b" },
  metaIcon: { fontSize: "14px" },
  cardActions: { display: "flex", justifyContent: "flex-end" },
  deleteBtn: { padding: "6px 14px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", borderRadius: "8px", cursor: "pointer", fontSize: "12px", fontWeight: "600" },
  emptyCards: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "300px", textAlign: "center" },
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", textAlign: "center" }
}
