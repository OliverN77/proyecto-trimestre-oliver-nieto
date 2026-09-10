import { BrowserRouter, Routes, Route } from "react-router-dom"
import Header from "./components/Header"
import HomePage from "./pages/HomePage"
import Footer from "./components/Footer"
import Login from "./pages/Login"
import RecoverPassword from "./components/RecoverPassword"
import WhatsAppButton from "./components/WhatsAppButton"
import RolePanel from "./pages/RolePanel"
import AdminPage from "./pages/AdminPage"
import EmployeePage from "./pages/EmployeePage"

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-panna text-inchiostro">
        <Header />
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
        <Footer />
        <WhatsAppButton />
      </div>
    </BrowserRouter>
  )
}

export default App