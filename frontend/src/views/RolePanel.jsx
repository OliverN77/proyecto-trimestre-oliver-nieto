import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import DashboardCliente from "../components/DashboardCliente"
import PQRModule from "../components/PQRModule"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

// ─── Shared helpers ────────────────────────────────────────────────────────────

const STATUS_LABELS = { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada"}

const UBICACION_ICON = { "terraza": "🌿", "ventana": "🌅", "interior": "🕯️", "jardín": "🌸", "bar": "🍷" }

function formatCurrency(amount) {
    return Number(amount).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getUbicacionIcon(ubicacion) {
    if (!ubicacion) return "🍽️"
    const key = ubicacion.toLowerCase()
    for (const [k, v] of Object.entries(UBICACION_ICON)) {
        if (key.includes(k)) return v
    }
    return "🍽️"
}

// ─── Step Indicator ────────────────────────────────────────────────────────────

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

// ─── Reservation Wizard ────────────────────────────────────────────────────────

function ReservationWizard({ token, onReservaCreada, productos = [], servicios = [] }) {
    const [step, setStep] = useState(1)
    const [form, setForm] = useState({ fecha_reserva: "", hora_inicio: "", hora_fin: "", cantidad_personas: "" })
    const [mesas, setMesas] = useState([])
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [platosSeleccionados, setPlatosSeleccionados] = useState([])
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
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

        // Validate VIP requirement on client side
        if (mesaSeleccionada.ubicacion?.toLowerCase() === "vip") {
            if (!platosSeleccionados.length || !serviciosSeleccionados.length) {
                setError("Las mesas VIP requieren al menos 1 producto y 1 servicio para completar la reserva.")
                return
            }
        }

        setLoading(true)
        try {
            const body = {
                ...form,
                cantidad_personas: Number(form.cantidad_personas),
                id_mesa: mesaSeleccionada.id_mesa,
                observaciones: observaciones || null,
                productos: platosSeleccionados.map((p) => ({ id_producto: p.id_producto, cantidad: p.cantidad })),
                servicios: serviciosSeleccionados.map((s) => ({ id_servicio: s.id_servicio, cantidad: s.cantidad })),
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
        setServiciosSeleccionados([])
        setObservaciones("")
        setError("")
        setSuccess(false)
    }

    const today = new Date().toISOString().slice(0, 10)

    function togglePlato(producto) {
        setPlatosSeleccionados((prev) => {
            const existing = prev.find((p) => p.id_producto === producto.id_producto)
            if (existing) return prev.map((p) => p.id_producto === producto.id_producto ? { ...p, cantidad: p.cantidad + 1 } : p)
            return [...prev, { id_producto: producto.id_producto, nombre: producto.nombre, cantidad: 1, precio: producto.precio }]
        })
    }

    function removePlato(id_producto) {
        setPlatosSeleccionados((prev) => prev.filter((p) => p.id_producto !== id_producto))
    }

    function toggleServicio(servicio) {
        setServiciosSeleccionados((prev) => {
            const existing = prev.find((s) => s.id_servicio === servicio.id_servicio)
            if (existing) return prev.map((s) => s.id_servicio === servicio.id_servicio ? { ...s, cantidad: s.cantidad + 1 } : s)
            return [...prev, { id_servicio: servicio.id_servicio, nombre: servicio.nombre, cantidad: 1, precio: servicio.precio }]
        })
    }

    function removeServicio(id_servicio) {
        setServiciosSeleccionados((prev) => prev.filter((s) => s.id_servicio !== id_servicio))
    }

    const isVip = mesaSeleccionada?.ubicacion?.toLowerCase() === "vip"

    return (
        <div className="rounded-2xl bg-white p-6 shadow-faro">
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
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>Fecha</label>
                            <input id="reserva-fecha" type="date" min={today} value={form.fecha_reserva}
                                onChange={(e) => setForm({ ...form, fecha_reserva: e.target.value })} className="input-base" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>Hora de llegada</label>
                            <input id="reserva-hora-inicio" type="time" value={form.hora_inicio}
                                onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })} className="input-base" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>Hora de salida</label>
                            <input id="reserva-hora-fin" type="time" value={form.hora_fin}
                                onChange={(e) => setForm({ ...form, hora_fin: e.target.value })} className="input-base" />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>Personas</label>
                            <input id="reserva-personas" type="number" min={1} max={8} placeholder="¿Cuántos?" value={form.cantidad_personas}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (val !== "") {
                                        let num = parseInt(val, 10);
                                        if (num > 8) val = "8";
                                        if (num < 1) val = "1";
                                    }
                                    setForm({ ...form, cantidad_personas: val })
                                }} className="input-base" />
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

            {/* Step 3 — Optional pre-order dishes + services */}
            {step === 3 && (
                <div className="animate-fade-up">
                    {isVip && (
                        <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "rgba(232,178,61,0.12)", border: "1px solid rgba(232,178,61,0.4)", color: "#9a6e00", fontSize: "0.85rem", fontWeight: 600 }}>
                            ⭐ Mesa VIP — Se requiere al menos <strong>1 producto</strong> y <strong>1 servicio</strong> para confirmar la reserva.
                        </div>
                    )}
                    <p style={{ color: "rgba(36,27,18,0.6)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                        ¿Te gustaría pre-ordenar platos o servicios adicionales? Ayuda a que tu visita esté lista.
                    </p>

                    {/* Products */}
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--notte)", marginBottom: "0.75rem" }}>🍽️ Platos</h4>
                    <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1fr) 280px", marginBottom: "1.5rem" }}>
                        <div style={{ maxHeight: "240px", overflowY: "auto", paddingRight: "0.5rem" }}>
                            <div className="space-y-2">
                                {productos.map((producto) => (
                                    <div key={`reserva-prod-${producto.id_producto}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(22,50,79,0.1)" }}>
                                        <div>
                                            <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--notte)", margin: 0 }}>{producto.nombre}</p>
                                            <p style={{ fontSize: "0.75rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>${formatCurrency(producto.precio)}</p>
                                        </div>
                                        <button type="button" onClick={() => togglePlato(producto)} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.3rem", background: "rgba(107,124,78,0.12)", color: "var(--oliva)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}>+ Añadir</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ background: "rgba(22,50,79,0.03)", borderRadius: "0.75rem", padding: "1rem", alignSelf: "start" }}>
                            <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--notte)", margin: "0 0 1rem 0" }}>Platos seleccionados</h4>
                            {platosSeleccionados.length === 0 ? (
                                <p style={{ fontSize: "0.8rem", color: "rgba(36,27,18,0.5)", fontStyle: "italic", margin: 0 }}>Ningún plato.</p>
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
                                    <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(22,50,79,0.1)", fontWeight: 700, fontSize: "0.85rem", color: "var(--notte)", display: "flex", justifyContent: "space-between" }}>
                                        <span>Subtotal platos</span>
                                        <span>${formatCurrency(platosSeleccionados.reduce((acc, p) => acc + p.cantidad * p.precio, 0))}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Services */}
                    {servicios.length > 0 && (
                        <>
                            <h4 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--notte)", marginBottom: "0.75rem", marginTop: "0.5rem" }}>✨ Servicios adicionales</h4>
                            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(0, 1fr) 280px", marginBottom: "1.5rem" }}>
                                <div style={{ maxHeight: "240px", overflowY: "auto", paddingRight: "0.5rem" }}>
                                    <div className="space-y-2">
                                        {servicios.filter(s => s.estado === "activo").map((servicio) => (
                                            <div key={`reserva-serv-${servicio.id_servicio}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", borderRadius: "0.5rem", border: "1px solid rgba(22,50,79,0.1)" }}>
                                                <div>
                                                    <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--notte)", margin: 0 }}>{servicio.nombre}</p>
                                                    <p style={{ fontSize: "0.75rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>{servicio.descripcion} — ${formatCurrency(servicio.precio)}</p>
                                                </div>
                                                <button type="button" onClick={() => toggleServicio(servicio)} style={{ padding: "0.25rem 0.75rem", borderRadius: "0.3rem", background: "rgba(22,50,79,0.1)", color: "var(--notte)", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.75rem" }}>+ Añadir</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ background: "rgba(22,50,79,0.03)", borderRadius: "0.75rem", padding: "1rem", alignSelf: "start" }}>
                                    <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--notte)", margin: "0 0 1rem 0" }}>Servicios seleccionados</h4>
                                    {serviciosSeleccionados.length === 0 ? (
                                        <p style={{ fontSize: "0.8rem", color: "rgba(36,27,18,0.5)", fontStyle: "italic", margin: 0 }}>Ningún servicio.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {serviciosSeleccionados.map((s) => (
                                                <div key={`ssel-${s.id_servicio}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ fontSize: "0.75rem", fontWeight: 600, background: "var(--notte)", color: "white", padding: "0.1rem 0.4rem", borderRadius: "0.2rem" }}>{s.cantidad}x</span>
                                                        <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--notte)" }}>{s.nombre}</span>
                                                    </div>
                                                    <button type="button" onClick={() => removeServicio(s.id_servicio)} style={{ background: "none", border: "none", color: "var(--terracotta)", cursor: "pointer", fontSize: "0.75rem", padding: "0.2rem" }}>✕</button>
                                                </div>
                                            ))}
                                            <div style={{ marginTop: "0.75rem", paddingTop: "0.5rem", borderTop: "1px solid rgba(22,50,79,0.1)", fontWeight: 700, fontSize: "0.85rem", color: "var(--notte)", display: "flex", justifyContent: "space-between" }}>
                                                <span>Subtotal servicios</span>
                                                <span>${formatCurrency(serviciosSeleccionados.reduce((acc, s) => acc + s.cantidad * s.precio, 0))}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}

                    {(platosSeleccionados.length > 0 || serviciosSeleccionados.length > 0) && (
                        <div style={{ background: "rgba(232,178,61,0.15)", border: "1px solid rgba(232,178,61,0.3)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--notte)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total pre-orden</span>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--notte)" }}>
                                ${formatCurrency(
                                    platosSeleccionados.reduce((acc, p) => acc + p.cantidad * p.precio, 0) + 
                                    serviciosSeleccionados.reduce((acc, s) => acc + s.cantidad * s.precio, 0)
                                )}
                            </span>
                        </div>
                    )}

                    <button id="reserva-siguiente-btn-2" type="button" onClick={() => { setError(""); setStep(4) }}
                        style={{ marginTop: "0.5rem", padding: "0.75rem 2rem", borderRadius: "0.75rem", background: "var(--notte)", color: "white", fontWeight: 600, fontSize: "0.9rem", border: "none", cursor: "pointer", transition: "opacity 200ms ease" }}>
                        Continuar a confirmación →
                    </button>
                </div>
            )}

            {/* Step 4 — Confirm */}
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
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--oliva)", margin: "0 0 0.75rem 0" }}>🍽️ Platos pre-ordenados</p>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.5rem" }}>
                                {platosSeleccionados.map((p) => (
                                    <li key={`conf-prod-${p.id_producto}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--notte)" }}>
                                        <span><strong style={{ opacity: 0.7 }}>{p.cantidad}x</strong> {p.nombre}</span>
                                        <span style={{ fontWeight: 600 }}>${formatCurrency(p.cantidad * p.precio)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {serviciosSeleccionados.length > 0 && (
                        <div style={{ marginBottom: "1.25rem", background: "rgba(22,50,79,0.04)", borderRadius: "0.75rem", padding: "1rem" }}>
                            <p style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--notte)", margin: "0 0 0.75rem 0" }}>✨ Servicios adicionales</p>
                            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "0.5rem" }}>
                                {serviciosSeleccionados.map((s) => (
                                    <li key={`conf-serv-${s.id_servicio}`} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--notte)" }}>
                                        <span><strong style={{ opacity: 0.7 }}>{s.cantidad}x</strong> {s.nombre}</span>
                                        <span style={{ fontWeight: 600 }}>${formatCurrency(s.cantidad * s.precio)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {(platosSeleccionados.length > 0 || serviciosSeleccionados.length > 0) && (
                        <div style={{ background: "rgba(232,178,61,0.15)", borderRadius: "0.75rem", padding: "1rem", marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--notte)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total pre-orden</span>
                            <span style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--notte)" }}>
                                ${formatCurrency(
                                    platosSeleccionados.reduce((acc, p) => acc + p.cantidad * p.precio, 0) + 
                                    serviciosSeleccionados.reduce((acc, s) => acc + s.cantidad * s.precio, 0)
                                )}
                            </span>
                        </div>
                    )}
                    <div>
                        <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(22,50,79,0.6)", marginBottom: "0.4rem" }}>Notas especiales (opcional)</label>
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
                    <h3 style={{ fontFamily: "Jost, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "var(--notte)", marginBottom: "0.5rem" }}>¡Reserva confirmada!</h3>
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

// ─── My Reservations List ──────────────────────────────────────────────────────

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
        <div className="rounded-2xl bg-white p-6 shadow-faro">
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
                                <div style={{ width: "2.75rem", height: "2.75rem", borderRadius: "0.625rem", background: "rgba(22,50,79,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>🍽️</div>
                                <div>
                                    <p style={{ fontWeight: 700, color: "var(--notte)", fontSize: "0.95rem", marginBottom: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                        Mesa {reserva.numero_mesa}
                                        {reserva.estado === "pendiente" || reserva.estado === "confirmada" ? (
                                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "0.3rem", background: "rgba(193,80,46,0.12)", color: "var(--terracotta)", fontWeight: 600 }}>
                                                Mesa Ocupada
                                            </span>
                                        ) : null}
                                        {reserva.estado === "completada" && (
                                            <span style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem", borderRadius: "0.3rem", background: "rgba(17,94,89,0.12)", color: "#0f766e", fontWeight: 600 }}>
                                                Completada
                                            </span>
                                        )}
                                        <span style={{ fontWeight: 400, color: "rgba(36,27,18,0.5)", fontSize: "0.8rem" }}>· {reserva.fecha_reserva}</span>
                                    </p>

                                    <p style={{ fontSize: "0.82rem", color: "rgba(36,27,18,0.6)", marginBottom: "0.3rem" }}>
                                        ⏰ {reserva.hora_inicio?.slice(0, 5)} – {reserva.hora_fin?.slice(0, 5)} &nbsp;·&nbsp; 👥 {reserva.cantidad_personas} personas
                                    </p>
                                    {reserva.observaciones && (
                                        <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.45)", fontStyle: "italic", marginBottom: "0.3rem", marginTop: "0.2rem" }}>"{reserva.observaciones}"</p>
                                    )}
                                    {reserva.productos?.length > 0 && (
                                        <div style={{ marginTop: "0.5rem" }}>
                                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--oliva)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>🍽️ Platos pre-ordenados</p>
                                            <p style={{ fontSize: "0.8rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>
                                                {reserva.productos.map(p => `${p.cantidad}x ${p.producto?.nombre}`).join(", ")}
                                            </p>
                                        </div>
                                    )}
                                    {reserva.servicios?.length > 0 && (
                                        <div style={{ marginTop: "0.5rem" }}>
                                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--notte)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>✨ Servicios adicionales</p>
                                            <p style={{ fontSize: "0.8rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>
                                                {reserva.servicios.map(s => `${s.cantidad}x ${s.servicio?.nombre}`).join(", ")}
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

const CLIENT_SECTIONS = [
    { id: "dashboard", label: "Dashboard", description: "Resumen de tu cuenta" },
    { id: "nueva", label: "Nueva reserva", description: "Reserva una mesa" },
    { id: "mias", label: "Mis reservas", description: "Historial de reservas" },
    { id: "pqr", label: "Mis PQR", description: "Registra quejas o peticiones" },
]

function ClientPanel() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    const token = localStorage.getItem("token")
    const navigate = useNavigate()
    const [productos, setProductos] = useState([])
    const [servicios, setServicios] = useState([])
    const [reservas, setReservas] = useState([])
    const [error, setError] = useState("")
    const [activeSection, setActiveSection] = useState("dashboard")

    async function cargarReservas() {
        const response = await fetch(`${API_URL}/reservas/mias`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (response.ok) setReservas(data)
    }

    useEffect(() => {
        let isMounted = true
        Promise.all([
            fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/reservas/mias`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/servicios`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([productsRes, reservasRes, serviciosRes]) => ({
                products: await productsRes.json(),
                reservations: await reservasRes.json(),
                servicesData: await serviciosRes.json(),
                productsRes,
                reservasRes,
                serviciosRes,
            }))
            .then(({ products, reservations, servicesData, productsRes, reservasRes, serviciosRes }) => {
                if (!isMounted) return
                if (!productsRes.ok || !reservasRes.ok) setError("No se pudo cargar la información")
                else { setProductos(products); setReservas(reservations) }
                if (serviciosRes.ok && Array.isArray(servicesData)) setServicios(servicesData)
            })
            .catch(() => { if (isMounted) setError("No se pudo conectar con el servidor") })
        return () => { isMounted = false }
    }, [token])

    function cerrarSesion() {
        localStorage.removeItem("token")
        localStorage.removeItem("usuario")
        window.dispatchEvent(new Event("auth-change"))
        navigate("/")
    }

    return (
        <Sidebar
            title="Mi cuenta"
            subtitle={usuario?.nombre}
            sections={CLIENT_SECTIONS}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onLogout={cerrarSesion}
        >
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-(--terracotta)">Panel de cliente</p>
                    <h2 className="mt-2 font-jost text-3xl font-semibold text-(--notte)">
                        {CLIENT_SECTIONS.find((s) => s.id === activeSection)?.label}
                    </h2>
                </div>
            </div>

            {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            <div className="mt-6">
                {activeSection === "dashboard" && <DashboardCliente token={token} />}
                {activeSection === "nueva" && (
                    <ReservationWizard
                        token={token}
                        productos={productos}
                        servicios={servicios}
                        onReservaCreada={(nueva) => {
                            setReservas((actual) => [nueva, ...actual])
                            setActiveSection("mias")
                        }}
                    />
                )}
                {activeSection === "mias" && (
                    <ReservationsList reservas={reservas} token={token} onActualizado={cargarReservas} />
                )}
                {activeSection === "pqr" && <PQRModule token={token} userRole={3} />}
            </div>
        </Sidebar>
    )
}

// ─── Root export ───────────────────────────────────────────────────────────────

export default function RolePanel() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    if (!usuario) return <Navigate to="/login" replace />
    if (usuario.id_rol === 1) return <Navigate to="/admin" replace />
    if (usuario.id_rol === 2) return <Navigate to="/empleado" replace />
    return <ClientPanel />
}
