import { seedDatabase } from "../seedData"
import Layout from "../components/Layout"
import { useAuth } from "../hooks/useAuth"

const stats = [
  { label: "Attendance", value: "82%", color: "#4f46e5" },
  { label: "Assignments", value: "12", color: "#0f6e56" },
  { label: "Subjects", value: "6", color: "#854f0b" },
  { label: "Alerts", value: "1", color: "#a32d2d" },
]

export default function Dashboard() {
  const { currentUser } = useAuth()

  return (
    <Layout>
      <h2 style={styles.heading}>Welcome back!</h2>
      <p style={styles.sub}>{currentUser?.email}</p>

      <button
      onClick={async () => { await seedDatabase(); alert("Data seeded!") }}
      style={{ marginBottom: "24px", padding: "8px 16px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
      >
       Seed test data
      </button>

      <div style={styles.grid}>
        {stats.map((s) => (
          <div key={s.label} style={styles.card}>
            <p style={styles.cardLabel}>{s.label}</p>
            <p style={{ ...styles.cardValue, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Recent activity</h3>
        <div style={styles.activityCard}>
          <p style={styles.activityText}>Attendance marked for Data Structures — today</p>
        </div>
        <div style={styles.activityCard}>
          <p style={styles.activityText}>Assignment submitted — DBMS Unit 2</p>
        </div>
        <div style={styles.activityCard}>
          <p style={styles.activityText}>Mid-sem marks updated — Computer Networks</p>
        </div>
      </div>
    </Layout>
  )
}

const styles = {
  heading: { margin: 0, fontSize: "24px", color: "#1a1a2e" },
  sub: { color: "#666", marginTop: "4px", marginBottom: "32px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" },
  card: {
    background: "#fff", borderRadius: "12px",
    padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
  },
  cardLabel: { margin: 0, fontSize: "13px", color: "#888" },
  cardValue: { margin: "8px 0 0", fontSize: "32px", fontWeight: "600" },
  section: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  sectionTitle: { margin: "0 0 16px", fontSize: "16px", color: "#1a1a2e" },
  activityCard: { padding: "12px 0", borderBottom: "1px solid #f0f0f0" },
  activityText: { margin: 0, fontSize: "14px", color: "#444" }
}