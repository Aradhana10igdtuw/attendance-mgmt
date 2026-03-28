import Sidebar from "./Sidebar"

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <main style={{
        marginLeft: "240px", flex: 1,
        padding: "32px", minHeight: "100vh",
        background: "#f0f2f5"
      }}>
        {children}
      </main>
    </div>
  )
}