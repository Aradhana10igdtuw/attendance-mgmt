import { useState, useEffect } from "react"
import { useAuth } from "../hooks/useAuth"
import { Html5QrcodeScanner } from "html5-qrcode"
import { doc, setDoc } from "firebase/firestore"
import { db } from "../firebase"

export default function StudentDashboard() {
  const { currentUser, userData } = useAuth()
  const [scanResult, setScanResult] = useState(null)
  const [scanning, setScanning] = useState(false)

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
             // validate it has sessionId
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
        } catch (error) {
          console.error("Error marking attendance", error)
          alert("Failed to mark attendance.")
        }
      }, (err) => {
        // ignoring frame errors during scanning
      })
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Scanner cleanup error:", e))
      }
    }
  }, [scanning, currentUser.uid, currentUser.email])

  return (
    <div>
      <h2 style={styles.heading}>Student Dashboard</h2>
      <p style={styles.sub}>Welcome, {userData?.email || currentUser?.email}</p>
      
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Mark Attendance</h3>
        {!scanning && !scanResult && (
          <button onClick={() => setScanning(true)} style={styles.btn}>Scan QR Code</button>
        )}
        
        {scanning && (
          <div>
            <div id="reader" style={{ width: "100%", maxWidth: "400px", margin: "0 auto" }}></div>
            <button onClick={() => setScanning(false)} style={{...styles.btn, background: "#e24b4a", marginTop: "16px"}}>Cancel</button>
          </div>
        )}

        {scanResult && (
          <div style={{ marginTop: "16px", color: "#0f6e56", fontWeight: "500" }}>
            <p>Successfully scanned and marked attendance!</p>
            <p style={{fontSize: "14px", color: "#333", marginTop: "8px"}}>Subject: {scanResult.subject}</p>
            <p style={{fontSize: "14px", color: "#333"}}>Date: {scanResult.date}</p>
            <p style={{fontSize: "12px", color: "#888", fontWeight: "normal", marginTop: "4px"}}>Session ID: {scanResult.sessionId}</p>
            <button onClick={() => setScanResult(null)} style={{...styles.btn, marginTop: "16px", background: "#666"}}>Scan Another</button>
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
  btn: { padding: "12px 24px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "500" }
}
