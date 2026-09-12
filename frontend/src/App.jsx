import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import Header from "./components/Header"
import HomePage from "./pages/HomePage"
import Footer from "./components/Footer"
import Login from "./pages/Login"
import RecoverPassword from "./components/RecoverPassword"
import WhatsAppButton from "./components/WhatsAppButton"
import RolePanel from "./pages/RolePanel"
import AdminPage from "./pages/AdminPage"
import EmployeePage from "./pages/EmployeePage"

// Routes that use their own full-page sidebar layout (no global Header/Footer)
const PANEL_ROUTES = ["/admin", "/empleado", "/panel"]

function AppLayout() {
  const { pathname } = useLocation()
  const isPanel = PANEL_ROUTES.some((route) => pathname.startsWith(route))

  return (
    <div className="min-h-screen bg-panna text-inchiostro">
      {!isPanel && <Header />}
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<RecoverPassword />} />
          <Route path="/panel" element={<RolePanel />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/empleado" element={<EmployeePage />} />
        </Routes>
      </main>
      {!isPanel && <Footer />}
      {!isPanel && <WhatsAppButton />}
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}

export default App