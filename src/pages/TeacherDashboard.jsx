import { useState } from "react"
import { useAuth } from "../hooks/useAuth"
import { QRCode } from "react-qr-code"
import { collection, doc, setDoc } from "firebase/firestore"
import { db } from "../firebase"

export default function TeacherDashboard() {
  const { currentUser, userData } = useAuth()
  const [qrDataStr, setQrDataStr] = useState(null)
  
  const [subject, setSubject] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  const generateQR = () => {
    if (!subject.trim()) {
      alert("Please enter a subject")
      return
    }

    try {
      const newSessionRef = doc(collection(db, "sessions"))
      
      const sessionData = {
        sessionId: newSessionRef.id,
        teacherId: currentUser.uid,
        teacherEmail: currentUser.email,
        subject: subject.trim(),
        date: date,
        timestamp: Date.now()
      }
      
      // Show QR locally immediately with embedded data
      setQrDataStr(JSON.stringify(sessionData))
      
      // Async save to firestore
      setDoc(newSessionRef, sessionData).catch(error => {
        console.error("Warning: Could not sync session to Firestore immediately:", error)
      })
    } catch (error) {
      console.error("Error creating session locally:", error)
      alert("Could not generate QR code locally.")
    }
  }

  return (
    <div>
      <h2 style={styles.heading}>Teacher Dashboard</h2>
      <p style={styles.sub}>Welcome, {userData?.email || currentUser?.email}</p>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Generate Attendance QR</h3>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Subject/Class Name</label>
          <input 
            type="text" 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
            style={styles.input}
            placeholder="e.g., Computer Networks"
          />
        </div>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            style={styles.input}
          />
        </div>

        <button onClick={generateQR} style={styles.btn}>Start New Class Session</button>
        
        {qrDataStr && (
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <QRCode value={qrDataStr} size={256} />
            <p style={{ marginTop: "16px", color: "#666" }}>Scan this code to mark attendance for {subject} on {date}.</p>
          </div>
        )}
      </div>
    </div>
  )
}

const styles = {
  heading: { margin: 0, fontSize: "24px", color: "#1a1a2e" },
  sub: { color: "#666", marginTop: "4px", marginBottom: "32px" },
  section: { background: "#fff", borderRadius: "12px", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" },
  sectionTitle: { margin: "0 0 16px", fontSize: "16px", color: "#1a1a2e" },
  formGroup: { marginBottom: "16px", display: "flex", flexDirection: "column", gap: "6px" },
  label: { fontSize: "14px", color: "#444", fontWeight: "500" },
  input: { padding: "10px", borderRadius: "6px", border: "1px solid #ddd", fontSize: "14px", outline: "none" },
  btn: { padding: "12px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500", marginTop: "8px" }
}
