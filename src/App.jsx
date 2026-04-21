import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import Attendance from "./pages/Attendance"
import StudentsData from "./pages/StudentsData"
import TeacherMarks from "./pages/TeacherMarks"
import StudentMarks from "./pages/StudentMarks"
import TeacherAssignments from "./pages/TeacherAssignments"
import StudentAssignments from "./pages/StudentAssignments"

import Notifications from "./pages/Notifications"

function App() {
  const { userData } = useAuth()
  const isTeacher = userData?.role === "teacher"

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/attendance" element={
          <ProtectedRoute><Attendance /></ProtectedRoute>
        }/>
        <Route path="/students-data" element={
          <ProtectedRoute><StudentsData /></ProtectedRoute>
        }/>
        <Route path="/marks" element={
          <ProtectedRoute>
            {isTeacher ? <TeacherMarks /> : <StudentMarks />}
          </ProtectedRoute>
        } />
        <Route path="/assignments" element={
          <ProtectedRoute>
            {isTeacher ? <TeacherAssignments /> : <StudentAssignments />}
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><Notifications /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App