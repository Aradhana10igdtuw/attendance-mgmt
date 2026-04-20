import Layout from "../components/Layout"
import { useAuth } from "../hooks/useAuth"
import TeacherDashboard from "./TeacherDashboard"
import StudentDashboard from "./StudentDashboard"

export default function Dashboard() {
  const { userData, loading } = useAuth()

  if (loading) {
    return (
      <Layout>
        <div style={{ padding: "40px", textAlign: "center" }}>
          <h2>Loading your dashboard...</h2>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      {userData?.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </Layout>
  )
}