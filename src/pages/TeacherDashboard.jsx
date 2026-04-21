import { useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth"
import { QRCode } from "react-qr-code"
import { collection, doc, setDoc, getDocs } from "firebase/firestore"
import { db } from "../firebase"

export default function TeacherDashboard() {
  const { currentUser, userData } = useAuth()
  const [qrDataStr, setQrDataStr] = useState(null)
  
  const [subject, setSubject] = useState("")
  const [subjectCode, setSubjectCode] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  const [subjectsList, setSubjectsList] = useState([])
  const [isExpirationEnabled, setIsExpirationEnabled] = useState(false)
  const [expirationDuration, setExpirationDuration] = useState(10)
  const [loadingSubjects, setLoadingSubjects] = useState(true)

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "subjects"))
        const subjects = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        setSubjectsList(subjects)
        
        // Pre-select teacher's registered subject
        if (userData?.subjectCode) {
          const mySub = subjects.find(s => s.code === userData.subjectCode)
          if (mySub) {
            setSubject(mySub.name)
            setSubjectCode(mySub.code)
          }
        }
      } catch (error) {
        console.error("Error fetching subjects:", error)
      } finally {
        setLoadingSubjects(false)
      }
    }
    fetchSubjects()
  }, [])

  const handleSubjectChange = (e) => {
    const selectedCode = e.target.value
    const selectedSub = subjectsList.find(s => s.code === selectedCode)
    if (selectedSub) {
      setSubject(selectedSub.name)
      setSubjectCode(selectedSub.code)
    } else {
      setSubject("")
      setSubjectCode("")
    }
  }
  
  const generateQR = () => {
    if (!subject.trim() || !subjectCode.trim()) {
      alert("Please enter both subject name and subject code")
      return
    }

    try {
      const newSessionRef = doc(collection(db, "sessions"))
      
      const sessionData = {
        sessionId: newSessionRef.id,
        teacherId: currentUser.uid,
        teacherEmail: currentUser.email,
        subject: subject.trim(),
        subjectCode: subjectCode.trim().toUpperCase(),
        date: date,
        timestamp: Date.now()
      }

      if (isExpirationEnabled) {
        sessionData.expiresAt = Date.now() + (expirationDuration * 60 * 1000)
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
          <label style={styles.label}>Select Subject</label>
          <select 
            value={subjectCode} 
            onChange={handleSubjectChange}
            style={styles.input}
          >
            <option value="">-- Choose a Subject --</option>
            {subjectsList.map(s => (
              <option key={s.code} value={s.code}>{s.name} ({s.code})</option>
            ))}
          </select>
          {loadingSubjects && <p style={{fontSize: "12px", color: "#666"}}>Loading subjects...</p>}
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

        <div style={{...styles.formGroup, flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "8px"}}>
          <input 
            type="checkbox" 
            id="expiry" 
            checked={isExpirationEnabled} 
            onChange={e => setIsExpirationEnabled(e.target.checked)}
          />
          <label htmlFor="expiry" style={{...styles.label, cursor: "pointer"}}>Enable QR Expiration</label>
        </div>

        {isExpirationEnabled && (
          <div style={styles.formGroup}>
            <label style={styles.label}>Validity Duration (minutes)</label>
            <input 
              type="number" 
              value={expirationDuration} 
              onChange={e => setExpirationDuration(parseInt(e.target.value) || 0)}
              style={styles.input}
              min="1"
            />
          </div>
        )}

        <button onClick={generateQR} style={styles.btn}>Start New Class Session</button>
        
        {qrDataStr && (
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "8px", display: "inline-block" }}>
              <QRCode value={qrDataStr} size={256} />
            </div>
            <p style={{ marginTop: "16px", color: "#666", fontSize: "14px" }}>
              Scan this code to mark attendance for <br/>
              <strong>{subject} ({subjectCode})</strong> on {date}.
            </p>
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
  btn: { padding: "12px 24px", background: "#0d9488", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500", marginTop: "8px" }
}
