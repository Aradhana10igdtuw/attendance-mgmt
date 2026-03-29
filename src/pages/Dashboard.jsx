import { useEffect, useState } from "react"
import { collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"
import { useAuth } from "../hooks/useAuth"
import Layout from "../components/Layout"
import { seedMarks } from "../seedData"

export default function Dashboard() {
  const { currentUser } = useAuth()
  const [stats, setStats] = useState({ avgAttendance: 0, lowSubjects: 0, totalSubjects: 0 })
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const subSnap = await getDocs(collection(db, "subjects"))
      const subjects = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

      const attQ = query(
        collection(db, "attendance"),
        where("studentId", "==", currentUser.email)
      )
      const attSnap = await getDocs(attQ)
      const records = attSnap.docs.map((d) => d.data())

      let totalPct = 0, lowCount = 0
      subjects.forEach((s) => {
        const sub = records.filter((r) => r.subjectCode === s.code)
        const pct = sub.length === 0 ? 0 : Math.round((sub.filter((r) => r.present).length / sub.length) * 100)
        totalPct += pct
        if (pct < 75 && sub.length > 0) lowCount++
      })

      setStats({
        avgAttendance: subjects.length ? Math.round(totalPct / subjects.length) : 0,
        lowSubjects: lowCount,
        totalSubjects: subjects.length
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const h = time.getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  const firstName = currentUser?.email?.split("@")[0] || "Student"

  const cards = [
    { label: "Avg attendance", value: loading ? "..." : `${stats.avgAttendance}%`, color: stats.avgAttendance >= 75 ? "#0f6e56" : "#a32d2d", bg: stats.avgAttendance >= 75 ? "#e1f5ee" : "#fcebeb", sub: stats.avgAttendance >= 75 ? "You're on track" : "Needs attention" },
    { label: "Subjects enrolled", value: loading ? "..." : stats.totalSubjects, color: "#185fa5", bg: "#e6f1fb", sub: "This semester" },
    { label: "Below 75%", value: loading ? "..." : stats.lowSubjects, color: stats.lowSubjects > 0 ? "#a32d2d" : "#0f6e56", bg: stats.lowSubjects > 0 ? "#fcebeb" : "#e1f5ee", sub: stats.lowSubjects > 0 ? "Action needed" : "All clear" },
    { label: "Semester", value: "4th", color: "#534AB7", bg: "#EEEDFE", sub: "2024-25" },
  ]

  const schedule = [
    { time: "9:00 AM", subject: "Design & Analysis of Algorithms", room: "LT-1", type: "Lecture" },
    { time: "11:00 AM", subject: "Operating Systems", room: "LT-2", type: "Lecture" },
    { time: "2:00 PM", subject: "Software Engineering", room: "Lab-3", type: "Lab" },
    { time: "4:00 PM", subject: "Fundamentals of DevOps", room: "Lab-1", type: "Lab" },
  ]

  const notices = [
    { text: "Mid-semester examinations scheduled from March 15", date: "Today", urgent: true },
    { text: "DevOps project submission deadline extended to April 1", date: "Yesterday", urgent: false },
    { text: "Technical fest TechnoVortex registrations open", date: "2 days ago", urgent: false },
    { text: "Attendance shortage notices issued — check portal", date: "3 days ago", urgent: true },
  ]

  return (
    <Layout>
      {/* Hero banner */}
      <div style={styles.hero}>
        <div style={styles.heroOverlay} />
        <div style={styles.heroContent}>
          <p style={styles.heroGreeting}>{getGreeting()},</p>
          <h1 style={styles.heroName}>{firstName}</h1>
          <p style={styles.heroSub}>Indira Gandhi Delhi Technical University for Women</p>
        </div>
        <div style={styles.heroClock}>
          <p style={styles.clockTime}>
            {time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
          <p style={styles.clockDate}>
            {time.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
      </div>
      <button
        onClick={async () => { await seedMarks(); alert("Marks seeded!") }}
        style={{ marginBottom: "16px", padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
        Seed marks data
      </button>

      {/* Stats row */}
      <div style={styles.statsGrid}>
        {cards.map((c) => (
          <div key={c.label} style={styles.statCard}>
            <p style={styles.statLabel}>{c.label}</p>
            <p style={{ ...styles.statValue, color: c.color }}>{c.value}</p>
            <span style={{ ...styles.statBadge, background: c.bg, color: c.color }}>{c.sub}</span>
          </div>
        ))}
      </div>

      <div style={styles.twoCol}>
        {/* Today's schedule */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>Today's schedule</h3>
          {schedule.map((s, i) => (
            <div key={i} style={styles.scheduleItem}>
              <div style={styles.scheduleTime}>
                <p style={styles.timeText}>{s.time}</p>
              </div>
              <div style={styles.scheduleBar} />
              <div style={styles.scheduleInfo}>
                <p style={styles.scheduleSubject}>{s.subject}</p>
                <div style={styles.scheduleRow}>
                  <span style={styles.scheduleDetail}>{s.room}</span>
                  <span style={{
                    ...styles.typeBadge,
                    background: s.type === "Lab" ? "#EEEDFE" : "#e6f1fb",
                    color: s.type === "Lab" ? "#534AB7" : "#185fa5"
                  }}>{s.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Notices */}
        <div style={styles.section}>
          <h3 style={styles.sectionTitle}>College notices</h3>
          {notices.map((n, i) => (
            <div key={i} style={styles.noticeItem}>
              {n.urgent && <div style={styles.urgentDot} />}
              <div style={{ flex: 1 }}>
                <p style={styles.noticeText}>{n.text}</p>
                <p style={styles.noticeDate}>{n.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* IGDTUW banner */}
      <div style={styles.footer}>
        <div>
          <p style={styles.footerTitle}>IGDTUW Student Portal</p>
          <p style={styles.footerSub}>Kashmere Gate, Delhi — 110006</p>
        </div>
        <div style={styles.footerLinks}>
          <a href="https://igdtuw.ac.in" target="_blank" rel="noreferrer" style={styles.link}>College website</a>
          <a href="https://igdtuw.ac.in/notices.php" target="_blank" rel="noreferrer" style={styles.link}>Official notices</a>
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  hero: {
    position: "relative", borderRadius: "16px", overflow: "hidden",
    marginBottom: "24px", height: "180px",
    background: "linear-gradient(135deg, #1a1a2e 0%, #4f46e5 60%, #7c3aed 100%)",
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0 32px"
  },
  heroOverlay: {
    position: "absolute", inset: 0,
    backgroundImage: "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 60%)",
  },
  heroContent: { position: "relative", zIndex: 1 },
  heroGreeting: { margin: 0, color: "rgba(255,255,255,0.7)", fontSize: "14px" },
  heroName: { margin: "4px 0", color: "#fff", fontSize: "32px", fontWeight: "600", textTransform: "capitalize" },
  heroSub: { margin: 0, color: "rgba(255,255,255,0.6)", fontSize: "13px" },
  heroClock: { position: "relative", zIndex: 1, textAlign: "right" },
  clockTime: { margin: 0, color: "#fff", fontSize: "28px", fontWeight: "300", fontFamily: "monospace" },
  clockDate: { margin: "4px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "13px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  statLabel: { margin: 0, fontSize: "12px", color: "#888" },
  statValue: { margin: "8px 0 6px", fontSize: "28px", fontWeight: "600" },
  statBadge: { fontSize: "11px", padding: "2px 8px", borderRadius: "20px", fontWeight: "500" },
  twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" },
  section: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  sectionTitle: { margin: "0 0 16px", fontSize: "15px", fontWeight: "500", color: "#1a1a2e" },
  scheduleItem: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" },
  scheduleTime: { width: "72px", flexShrink: 0 },
  timeText: { margin: 0, fontSize: "12px", color: "#888", fontWeight: "500" },
  scheduleBar: { width: "3px", height: "36px", background: "#4f46e5", borderRadius: "2px", flexShrink: 0 },
  scheduleInfo: { flex: 1 },
  scheduleSubject: { margin: "0 0 4px", fontSize: "13px", fontWeight: "500", color: "#1a1a2e" },
  scheduleRow: { display: "flex", alignItems: "center", gap: "8px" },
  scheduleDetail: { fontSize: "11px", color: "#888" },
  typeBadge: { fontSize: "10px", padding: "2px 6px", borderRadius: "4px", fontWeight: "500" },
  noticeItem: { display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "14px", paddingBottom: "14px", borderBottom: "1px solid #f5f5f5" },
  urgentDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#e24b4a", flexShrink: 0, marginTop: "5px" },
  noticeText: { margin: 0, fontSize: "13px", color: "#333", lineHeight: "1.5" },
  noticeDate: { margin: "4px 0 0", fontSize: "11px", color: "#aaa" },
  footer: {
    background: "#1a1a2e", borderRadius: "12px", padding: "20px 24px",
    display: "flex", justifyContent: "space-between", alignItems: "center"
  },
  footerTitle: { margin: 0, color: "#fff", fontSize: "14px", fontWeight: "500" },
  footerSub: { margin: "4px 0 0", color: "rgba(255,255,255,0.5)", fontSize: "12px" },
  footerLinks: { display: "flex", gap: "16px" },
  link: { color: "#818cf8", fontSize: "13px", textDecoration: "none" }
}