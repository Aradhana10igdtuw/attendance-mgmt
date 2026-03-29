import { BrowserRouter, Routes, Route } from "react-router-dom"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import Attendance from "./pages/Attendance"
import Marks from "./pages/Marks"

function App() {
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
        <Route path="/marks" element={
          <ProtectedRoute><Marks /></ProtectedRoute>
        } />
        <Route path="/assignments" element={
          <ProtectedRoute><div style={{marginLeft:"240px",padding:"32px"}}><h2>Assignments — coming soon</h2></div></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><div style={{marginLeft:"240px",padding:"32px"}}><h2>Notifications — coming soon</h2></div></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App