import { useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth"
import { Html5QrcodeScanner } from "html5-qrcode"
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export default function StudentDashboard() {
  const { currentUser, userData } = useAuth()
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)
  
  // From remote rich dashboard
  const [stats, setStats] = useState({ avgAttendance: 0, lowSubjects: 0, totalSubjects: 0 })
  const [loadingStats, setLoadingStats] = useState(true)
  const [time, setTime] = useState(new Date())

  // Timer for Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch Stats
  useEffect(() => {
    if (currentUser?.email) {
      fetchStats()
    }
  }, [currentUser?.email])

  const fetchStats = async () => {
    try {
      const subSnap = await getDocs(collection(db, "subjects"))
      const subjects = subSnap.docs.map((d) => ({ id: d.id, ...d.data() }))

      const attQ = query(
        collection(db, "attendance"),
        where("studentId", "==", currentUser.uid) // Using UID consistently
      )
      const attSnap = await getDocs(attQ)
      const records = attSnap.docs.map((d) => d.data())

      let totalPct = 0, lowCount = 0
      subjects.forEach((s) => {
        const sub = records.filter((r) => r.subjectCode === s.code || r.subject === s.name)
        const pct = sub.length === 0 ? 0 : Math.round((sub.length / 40) * 100) // Mock logic for demo
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
      setLoadingStats(false)
    }
  }

  // QR Scanner Logic
  useEffect(() => {
    let scanner;
    if (scanning) {
      scanner = new Html5QrcodeScanner("reader", { qrbox: { width: 250, height: 250 }, fps: 5 }, false)
      
      scanner.render(async (text) => {
        scanner.clear()
        setScanning(false)
        
        try {
          let sessionData;
          try {
             sessionData = JSON.parse(text)
             if (!sessionData.sessionId) throw new Error("Invalid QR data")
          } catch (e) {
             alert("Invalid QR code scanned.")
             return
          }

          setScanResult(sessionData)
          
          await setDoc(doc(db, "attendance", `${currentUser.uid}_${sessionData.sessionId}`), {
            studentId: currentUser.uid,
            studentEmail: currentUser.email,
            sessionId: sessionData.sessionId,
            subject: sessionData.subject || "Unknown",
            date: sessionData.date || new Date().toISOString().split('T')[0],
            teacherId: sessionData.teacherId || "Unknown",
            timestamp: Date.now()
          })
          alert(`Attendance marked successfully for ${sessionData.subject}!`)
          fetchStats() // Refresh stats after marking attendance
        } catch (error) {
          console.error("Error marking attendance", error)
          alert("Failed to mark attendance.")
        }
      }, (err) => {})
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Scanner cleanup error:", e))
      }
    }
  }, [scanning, currentUser.uid, currentUser.email])

  const getGreeting = () => {
    const h = time.getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }

  const firstName = userData?.name?.split(" ")[0] || currentUser?.email?.split("@")[0] || "Student"

  const cards = [
    { label: "Avg attendance", value: loadingStats ? "..." : `${stats.avgAttendance}%`, color: stats.avgAttendance >= 75 ? "#0f6e56" : "#a32d2d", bg: stats.avgAttendance >= 75 ? "#e1f5ee" : "#fcebeb", sub: stats.avgAttendance >= 75 ? "You're on track" : "Needs attention" },
    { label: "Subjects enrolled", value: loadingStats ? "..." : stats.totalSubjects, color: "#185fa5", bg: "#e6f1fb", sub: "This semester" },
    { label: "Below 75%", value: loadingStats ? "..." : stats.lowSubjects, color: stats.lowSubjects > 0 ? "#a32d2d" : "#0f6e56", bg: stats.lowSubjects > 0 ? "#fcebeb" : "#e1f5ee", sub: stats.lowSubjects > 0 ? "Action needed" : "All clear" },
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
  ]

  return (
    <div style={styles.container}>
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

      {/* Main Content Grid */}
      <div style={styles.mainGrid}>
        {/* Left Column: QR Scanner & Schedule */}
        <div style={styles.leftCol}>
          {/* QR Scanner Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Mark Attendance</h3>
            <div style={styles.scannerBox}>
              {!scanning && !scanResult && (
                <button onClick={() => setScanning(true)} style={styles.btn}>Scan QR Code</button>
              )}
              
              {scanning && (
                <div style={{ textAlign: "center" }}>
                  <div id="reader" style={{ width: "100%", maxWidth: "300px", margin: "0 auto" }}></div>
                  <button onClick={() => setScanning(false)} style={{...styles.btn, background: "#e24b4a", marginTop: "16px"}}>Cancel</button>
                </div>
              )}

              {scanResult && (
                <div style={styles.successBox}>
                  <p>Attendance marked successfully!</p>
                  <p style={{fontSize: "14px", color: "#333", marginTop: "8px"}}>Subject: {scanResult.subject}</p>
                  <button onClick={() => setScanResult(null)} style={{...styles.btn, marginTop: "16px", background: "#666"}}>Scan Another</button>
                </div>
              )}
            </div>
          </div>

          {/* Today's schedule */}
          <div style={{...styles.section, marginTop: "16px"}}>
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
        </div>

        {/* Right Column: Notices */}
        <div style={styles.rightCol}>
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

          <div style={{...styles.section, marginTop: "16px", background: "#f8fafc"}}>
            <h3 style={{...styles.sectionTitle, color: "#475569"}}>Quick Links</h3>
            <div style={styles.footerLinks}>
              <a href="https://igdtuw.ac.in" target="_blank" rel="noreferrer" style={styles.link}>College website</a>
              <a href="https://igdtuw.ac.in/notices.php" target="_blank" rel="noreferrer" style={styles.link}>Official notices</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { paddingBottom: "32px" },
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
  mainGrid: { display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" },
  section: { background: "#fff", borderRadius: "12px", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" },
  sectionTitle: { margin: "0 0 16px", fontSize: "15px", fontWeight: "500", color: "#1a1a2e" },
  scannerBox: { textAlign: "center", padding: "10px 0" },
  btn: { padding: "12px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "500" },
  successBox: { color: "#0f6e56", fontWeight: "500" },
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
  footerLinks: { display: "flex", flexDirection: "column", gap: "8px" },
  link: { color: "#4f46e5", fontSize: "13px", textDecoration: "none", fontWeight: "500" }
}
