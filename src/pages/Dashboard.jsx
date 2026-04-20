import Layout from "../components/Layout"
import { useAuth } from "../hooks/useAuth"
import TeacherDashboard from "./TeacherDashboard"
import StudentDashboard from "./StudentDashboard"

export default function Dashboard() {
  const { userData, loading } = useAuth()

  if (loading) {
    return (
      <Layout>
        <h2>Loading dashboard...</h2>
      </Layout>
    )
  }

  return (
    <Layout>
      {userData?.role === "teacher" ? <TeacherDashboard /> : <StudentDashboard />}
    </Layout>
  )
}