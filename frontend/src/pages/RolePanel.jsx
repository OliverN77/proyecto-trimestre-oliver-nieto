import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "https://proyecto-trimestre.onrender.com/api"

function ProtectedPanel({ children }) {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    return usuario ? children : <Navigate to="/login" replace />
}

// ─── Admin Panel ───────────────────────────────────────────────────────────────

function AdminPanel() {
    const [usuarios, setUsuarios] = useState([])
    const [error, setError] = useState("")
    const token = localStorage.getItem("token")

    async function cargarUsuarios() {
        const response = await fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (!response.ok) {
            setError(data.mensaje || "No se pudieron cargar los usuarios")
            return
        }
        setUsuarios(data)
    }

    async function cambiarEstado(usuario) {
        const estado = usuario.estado === "activo" ? "inactivo" : "activo"
        await fetch(`${API_URL}/usuarios/${usuario.id_usuario}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado }),
        })
        cargarUsuarios()
    }

    async function eliminarUsuario(id) {
        await fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        cargarUsuarios()
    }

    useEffect(() => {
        let isMounted = true
        fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
            .then(async (response) => ({ response, data: await response.json() }))
            .then(({ response, data }) => {
                if (!isMounted) return
                if (!response.ok) {
                    setError(data.mensaje || "No se pudieron cargar los usuarios")
                    return
                }
                setUsuarios(data)
            })
            .catch(() => {
                if (isMounted) setError("No se pudo conectar con el servidor")
            })
        return () => { isMounted = false }
    }, [token])

    return (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-jost text-3xl font-semibold text-(--notte)">Panel de administrador</h1>
            {error ? <p className="mt-4 text-red-700">{error}</p> : null}
            <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-faro">
                <table className="w-full min-w-170 text-left text-sm">
                    <thead className="bg-(--notte) text-(--panna)">
                        <tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr>
                    </thead>
                    <tbody>
                        {usuarios.map((usuario) => (
                            <tr key={usuario.id_usuario} className="border-b border-(--notte)/10">
                                <td className="p-4">{usuario.nombre} {usuario.apellido}</td>
                                <td className="p-4">{usuario.correo}</td>
                                <td className="p-4">{usuario.id_rol}</td>
                                <td className="p-4">{usuario.estado}</td>
                                <td className="flex gap-2 p-4">
                                    <button type="button" onClick={() => cambiarEstado(usuario)} className="rounded bg-(--terracotta) px-3 py-2 text-white">Cambiar estado</button>
                                    <button type="button" onClick={() => eliminarUsuario(usuario.id_usuario)} className="rounded bg-red-700 px-3 py-2 text-white">Eliminar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}

// ─── Reservation Wizard (Customer) ────────────────────────────────────────────

const UBICACION_ICON = { "terraza": "🌿", "ventana": "🌅", "interior": "🕯️", "jardín": "🌸", "bar": "🍷" }

function getUbicacionIcon(ubicacion) {
    if (!ubicacion) return "🍽️"
    const key = ubicacion.toLowerCase()
    for (const [k, v] of Object.entries(UBICACION_ICON)) {
        if (key.includes(k)) return v
    }
    return "🍽️"
}

function StepIndicator({ step }) {
    const steps = ["Fecha y hora", "Mesa", "Platos", "Confirmación"]
    return (
        <div className="step-indicator">
            {steps.map((label, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? "1" : "0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
                        <div className={`step-dot${step === i + 1 ? " active" : step > i + 1 ? " done" : ""}`}>
                            {step > i + 1 ? "✓" : i + 1}
                        </div>
                        <span style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: step === i + 1 ? "var(--notte)" : step > i + 1 ? "var(--oliva)" : "rgba(36,27,18,0.4)", whiteSpace: "nowrap" }}>
                            {label}
                        </span>
                    </div>
                    {i < steps.length - 1 && <div className={`step-line${step > i + 1 ? " done" : ""}`} style={{ margin: "0 0.5rem", marginBottom: "1.2rem" }} />}
                </div>
            ))}
        </div>
    )
}

function ReservationWizard({ token, onReservaCreada, productos = [] }) {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState({ fecha_reserva: "", hora_inicio: "", hora_fin: "", cantidad_personas: "" })
    const [mesas, setMesas] = useState([])
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [platosSeleccionados, setPlatosSeleccionados] = useState([])
    const [observaciones, setObservaciones] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    async function buscarMesas() {
        setError("")
        const { fecha_reserva, hora_inicio, hora_fin, cantidad_personas } = form
        if (!fecha_reserva || !hora_inicio || !hora_fin || !cantidad_personas) {
            setError("Completa todos los campos para consultar disponibilidad.")
            return
        }
        if (hora_fin <= hora_inicio) {
            setError("La hora de fin debe ser posterior a la hora de inicio.")
            return
        }
        setLoading(true)
        try {
            const params = new URLSearchParams({ fecha: fecha_reserva, hora_inicio, hora_fin, personas: cantidad_personas })
            const response = await fetch(`${API_URL}/reservas/mesas-disponibles?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await response.json()
            if (!response.ok) { setError(data.detail || "No se pudieron consultar las mesas"); return }
            if (!data.length) { setError("No hay mesas disponibles para ese horario y número de personas."); return }
            setMesas(data)
            setMesaSeleccionada(null)
            setStep(2)
        } catch {
            setError("No se pudo conectar con el servidor.")
        } finally {
            setLoading(false)
        }
    }

    async function confirmarReserva() {
        if (!mesaSeleccionada) return
        setError("")
        setLoading(true)
        try {
            const body = {
                ...form,
                cantidad_personas: Number(form.cantidad_personas),
                id_mesa: mesaSeleccionada.id_mesa,
                observaciones: observaciones || null,
                productos: platosSeleccionados.map((p) => ({ id_producto: p.id_producto, cantidad: p.cantidad })),
            }
            const response = await fetch(`${API_URL}/reservas`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body),
            })
            const data = await response.json()
            if (!response.ok) { setError(data.detail || "No se pudo crear la reserva"); return }
            setSuccess(true)
            setStep(4)
            onReservaCreada(data)
        } catch {
            setError("No se pudo conectar con el servidor.")
        } finally {
            setLoading(false)
        }
    }

    function reiniciar() {
        setStep(1)
        setForm({ fecha_reserva: "", hora_inicio: "", hora_fin: "", cantidad_personas: "" })
        setMesas([])
        setMesaSeleccionada(null)
        setPlatosSeleccionados([])
        setObservaciones("")
        setError("")
        setSuccess(false)
    }

    const today = new Date().toISOString().slice(0, 10)

    function togglePlato(producto) {
        setPlatosSeleccionados((prev) => {
            const existing = prev.find((p) => p.id_producto === producto.id_producto)
            if (existing) {
                return prev.map((p) => (p.id_producto === producto.id_producto ? { ...p, cantidad: p.cantidad + 1 } : p))
            }
            return [...prev, { id_producto: producto.id_producto, nombre: producto.nombre, cantidad: 1, precio: producto.precio }]
        })
    }

    function removePlato(id_producto) {
        setPlatosSeleccionados((prev) => prev.filter((p) => p.id_producto !== id_producto))
    }

    return (
        <div className="rounded-2xl bg-white p-6 shadow-faro" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                <div>
                    <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--terracotta)", marginBottom: "0.3rem" }}>Reservas</p>
                    <h2 className="font-jost" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--notte)", margin: 0 }}>Reservar una mesa</h2>
                </div>
                {step > 1 && !success && (
                    <button type="button" onClick={() => { setStep(step - 1); setError("") }}
                        style={{ fontSize: "0.8rem", color: "var(--azzurro)", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        ← Volver
                    </button>
                )}
            </div>

            <StepIndicator step={step} />

            {error && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "rgba(193,80,46,0.08)", border: "1px solid rgba(193,80,46,0.25)", color: "var(--terracotta)", fontSize: "0.875rem" }}>
                    ⚠ {error}
                </div>
            )}

            {/* Step 1 — Date, time, guests */}
            {step === 1 && (
                <div className="animate-fade-up">
                    <p style={{ color: "rgba(36,27,18,0.6)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                        Elige cuándo quieres venir y para cuántas personas — te mostraremos las mesas disponibles.
                    </p>
                    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>
                                Fecha
                            </label>
                            <input id="reserva-fecha" type="date" min={today} value={form.fecha_reserva}
                                onChange={(e) => setForm({ ...form, fecha_reserva: e.target.value })} className="input-base" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>
                                Hora de llegada
                            </label>
                            <input id="reserva-hora-inicio" type="time" value={form.hora_inicio}
                                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} className="input-base" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>
                                Hora de salida
                            </label>
                            <input id="reserva-hora-fin" type="time" value={form.hora_fin}
                                onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} className="input-base" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>
                                Personas
                            </label>
                            <input id="reserva-personas" type="number" min="1" placeholder="¿Cuántos?" value={form.cantidad_personas}
                                onChange={(e) => setForm({ ...form, cantidad_personas: e.target.value })} className="input-base" />
                        </div>
                    </div>
                    <button id="reserva-buscar-btn" type="button" onClick={buscarMesas} disabled={loading}
                        style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", borderRadius: "0.75rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, transition: "opacity 200ms ease" }}>
                        {loading ? "Buscando…" : "Ver mesas disponibles →"}
                    </button>
                </div>
            )}

            {/* Step 2 — Table picker */}
            {step === 2 && (
                <div className="animate-fade-up">
                    <p style={{ color: "rgba(36,27,18,0.6)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                        {mesas.length} {mesas.length === 1 ? "mesa disponible" : "mesas disponibles"} para el <strong>{form.fecha_reserva}</strong> · {form.hora_inicio} – {form.hora_fin} · {form.cantidad_personas} personas
                    </p>
                    <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                        {mesas.map((mesa) => (
                            <div key={mesa.id_mesa} id={`mesa-tile-${mesa.id_mesa}`}
                                className={`table-tile${mesaSeleccionada?.id_mesa === mesa.id_mesa ? " selected" : ""}`}
                                onClick={() => setMesaSeleccionada(mesa)}>
                                <div className="table-tile-icon">{getUbicacionIcon(mesa.ubicacion)}</div>
                                <div className="table-tile-num">Mesa {mesa.numero_mesa}</div>
                                <div className="table-tile-cap">👥 {mesa.capacidad} personas</div>
                                <div className="table-tile-loc">{mesa.ubicacion}</div>
                                {mesaSeleccionada?.id_mesa === mesa.id_mesa && (
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.7rem", fontWeight: 700, color: "var(--terracotta)" }}>✓ Seleccionada</div>
                                )}
                            </div>
                        ))}
                    </div>
                    {mesaSeleccionada && (
                        <button id="reserva-siguiente-btn" type="button" onClick={() => { setError(""); setStep(3) }}
                            style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", borderRadius: "0.75rem", background: "var(--terracotta)", color: "white", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer", transition: "opacity 200ms ease" }}>
                            Continuar con Mesa {mesaSeleccionada.numero_mesa} →
                        </button>
                    )}
                </div>
            )}

            {/* Step 3 — Optional pre-order dishes */}
            {step === 3 && (
                <div className="animate-fade-up">
                    <p style={{ color: "rgba(36,27,18,0.6)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                        ¿Te gustaría pre-ordenar tus platos? Es opcional, pero ayuda a que tu comida esté lista más rápido.
                    </p>
                    
                    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1fr) 300px" }}>
                        <div style={{ maxHeight: "300px", overflowY: "auto", paddingRight: "0.5rem" }}>
                            <div className="space-y-2">
                                {productos.map((producto) => (
                                    <div key={`reserva-prod-${producto.id_producto}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(22,50,79,0.1)" }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--notte)", margin: 0 }}>{producto.nombre}</p>
                                            <p style={{ fontSize: "0.75rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>${producto.precio}</p>
                                        </div>
                                        <button type="button" onClick={() => togglePlato(producto)} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.3rem", background: "rgba(107,124,78,0.12)", color: "var(--oliva)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}>+ Añadir</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: "rgba(22,50,79,0.03)", borderRadius: "0.75rem", padding: "1rem", alignSelf: "start" }}>
                            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--notte)", margin: "0 0 1rem 0" }}>Platos seleccionados</h4>
                            {platosSeleccionados.length === 0 ? (
                                <p style={{ fontSize: "0.8rem", color: "rgba(36,27,18,0.5)", fontStyle: "italic", margin: 0 }}>Ningún plato seleccionado.</p>
                            ) : (
                                <div className="space-y-3">
                                    {platosSeleccionados.map((p) => (
                                        <div key={`sel-${p.id_producto}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "var(--notte)", color: "white", padding: "0.1rem 0.4rem", borderRadius: "0.2rem" }}>{p.cantidad}x</span>
                                                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--notte)" }}>{p.nombre}</span>
                                            </div>
                                            <button type="button" onClick={() => removePlato(p.id_producto)} style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer", fontSize: "0.75rem", padding: "0.2rem" }}>✕</button>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(22,50,79,0.1)", display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem", color: "var(--notte)" }}>
                                        <span>Total estimado</span>
                                        <span>${platosSeleccionados.reduce((acc, p) => acc + (p.cantidad * p.precio), 0).toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button id="reserva-siguiente-btn-2" type="button" onClick={() => { setError(""); setStep(4) }}
                        style={{ marginTop: "1.5rem", padding: "0.75rem 2rem", borderRadius: "0.75rem", background: "var(--notte)", color: "white", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer", transition: "opacity 200ms ease" }}>
                        Continuar a confirmación →
                    </button>
                </div>
            )}

            {/* Step 4 — Confirm or success */}
            {step === 4 && !success && (
                <div className="animate-fade-up">
                    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", marginBottom: "1.25rem" }}>
                        {[
                            ["📅 Fecha", form.fecha_reserva],
                            ["⏰ Horario", `${form.hora_inicio} – ${form.hora_fin}`],
                            ["🍽️ Mesa", `#${mesaSeleccionada?.numero_mesa} · ${mesaSeleccionada?.ubicacion}`],
                            ["👥 Personas", form.cantidad_personas],
                        ].map(([label, value]) => (
                            <div key={label} style={{ background: "rgba(22,50,79,0.04)", borderRadius: "0.75rem", padding: "0.875rem 1rem" }}>
                                <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "rgba(36,27,18,0.5)", margin: "0 0 0.25rem 0" }}>{label}</p>
                                <p style={{ fontWeight: 600, color: "var(--notte)", fontSize: "0.95rem", margin: 0 }}>{value}</p>
                            </div>
                        ))}
                    </div>
                    
                    {platosSeleccionados.length > 0 && (
                        <div style={{ marginBottom: "1.25rem", background: "rgba(107,124,78,0.06)", borderRadius: "0.75rem", padding: "1rem" }}>
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--oliva)", margin: "0 0 0.75rem 0" }}>Platos pre-ordenados</p>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.5rem" }}>
                                {platosSeleccionados.map((p) => (
                                    <li key={`conf-prod-${p.id_producto}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--notte)" }}>
                                        <span><strong style={{ opacity: 0.7 }}>{p.cantidad}x</strong> {p.nombre}</span>
                                        <span style={{ fontWeight: 600 }}>${(p.cantidad * p.precio).toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>
                            Notas especiales (opcional)
                        </label>
                        <textarea id="reserva-obs" value={observaciones} onChange={(e) => setObservaciones(e.target.value)}
                            placeholder="Alergias, ocasión especial, preferencias de asiento…"
                            rows={3}
                            style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid rgba(22,50,79,0.2)", background: "white", padding: "0.625rem 1rem", color: "var(--inchiostro)", outline: "none", resize: "vertical", fontFamily: "inherit", fontSize: "0.875rem", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
                        <button id="reserva-confirmar-btn" type="button" onClick={confirmarReserva} disabled={loading}
                            style={{ padding: "0.75rem 2rem", borderRadius: "0.75rem", background: "var(--terracotta)", color: "white", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, flex: 1, transition: "opacity 200ms ease" }}>
                            {loading ? "Reservando…" : "✓ Confirmar reserva"}
                        </button>
                    </div>
                </div>
            )}

            {/* Success state */}
            {step === 4 && success && (
                <div className="animate-fade-up" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                    <div className="animate-pop-in" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "5rem", height: "5rem", borderRadius: "50%", background: "rgba(107,124,78,0.12)", marginBottom: "1.25rem" }}>
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="22" stroke="var(--oliva)" strokeWidth="2.5" fill="none" />
                            <polyline className="success-check" points="14,25 21,32 34,17" fill="none" stroke="var(--oliva)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h3 style={{ fontFamily: "Jost, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--notte)", marginBottom: "0.5rem" }}>
                        ¡Reserva confirmada!
                    </h3>
                    <p style={{ color: "rgba(36,27,18,0.6)", fontSize: "0.9rem", marginBottom: "1.75rem" }}>
                        Mesa {mesaSeleccionada?.numero_mesa} · {form.fecha_reserva} · {form.hora_inicio} – {form.hora_fin}.<br />
                        Te esperamos con gusto en la Taberna del Faro.
                    </p>
                    <button id="reserva-nueva-btn" type="button" onClick={reiniciar}
                        style={{ padding: "0.625rem 1.75rem", borderRadius: "0.75rem", border: "2px solid var(--notte)", background: "transparent", color: "var(--notte)", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer" }}>
                        Hacer otra reserva
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── My Reservations list (Customer) ──────────────────────────────────────────

const STATUS_LABELS = { pendiente: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada", completada: "Completada" }

function ReservationsList({ reservas, token, onActualizado }) {
    const [cancelando, setCancelando] = useState(null)

    async function cancelarReserva(id_reserva) {
        setCancelando(id_reserva)
        try {
            await fetch(`${API_URL}/reservas/${id_reserva}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            onActualizado()
        } finally {
            setCancelando(null)
        }
    }

    return (
        <div style={{ marginTop: "2rem" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--terracotta)" }}>Historial</p>
                <h2 className="font-jost" style={{ fontSize: "1.3rem", fontWeight: 700, color: "var(--notte)", margin: 0 }}>Mis reservas</h2>
            </div>
            {!reservas.length ? (
                <div style={{ borderRadius: "1rem", border: "2px dashed rgba(22,50,79,0.15)", padding: "2.5rem", textAlign: "center", color: "rgba(36,27,18,0.45)", fontSize: "0.875rem" }}>
                    Aún no tienes reservas. ¡Haz tu primera reserva arriba!
                </div>
            ) : (
                <div style={{ display: "grid", gap: "0.75rem" }}>
                    {reservas.map((reserva) => (
                        <div key={reserva.id_reserva} className="reserva-card" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
                            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                                <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.625rem", background: "rgba(22,50,79,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                                    🍽️
                                </div>
                                <div>
                                    <p style={{ fontWeight: 700, color: "var(--notte)", fontSize: "0.95rem", marginBottom: "0.2rem" }}>
                                        Mesa {reserva.numero_mesa}
                                        <span style={{ marginLeft: "0.5rem", fontWeight: 400, color: "rgba(36,27,18,0.5)", fontSize: "0.8rem" }}>·  {reserva.fecha_reserva}</span>
                                    </p>
                                    <p style={{ fontSize: "0.82rem", color: "rgba(36,27,18,0.6)", marginBottom: "0.3rem" }}>
                                        ⏰ {reserva.hora_inicio?.slice(0, 5)} – {reserva.hora_fin?.slice(0, 5)} &nbsp;·&nbsp; 👥 {reserva.cantidad_personas} personas
                                    </p>
                                    {reserva.observaciones && (
                                        <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.45)", fontStyle: "italic", marginBottom: "0.3rem", marginTop: "0.2rem" }}>"{reserva.observaciones}"</p>
                                    )}
                                    {reserva.productos?.length > 0 && (
                                        <div style={{ marginTop: "0.5rem" }}>
                                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--oliva)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>Platos pre-ordenados</p>
                                            <p style={{ fontSize: "0.8rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>
                                                {reserva.productos.map(p => `${p.cantidad}x ${p.producto?.nombre}`).join(", ")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                                <span className={`status-badge ${reserva.estado}`}>{STATUS_LABELS[reserva.estado] || reserva.estado}</span>
                                {reserva.estado === "pendiente" && (
                                    <button id={`cancelar-reserva-${reserva.id_reserva}`} type="button" onClick={() => cancelarReserva(reserva.id_reserva)} disabled={cancelando === reserva.id_reserva}
                                        style={{ fontSize: "0.75rem", padding: "0.3rem 0.8rem", borderRadius: "0.5rem", border: "1.5px solid var(--terracotta)", background: "transparent", color: "var(--terracotta)", cursor: "pointer", fontWeight: 600 }}>
                                        {cancelando === reserva.id_reserva ? "Cancelando…" : "Cancelar"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Client Panel ─────────────────────────────────────────────────────────────

function ClientPanel() {
    const [perfil, setPerfil] = useState(null)
    const [productos, setProductos] = useState([])
    const [servicios, setServicios] = useState([])
    const [carrito, setCarrito] = useState([])
    const [pedidos, setPedidos] = useState([])
    const [reservas, setReservas] = useState([])
    const [error, setError] = useState("")
    const [mensaje, setMensaje] = useState("")
    const token = localStorage.getItem("token")

    async function cargarPedidos() {
        const response = await fetch(`${API_URL}/pedidos/mios`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (response.ok) setPedidos(data)
    }

    async function cargarReservas() {
        const response = await fetch(`${API_URL}/reservas/mias`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (response.ok) setReservas(data)
    }

    async function crearPedido() {
        if (!carrito.length) return
        const response = await fetch(`${API_URL}/pedidos`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                productos: carrito.filter((item) => item.tipo === "producto").map((item) => ({ id_producto: item.id, cantidad: item.cantidad })),
                servicios: carrito.filter((item) => item.tipo === "servicio").map((item) => ({ id_servicio: item.id, cantidad: item.cantidad })),
            }),
        })
        const data = await response.json()
        if (!response.ok) {
            setError(data.mensaje || "No se pudo crear el pedido")
            return
        }
        setMensaje(`${data.mensaje}. Total: $${data.total}`)
        setCarrito([])
        cargarPedidos()
    }

    useEffect(() => {
        let isMounted = true
        Promise.all([
            fetch(`${API_URL}/auth/perfil`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/servicios`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/pedidos/mios`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/reservas/mias`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([profileResponse, productsResponse, servicesResponse, ordersResponse, reservationsResponse]) => ({
                profile: await profileResponse.json(),
                products: await productsResponse.json(),
                services: await servicesResponse.json(),
                orders: await ordersResponse.json(),
                reservations: await reservationsResponse.json(),
                profileResponse,
                productsResponse,
                servicesResponse,
                ordersResponse,
                reservationsResponse,
            }))
            .then(({ profile, products, services, orders, reservations, profileResponse, productsResponse, servicesResponse, ordersResponse, reservationsResponse }) => {
                if (!isMounted) return
                if (!profileResponse.ok || !productsResponse.ok || !servicesResponse.ok || !ordersResponse.ok || !reservationsResponse.ok) setError("No se pudo cargar la información del cliente")
                else { setPerfil(profile); setProductos(products); setServicios(services); setPedidos(orders); setReservas(reservations) }
            })
            .catch(() => { if (isMounted) setError("No se pudo conectar con el servidor") })
        return () => { isMounted = false }
    }, [token])

    return (
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
            <h1 className="font-jost text-3xl font-semibold text-(--notte)">Panel de cliente</h1>
            {error ? <p className="mt-4 text-red-700">{error}</p> : null}
            {mensaje ? <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{mensaje}</p> : null}
            {perfil ? <div className="mt-6 rounded-xl bg-white p-6 shadow-faro"><p className="text-lg font-semibold">Bienvenido, {perfil.nombre} {perfil.apellido}</p><p className="mt-2 text-(--inchiostro)/75">Correo: {perfil.correo}</p><p className="text-(--inchiostro)/75">Teléfono: {perfil.telefono}</p><p className="text-(--inchiostro)/75">Estado: {perfil.estado}</p></div> : null}
            <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <ReservationWizard token={token} productos={productos} onReservaCreada={(nueva) => { setReservas((actual) => [nueva, ...actual]) }} />
                <div className="rounded-xl bg-white p-6 shadow-faro">
                    <h2 className="font-jost text-xl font-semibold text-(--notte)">Nuevo pedido</h2>
                    <div className="mt-4 space-y-3">{productos.map((producto) => <SelectableItem key={`producto-${producto.id_producto}`} id={producto.id_producto} tipo="producto" nombre={producto.nombre} precio={producto.precio} onAdd={() => setCarrito((actual) => addToCart(actual, { id: producto.id_producto, tipo: "producto", nombre: producto.nombre, cantidad: 1 }))} />)}{servicios.map((servicio) => <SelectableItem key={`servicio-${servicio.id_servicio}`} id={servicio.id_servicio} tipo="servicio" nombre={servicio.nombre} precio={servicio.precio} onAdd={() => setCarrito((actual) => addToCart(actual, { id: servicio.id_servicio, tipo: "servicio", nombre: servicio.nombre, cantidad: 1 }))} />)}</div>
                    <p className="mt-4 text-sm">Productos seleccionados: {carrito.reduce((total, item) => total + item.cantidad, 0)}</p>
                    <button type="button" disabled={!carrito.length} onClick={crearPedido} className="mt-3 rounded bg-(--terracotta) px-4 py-2 font-medium text-white disabled:opacity-50">Confirmar pedido</button>
                </div>
                <OrdersList pedidos={pedidos} />
            </div>
            <ReservationsList reservas={reservas} token={token} onActualizado={cargarReservas} />
        </section>
    )
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

function addToCart(cart, item) {
    const existing = cart.find((cartItem) => cartItem.id === item.id && cartItem.tipo === item.tipo)
    return existing ? cart.map((cartItem) => cartItem.id === item.id && cartItem.tipo === item.tipo ? { ...cartItem, cantidad: cartItem.cantidad + 1 } : cartItem) : [...cart, item]
}

function SelectableItem({ tipo, nombre, precio, onAdd }) {
    return <div className="flex items-center justify-between border-b border-(--notte)/10 pb-3"><div><p className="font-medium">{nombre} <span className="text-xs uppercase text-(--terracotta)">{tipo}</span></p><p className="text-sm text-(--inchiostro)/70">${precio || 0}</p></div><button type="button" onClick={onAdd} className="rounded bg-(--azzurro) px-3 py-2 text-white">Agregar</button></div>
}

function OrdersList({ pedidos }) {
    return <div className="rounded-xl bg-white p-6 shadow-faro"><h2 className="font-jost text-xl font-semibold text-(--notte)">Mis pedidos</h2><ul className="mt-4 space-y-3">{pedidos.map((pedido) => <li key={pedido.id_pedido} className="border-b border-(--notte)/10 pb-3"><p className="font-medium">Pedido #{pedido.id_pedido} · ${pedido.total}</p><p className="text-sm text-(--inchiostro)/70">Estado: {pedido.estado} · Empleado: {pedido.empleado_nombre} {pedido.empleado_apellido}</p></li>)}</ul>{!pedidos.length ? <p className="mt-4 text-sm text-(--inchiostro)/60">Aún no tienes pedidos.</p> : null}</div>
}

// ─── Employee Panel ────────────────────────────────────────────────────────────

function CatalogList({ title, items, price = false }) {
    return <div className="rounded-xl bg-white p-6 shadow-faro"><h2 className="font-jost text-xl font-semibold text-(--notte)">{title}</h2><ul className="mt-4 space-y-3">{items.map((item) => <li key={item.id_producto || item.id_servicio} className="border-b border-(--notte)/10 pb-3"><span className="font-medium">{item.nombre}</span><span className="ml-2 text-sm text-(--inchiostro)/70">{price ? `$${item.precio}` : item.estado}</span></li>)}</ul></div>
}

function EmployeePanel() {
    const [catalog, setCatalog] = useState({ productos: [], servicios: [] })
    const [error, setError] = useState("")
    const token = localStorage.getItem("token")

    useEffect(() => {
        let isMounted = true
        const headers = { Authorization: `Bearer ${token}` }
        Promise.all([fetch(`${API_URL}/productos`, { headers }), fetch(`${API_URL}/servicios`, { headers })])
            .then(async ([productsResponse, servicesResponse]) => ({
                productsResponse,
                servicesResponse,
                productos: await productsResponse.json(),
                servicios: await servicesResponse.json(),
            }))
            .then(({ productsResponse, servicesResponse, productos, servicios }) => {
                if (!isMounted) return
                if (!productsResponse.ok || !servicesResponse.ok) {
                    setError("No se pudo cargar el catálogo")
                    return
                }
                setCatalog({ productos, servicios })
            })
            .catch(() => { if (isMounted) setError("No se pudo conectar con el servidor") })
        return () => { isMounted = false }
    }, [token])

    return (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-jost text-3xl font-semibold text-(--notte)">Panel de empleado</h1>
            {error ? <p className="mt-4 text-red-700">{error}</p> : null}
            <div className="mt-8 grid gap-6 md:grid-cols-2">
                <CatalogList title="Productos" items={catalog.productos} price />
                <CatalogList title="Servicios" items={catalog.servicios} />
            </div>
        </section>
    )
}

// ─── Root export ───────────────────────────────────────────────────────────────

export default function RolePanel() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    if (!usuario) return <ProtectedPanel><div /></ProtectedPanel>
    if (usuario.id_rol === 1) return <AdminPanel />
    if (usuario.id_rol === 2) return <EmployeePanel />
    return <ClientPanel />
}
