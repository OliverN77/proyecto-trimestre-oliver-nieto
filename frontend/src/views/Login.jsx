import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import RegisterModal from "../components/RegisterModal"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export default function Login() {
    const [form, setForm] = useState({ email: "", password: "", remember: false })
    const [step, setStep] = useState(1)
    const [isRegisterOpen, setIsRegisterOpen] = useState(false)
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const navigate = useNavigate()

    function handleChange(event) {
        const { name, value, type, checked } = event.target
        setForm((previous) => ({ ...previous, [name]: type === "checkbox" ? checked : value }))
        setError("")
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setError("")

        if (step === 1) {
            if (!form.email) {
                setError("Por favor, ingresa tu correo electrónico")
                return
            }
            setStep(2)
            return
        }

        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ correo: form.email, contrasena: form.password }),
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.detail || data.mensaje || "No se pudo iniciar sesión")
                return
            }
            localStorage.setItem("token", data.access_token)
            localStorage.setItem("usuario", JSON.stringify(data.usuario))
            window.dispatchEvent(new Event("auth-change"))
            const destination = data.usuario.id_rol === 1
                ? "/admin"
                : data.usuario.id_rol === 2 ? "/empleado" : "/panel"
            navigate(destination)
        } catch {
            setError("No se pudo conectar con el servidor")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="flex min-h-[70vh] items-center justify-center bg-panna px-4 py-12 sm:px-6 bg-(--notte-2)">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-faro">
                <p className="text-center text-xs uppercase tracking-[0.32em] text-(--terracotta)">Acceso</p>
                <h1 className="mt-3 text-center font-jost text-3xl font-semibold text-(--notte)">Iniciar sesión</h1>

                <form className="mt-8" onSubmit={handleSubmit}>
                    {step === 1 ? (
                        <>
                            <Input
                                label="Correo electrónico"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                autoFocus
                            />
                            {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                            <Button type="submit" variant="notte" fullWidth>
                                Siguiente
                            </Button>
                        </>
                    ) : (
                        <>
                            <div className="mb-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2">
                                <span className="text-sm font-medium text-gray-700">{form.email}</span>
                                <button type="button" onClick={() => setStep(1)} className="text-xs font-bold text-(--azzurro) hover:underline">
                                    Cambiar
                                </button>
                            </div>

                            <Input
                                label="Contraseña"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                autoFocus
                            />

                            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-sm">
                                <label className="flex items-center gap-2 text-(--inchiostro)/80">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        checked={form.remember}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-(--notte)/30 text-(--notte) focus:ring-(--azzurro)"
                                    />
                                    Recordarme
                                </label>
                                <Link to="/recuperar-contrasena" className="font-medium text-(--azzurro) hover:underline">
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                            <Button type="submit" variant="notte" fullWidth disabled={isSubmitting}>
                                {isSubmitting ? "Validando..." : "Iniciar sesión"}
                            </Button>
                        </>
                    )}
                </form>

                <p className="mt-6 text-center text-sm text-(--inchiostro)/70">
                    ¿No tienes una cuenta?{" "}
                    <button
                        type="button"
                        onClick={() => setIsRegisterOpen(true)}
                        className="font-semibold text-(--terracotta) hover:underline"
                    >
                        Crear una cuenta
                    </button>
                </p>

                <div className="mt-4 text-center">
                    <Link to="/" className="text-sm font-medium text-(--azzurro) hover:underline">
                        Volver al inicio
                    </Link>
                </div>
            </div>

            <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
        </section>
    )
}