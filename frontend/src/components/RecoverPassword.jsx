import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import Input from "./ui/Input"
import Button from "./ui/Button"

const API_URL = import.meta.env.VITE_API_URL
const DOCUMENT_PATTERN = /^\d{6,12}$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

export default function RecoverPassword() {
    const navigate = useNavigate()
    const [documento, setDocumento] = useState("")
    const [solicitud, setSolicitud] = useState(null)
    const [nuevaContrasena, setNuevaContrasena] = useState("")
    const [confirmacion, setConfirmacion] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [error, setError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (!solicitud || solicitud.estado !== "pendiente") return undefined
        const intervalId = window.setInterval(async () => {
            const response = await fetch(`${API_URL}/recuperacion/solicitud/${solicitud.id_solicitud}?documento=${encodeURIComponent(documento)}`)
            if (response.ok) setSolicitud(await response.json())
        }, 3000)
        return () => window.clearInterval(intervalId)
    }, [solicitud, documento])

    useEffect(() => {
        if (!DOCUMENT_PATTERN.test(documento)) {
            return undefined
        }
        const timeoutId = window.setTimeout(async () => {
            try {
                const response = await fetch(`${API_URL}/recuperacion/estado?documento=${encodeURIComponent(documento)}`)
                if (!response.ok) {
                    setSolicitud(null)
                    return
                }
                const data = await response.json()
                setSolicitud(data)
                setMensaje(data.estado === "pendiente"
                    ? "Tu solicitud está pendiente de aprobación del administrador."
                    : data.estado === "aprobada" ? "Tu solicitud fue aprobada. Ya puedes cambiar tu contraseña."
                        : data.minutos_restantes > 0 ? `Ya cambiaste tu contraseña. Podrás solicitar otro cambio en ${data.minutos_restantes} minutos.` : "")
            } catch {
                setSolicitud(null)
            }
        }, 350)
        return () => window.clearTimeout(timeoutId)
    }, [documento])

    async function solicitarCambio(event) {
        event.preventDefault()
        setError("")
        setMensaje("")
        if (!DOCUMENT_PATTERN.test(documento)) {
            setError("El documento debe tener entre 6 y 12 dígitos")
            return
        }
        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/recuperacion/solicitar`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numero_documento: documento }),
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.mensaje || "No se pudo enviar la solicitud")
                return
            }
            setSolicitud(data)
            setMensaje(data.mensaje)
        } catch {
            setError("No se pudo conectar con el servidor")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function actualizarContrasena(event) {
        event.preventDefault()
        setError("")
        if (!PASSWORD_PATTERN.test(nuevaContrasena)) {
            setError("La contraseña debe tener 8-20 caracteres, una letra y un número")
            return
        }
        if (nuevaContrasena !== confirmacion) {
            setError("Las contraseñas no coinciden")
            return
        }
        setIsSubmitting(true)
        try {
            const response = await fetch(`${API_URL}/recuperacion/cambiar-contrasena`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ numero_documento: documento, nueva_contrasena: nuevaContrasena }),
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.mensaje || "No se pudo cambiar la contraseña")
                return
            }
            setMensaje(data.mensaje)
            setSolicitud({ ...solicitud, estado: "usada" })
            setNuevaContrasena("")
            setConfirmacion("")
        } catch {
            setError("No se pudo conectar con el servidor")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <section className="flex min-h-[70vh] items-center justify-center bg-(--panna) px-4 py-12 sm:px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-faro">
                <h1 className="font-jost text-2xl font-semibold text-(--notte)">Recuperar contraseña</h1>
                <p className="mt-2 text-sm leading-6 text-(--inchiostro)/70">
                    Ingresa el número de documento de tu registro. El administrador deberá aprobar la solicitud.
                </p>

                <form className="mt-6" onSubmit={solicitud?.estado === "aprobada" ? actualizarContrasena : solicitarCambio}>
                    <Input
                        label="Número de documento"
                        name="numero_documento"
                        value={documento}
                        onChange={(event) => { setDocumento(event.target.value); setSolicitud(null); setError(""); setMensaje("") }}
                        placeholder="Entre 6 y 12 dígitos"
                        maxLength={12}
                    />
                    {solicitud?.estado === "aprobada" ? <><Input label="Nueva contraseña" name="nueva_contrasena" type="password" value={nuevaContrasena} onChange={(event) => setNuevaContrasena(event.target.value)} maxLength={20} /><Input label="Confirmar contraseña" name="confirmacion" type="password" value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} maxLength={20} /></> : null}
                    {error ? <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
                    {mensaje ? <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{mensaje}</p> : null}
                    <Button type="submit" variant="terracotta" fullWidth disabled={isSubmitting || solicitud?.estado === "usada"}>
                        {solicitud?.estado === "aprobada" ? "Guardar nueva contraseña" : "Solicitar recuperación"}
                    </Button>
                </form>

                {solicitud ? <p className="mt-4 text-center text-sm text-(--inchiostro)/70">Estado de solicitud: <strong>{solicitud.estado}</strong>{solicitud.minutos_restantes > 0 ? ` · ${solicitud.minutos_restantes} min restantes` : ""}</p> : null}

                <div className="mt-6 flex flex-col gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-sm font-medium text-(--azzurro) hover:underline"
                    >
                        ← Volver al inicio de sesión
                    </button>
                    <Link to="/" className="text-sm font-medium text-(--terracotta) hover:underline">
                        Ir al inicio
                    </Link>
                </div>
            </div>
        </section>
    )
}