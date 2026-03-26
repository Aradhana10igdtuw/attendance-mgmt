import { BrowserRouter, Routes, Route } from "react-router-dom"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Attendance Management System</h1>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
