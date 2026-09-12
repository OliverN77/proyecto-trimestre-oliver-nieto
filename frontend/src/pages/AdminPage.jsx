import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { API_URL, apiErrorMessage, readApiResponse } from "../api"
import Sidebar from "../components/Sidebar"

const ROLE_NAMES = { 1: "Administrador", 2: "Empleado", 3: "Cliente" }

const STATUS_COLORS = {
    pendiente: { bg: "rgba(232,178,61,0.12)", color: "#9a6e00" },
    confirmada: { bg: "rgba(107,124,78,0.12)", color: "var(--oliva)" },
    completada: { bg: "rgba(17,94,89,0.12)", color: "#0f766e" },
    cancelada: { bg: "rgba(193,80,46,0.12)", color: "var(--terracotta)" },
}

const SECTIONS = [
    { id: "usuarios", label: "Usuarios", description: "Consulta y administra las cuentas" },
    { id: "productos", label: "Productos", description: "Administra el menú y catálogo" },
    { id: "servicios", label: "Servicios", description: "Administra los servicios adicionales" },
    { id: "mesas", label: "Mesas", description: "Configura y administra las mesas del restaurante" },
    { id: "solicitudes", label: "Solicitudes", description: "Revisa recuperaciones" },
    { id: "reservaciones", label: "Reservaciones", description: "Gestiona todas las reservas" },
]



function Modal({ children, onClose }) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#16324f]/50 p-4 backdrop-blur-sm">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
                <button onClick={onClose} type="button" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800">
                    ✕
                </button>
                {children}
            </div>
        </div>
    )
}

// ─── Reservation Board (Admin view with Full CRUD) ────────────────────────────

function AdminReservationsBoard({ token, usuarios = [] }) {
    const today = new Date().toISOString().slice(0, 10)
    const [reservas, setReservas] = useState([])
    const [mesas, setMesas] = useState([])
    const [filtroFecha, setFiltroFecha] = useState(today)
    const [filtroEstado, setFiltroEstado] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [actualizando, setActualizando] = useState(null)

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingReservaId, setEditingReservaId] = useState(null)
    const [form, setForm] = useState({
        id_cliente: "",
        fecha_reserva: today,
        hora_inicio: "12:00",
        hora_fin: "14:00",
        cantidad_personas: 2,
        id_mesa: "",
        observaciones: "",
    })

    const clientes = usuarios.filter((u) => u.id_rol === 3)

    async function cargarMesas() {
        try {
            const response = await fetch(`${API_URL}/reservas/mesas`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                const data = await response.json()
                setMesas(data)
            }
        } catch {
            // silent fail
        }
    }

    async function cargarReservas() {
        setLoading(true)
        setError("")
        try {
            const params = new URLSearchParams()
            if (filtroFecha) params.set("fecha", filtroFecha)
            if (filtroEstado) params.set("estado", filtroEstado)
            const response = await fetch(`${API_URL}/reservas/todas?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await response.json()
            if (!response.ok) { setError(data.detail || "No se pudieron cargar las reservas"); return }
            setReservas(data)
        } catch {
            setError("No se pudo conectar con el servidor.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        cargarMesas()
    }, [token])

    useEffect(() => {
        cargarReservas()
    }, [filtroFecha, filtroEstado])

    async function actualizarEstado(id_reserva, estado) {
        setActualizando(id_reserva)
        try {
            const response = await fetch(`${API_URL}/reservas/${id_reserva}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ estado }),
            })
            if (response.ok) {
                cargarReservas()
            } else {
                const data = await response.json()
                setError(data.detail || "No se pudo actualizar el estado")
            }
        } catch {
            setError("No se pudo conectar con el servidor.")
        } finally {
            setActualizando(null)
        }
    }

    function abrirCrear() {
        setEditingReservaId(null)
        setForm({
            id_cliente: clientes[0]?.id_usuario || "",
            fecha_reserva: today,
            hora_inicio: "12:00",
            hora_fin: "14:00",
            cantidad_personas: 2,
            id_mesa: mesas[0]?.id_mesa || "",
            observaciones: "",
        })
        setError("")
        setIsModalOpen(true)
    }

    function editarReserva(reserva) {
        setEditingReservaId(reserva.id_reserva)
        setForm({
            id_cliente: reserva.id_cliente || "",
            fecha_reserva: reserva.fecha_reserva,
            hora_inicio: reserva.hora_inicio?.slice(0, 5) || "12:00",
            hora_fin: reserva.hora_fin?.slice(0, 5) || "14:00",
            cantidad_personas: reserva.cantidad_personas,
            id_mesa: reserva.id_mesa,
            observaciones: reserva.observaciones || "",
        })
        setError("")
        setIsModalOpen(true)
    }

    async function eliminarReserva(id_reserva) {
        if (!window.confirm("¿Estás seguro de eliminar esta reserva?")) return
        try {
            const response = await fetch(`${API_URL}/reservas/admin/${id_reserva}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                cargarReservas()
            } else {
                const data = await response.json()
                setError(data.detail || "No se pudo eliminar la reserva")
            }
        } catch {
            setError("Error de conexión al eliminar reserva")
        }
    }

    async function guardarReserva(e) {
        e.preventDefault()
        setError("")
        const url = editingReservaId
            ? `${API_URL}/reservas/admin/${editingReservaId}`
            : `${API_URL}/reservas/admin`
        const method = editingReservaId ? "PUT" : "POST"

        const payload = {
            id_cliente: Number(form.id_cliente),
            fecha_reserva: form.fecha_reserva,
            hora_inicio: form.hora_inicio,
            hora_fin: form.hora_fin,
            cantidad_personas: Number(form.cantidad_personas),
            id_mesa: Number(form.id_mesa),
            observaciones: form.observaciones || null,
        }

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            })
            const data = await response.json()
            if (!response.ok) {
                setError(data.detail || "No se pudo guardar la reserva")
                return
            }
            setIsModalOpen(false)
            cargarReservas()
        } catch {
            setError("No se pudo conectar con el servidor.")
        }
    }

    const columns = [
        { key: "pendiente", label: "Pendiente", icon: "⏳", actions: [{ label: "Confirmar", next: "confirmada", style: { background: "var(--oliva)", color: "white" } }, { label: "Completar", next: "completada", style: { background: "rgba(17,94,89,0.12)", color: "#0f766e", border: "1.5px solid #0f766e" } }, { label: "Cancelar", next: "cancelada", style: { background: "rgba(193,80,46,0.12)", color: "var(--terracotta)", border: "1.5px solid var(--terracotta)" } }] },
        { key: "confirmada", label: "Confirmada", icon: "✅", actions: [{ label: "Completar", next: "completada", style: { background: "rgba(17,94,89,0.12)", color: "#0f766e", border: "1.5px solid #0f766e" } }, { label: "Cancelar", next: "cancelada", style: { background: "rgba(193,80,46,0.12)", color: "var(--terracotta)", border: "1.5px solid var(--terracotta)" } }] },
        { key: "completada", label: "Completada", icon: "✓", actions: [] },
        { key: "cancelada", label: "Cancelada", icon: "✗", actions: [] },
    ]

    const byStatus = (key) => reservas.filter((r) => r.estado === key)

    return (
        <div>
            {/* Filter bar & Create button */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1.5rem", background: "white", borderRadius: "1rem", padding: "1rem 1.25rem", boxShadow: "var(--tw-shadow, 0 1px 6px rgba(0,0,0,0.07))" }}>
                <div style={{ flex: "1", minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Fecha</label>
                    <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="input-base" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }} />
                </div>
                <div style={{ flex: "1", minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Estado</label>
                    <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input-base" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                </div>
                <button type="button" onClick={cargarReservas} disabled={loading}
                    style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Cargando…" : "↺ Recargar"}
                </button>
                <button type="button" onClick={abrirCrear}
                    style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--oliva)", color: "white", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    + Crear reserva
                </button>
                <div style={{ marginLeft: "auto", fontSize: "0.82rem", color: "rgba(36,27,18,0.5)", alignSelf: "center" }}>
                    {reservas.length} reserva{reservas.length !== 1 ? "s" : ""}
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", borderRadius: "0.75rem", background: "rgba(193,80,46,0.08)", border: "1px solid rgba(193,80,46,0.25)", color: "var(--terracotta)", fontSize: "0.875rem" }}>
                    ⚠ {error}
                </div>
            )}

            {/* Kanban */}
            <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
                {columns.map((col) => {
                    const items = byStatus(col.key)
                    return (
                        <div key={col.key} className="kanban-col">
                            <div className="kanban-col-header" style={{ color: STATUS_COLORS[col.key]?.color || "var(--notte)" }}>
                                <span>{col.icon}</span>
                                <span>{col.label}</span>
                                <div className="kanban-count" style={{ background: STATUS_COLORS[col.key]?.color || "var(--notte)" }}>{items.length}</div>
                            </div>
                            {!items.length && (
                                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "rgba(36,27,18,0.35)", fontSize: "0.78rem" }}>Sin reservas</div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                {items.map((reserva) => (
                                    <div key={reserva.id_reserva} className="reserva-card" style={{ padding: "0.875rem 1rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                                            <div>
                                                <p style={{ fontWeight: 700, color: "var(--notte)", fontSize: "0.88rem", margin: 0 }}>Mesa {reserva.numero_mesa}</p>
                                                <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.55)", margin: "0.1rem 0 0" }}>{reserva.cliente_nombre} {reserva.cliente_apellido}</p>
                                            </div>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(36,27,18,0.45)", textAlign: "right" }}>#{reserva.id_reserva}</div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.625rem" }}>
                                            <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.65)", margin: 0 }}>📅 {reserva.fecha_reserva}</p>
                                            <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.65)", margin: 0 }}>⏰ {reserva.hora_inicio?.slice(0, 5)} – {reserva.hora_fin?.slice(0, 5)}</p>
                                            <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.65)", margin: 0 }}>👥 {reserva.cantidad_personas} personas</p>
                                            {reserva.observaciones && (
                                                <p style={{ fontSize: "0.73rem", color: "rgba(36,27,18,0.45)", fontStyle: "italic", margin: "0.1rem 0 0" }}>"{reserva.observaciones}"</p>
                                            )}
                                            {reserva.productos?.length > 0 && (
                                                <p style={{ fontSize: "0.73rem", color: "rgba(36,27,18,0.6)", margin: "0.2rem 0 0" }}>
                                                    🍽️ {reserva.productos.map(p => `${p.cantidad}x ${p.producto?.nombre}`).join(", ")}
                                                </p>
                                            )}
                                            {reserva.servicios?.length > 0 && (
                                                <p style={{ fontSize: "0.73rem", color: "rgba(36,27,18,0.6)", margin: "0.1rem 0 0" }}>
                                                    ✨ {reserva.servicios.map(s => `${s.cantidad}x ${s.servicio?.nombre}`).join(", ")}
                                                </p>
                                            )}
                                        </div>

                                        {/* Admin edit/delete buttons */}
                                        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                                            <button type="button" onClick={() => editarReserva(reserva)}
                                                style={{ padding: "0.25rem 0.55rem", borderRadius: "0.4rem", fontSize: "0.68rem", fontWeight: 600, background: "rgba(22,50,79,0.08)", color: "var(--notte)", border: "none", cursor: "pointer" }}>
                                                ✏️ Editar
                                            </button>
                                            <button type="button" onClick={() => eliminarReserva(reserva.id_reserva)}
                                                style={{ padding: "0.25rem 0.55rem", borderRadius: "0.4rem", fontSize: "0.68rem", fontWeight: 600, background: "rgba(193,80,46,0.1)", color: "var(--terracotta)", border: "none", cursor: "pointer" }}>
                                                🗑️ Eliminar
                                            </button>
                                        </div>

                                        {col.actions.length > 0 && (
                                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                                {col.actions.map((action) => (
                                                    <button
                                                        key={action.next}
                                                        type="button"
                                                        disabled={actualizando === reserva.id_reserva}
                                                        onClick={() => actualizarEstado(reserva.id_reserva, action.next)}
                                                        style={{ padding: "0.3rem 0.7rem", borderRadius: "0.45rem", fontSize: "0.72rem", fontWeight: 600, border: "none", cursor: actualizando === reserva.id_reserva ? "not-allowed" : "pointer", opacity: actualizando === reserva.id_reserva ? 0.6 : 1, transition: "opacity 150ms ease", ...action.style }}
                                                    >
                                                        {actualizando === reserva.id_reserva ? "…" : action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal for Admin Create / Edit Reserva */}
            {isModalOpen && (
                <Modal onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={guardarReserva}>
                        <h3 className="font-jost text-xl font-semibold text-(--notte)">
                            {editingReservaId ? `Editar reserva #${editingReservaId}` : "Crear reserva (Admin)"}
                        </h3>
                        {error && (
                            <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                ⚠ {error}
                            </div>
                        )}
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Cliente</label>
                                <select
                                    required
                                    value={form.id_cliente}
                                    onChange={(e) => setForm({ ...form, id_cliente: e.target.value })}
                                    className="input-base"
                                >
                                    <option value="">-- Seleccionar cliente --</option>
                                    {clientes.map((c) => (
                                        <option key={c.id_usuario} value={c.id_usuario}>
                                            {c.nombre} {c.apellido} ({c.correo})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Mesa</label>
                                <select
                                    required
                                    value={form.id_mesa}
                                    onChange={(e) => setForm({ ...form, id_mesa: e.target.value })}
                                    className="input-base"
                                >
                                    <option value="">-- Seleccionar mesa --</option>
                                    {mesas.map((m) => (
                                        <option key={m.id_mesa} value={m.id_mesa}>
                                            Mesa {m.numero_mesa} ({m.ubicacion} - Cap: {m.capacidad})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Fecha</label>
                                <input
                                    required
                                    type="date"
                                    value={form.fecha_reserva}
                                    onChange={(e) => setForm({ ...form, fecha_reserva: e.target.value })}
                                    className="input-base"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Personas</label>
                                <input
                                    required
                                    type="number"
                                    min="1"
                                    value={form.cantidad_personas}
                                    onChange={(e) => setForm({ ...form, cantidad_personas: e.target.value })}
                                    className="input-base"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Hora Inicio</label>
                                <input
                                    required
                                    type="time"
                                    value={form.hora_inicio}
                                    onChange={(e) => setForm({ ...form, hora_inicio: e.target.value })}
                                    className="input-base"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Hora Fin</label>
                                <input
                                    required
                                    type="time"
                                    value={form.hora_fin}
                                    onChange={(e) => setForm({ ...form, hora_fin: e.target.value })}
                                    className="input-base"
                                />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Observaciones</label>
                                <textarea
                                    value={form.observaciones}
                                    onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                    placeholder="Notas especiales..."
                                    className="input-base"
                                    rows="2"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="rounded-lg bg-(--notte) px-5 py-2.5 font-medium text-white shadow hover:bg-(--notte)/90"
                            >
                                {editingReservaId ? "Guardar cambios" : "Crear reserva"}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    )
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    const token = localStorage.getItem("token")
    const navigate = useNavigate()
    const [usuarios, setUsuarios] = useState([])

    const [productos, setProductos] = useState([])
    const [servicios, setServicios] = useState([])
    const [mesas, setMesas] = useState([])

    async function cargarServicios() {
        const response = await fetch(`${API_URL}/servicios`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudieron cargar los servicios"))
            return
        }
        setServicios(data)
    }

    const [error, setError] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [solicitudes, setSolicitudes] = useState([])
    
    // User Modal State
    const [isUserModalOpen, setIsUserModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState({
        nombre: "", apellido: "", tipo_documento: "CC", numero_documento: "",
        direccion: "", telefono: "", correo: "", contrasena: "", rol: "Cliente",
    })

    // Product Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false)
    const [editingProductoId, setEditingProductoId] = useState(null)
    const [productoForm, setProductoForm] = useState({
        nombre: "", descripcion: "", precio: "", estado: "disponible"
    })

    // Service Modal State
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
    const [editingServicioId, setEditingServicioId] = useState(null)
    const [servicioForm, setServicioForm] = useState({
        nombre: "", descripcion: "", precio: "", estado: "activo"
    })

    function abrirCrearServicio() {
        setEditingServicioId(null)
        setServicioForm({ nombre: "", descripcion: "", precio: "", estado: "activo" })
        setIsServiceModalOpen(true)
    }

    function editarServicio(item) {
        setEditingServicioId(item.id_servicio)
        setServicioForm({
            nombre: item.nombre,
            descripcion: item.descripcion || "",
            precio: item.precio,
            estado: item.estado,
        })
        setIsServiceModalOpen(true)
    }

    async function guardarServicio(event) {
        event.preventDefault()
        const method = editingServicioId ? "PUT" : "POST"
        const url = editingServicioId ? `${API_URL}/servicios/${editingServicioId}` : `${API_URL}/servicios`

        const payload = { ...servicioForm, precio: Number(servicioForm.precio) }

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudo guardar el servicio"))
            return
        }
        setMensaje(data.mensaje || (editingServicioId ? "Servicio actualizado" : "Servicio creado"))
        setIsServiceModalOpen(false)
        cargarServicios()
    }

    async function eliminarServicio(id) {
        if (!window.confirm("¿Eliminar este servicio?")) return
        const response = await fetch(`${API_URL}/servicios/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
            const data = await readApiResponse(response)
            setError(apiErrorMessage(data, "No se pudo eliminar el servicio"))
            return
        }
        setMensaje("Servicio eliminado correctamente")
        cargarServicios()
    }

    // Mesa Modal State
    const [isMesaModalOpen, setIsMesaModalOpen] = useState(false)
    const [editingMesaId, setEditingMesaId] = useState(null)
    const [mesaForm, setMesaForm] = useState({
        numero_mesa: "", capacidad: "", ubicacion: "interior", estado: "disponible"
    })

    const [activeSection, setActiveSection] = useState("usuarios")
    const [searchQuery, setSearchQuery] = useState("")

    function handleSectionChange(section) {
        setActiveSection(section)
        setSearchQuery("")
    }

    function handleChange(event) {
        const { name, value } = event.target
        setForm((previous) => ({ ...previous, [name]: value }))
        setError("")
    }

    function handleProductoChange(event) {
        const { name, value } = event.target
        setProductoForm((prev) => ({ ...prev, [name]: value }))
        setError("")
    }

    function handleServicioChange(event) {
        const { name, value } = event.target
        setServicioForm((prev) => ({ ...prev, [name]: value }))
        setError("")
    }


    function handleMesaChange(event) {
        const { name, value } = event.target
        setMesaForm((prev) => ({ ...prev, [name]: value }))
        setError("")
    }


    function cerrarSesion() {
        localStorage.removeItem("token")
        localStorage.removeItem("usuario")
        window.dispatchEvent(new Event("auth-change"))
        navigate("/")
    }

    function abrirCrearUsuario() {
        setEditingId(null)
        setForm({ nombre: "", apellido: "", tipo_documento: "CC", numero_documento: "", direccion: "", telefono: "", correo: "", contrasena: "", rol: "Cliente" })
        setIsUserModalOpen(true)
    }

    function editarUsuario(item) {
        setEditingId(item.id_usuario)
        setForm({ nombre: item.nombre, apellido: item.apellido, tipo_documento: item.tipo_documento, numero_documento: item.numero_documento, direccion: item.direccion || "", telefono: item.telefono, correo: item.correo, contrasena: "", rol: ROLE_NAMES[item.id_rol] })
        setIsUserModalOpen(true)
    }

    function abrirCrearProducto() {
        setEditingProductoId(null)
        setProductoForm({ nombre: "", descripcion: "", precio: "", estado: "disponible" })
        setIsProductModalOpen(true)
    }

    function editarProducto(item) {
        setEditingProductoId(item.id_producto)
        setProductoForm({
            nombre: item.nombre,
            descripcion: item.descripcion || "",
            precio: item.precio,
            estado: item.estado,
        })
        setIsProductModalOpen(true)
    }

    async function guardarUsuario(event) {
        event.preventDefault()
        const method = editingId ? "PUT" : "POST"
        const url = editingId ? `${API_URL}/usuarios/${editingId}` : `${API_URL}/usuarios`
        const response = await fetch(url, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(form) })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudo guardar el usuario"))
            return
        }
        setMensaje(data.mensaje || (editingId ? "Usuario actualizado correctamente" : "Usuario creado correctamente"))
        setIsUserModalOpen(false)
        cargarUsuarios()
    }

    async function guardarProducto(event) {
        event.preventDefault()
        const method = editingProductoId ? "PUT" : "POST"
        const url = editingProductoId ? `${API_URL}/productos/${editingProductoId}` : `${API_URL}/productos`
        
        const payload = { ...productoForm, precio: Number(productoForm.precio) }

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudo guardar el producto"))
            return
        }
        setMensaje(data.mensaje || (editingProductoId ? "Producto actualizado" : "Producto creado"))
        setIsProductModalOpen(false)
        cargarProductos()
    }

    async function cambiarRol(item, rol) {
        if (item.rol === rol) return
        const response = await fetch(`${API_URL}/usuarios/${item.id_usuario}/rol`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ rol }) })
        const data = await readApiResponse(response)
        if (!response.ok) setError(apiErrorMessage(data, "No se pudo cambiar el rol"))
        else { setMensaje(data.mensaje || "Rol actualizado correctamente"); cargarUsuarios() }
    }

    async function cargarSolicitudes() {
        const response = await fetch(`${API_URL}/recuperacion/solicitudes`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await response.json()
        if (response.ok) setSolicitudes(data)
    }

    async function resolverSolicitud(id, estado) {
        const response = await fetch(`${API_URL}/recuperacion/solicitudes/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ estado }) })
        const data = await readApiResponse(response)
        if (!response.ok) setError(apiErrorMessage(data, "No se pudo resolver la solicitud"))
        else { setMensaje(data.mensaje || "Solicitud actualizada correctamente"); cargarSolicitudes() }
    }

    async function eliminarSolicitud(id) {
        if (!window.confirm("¿Eliminar esta solicitud finalizada?")) return
        const response = await fetch(`${API_URL}/recuperacion/solicitudes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
        const data = await readApiResponse(response)
        if (!response.ok) setError(apiErrorMessage(data, "No se pudo eliminar la solicitud"))
        else { setMensaje(data.mensaje || "Solicitud eliminada correctamente"); cargarSolicitudes() }
    }

    async function cargarUsuarios() {
        const response = await fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudieron cargar los usuarios"))
            return
        }
        setUsuarios(data)
    }

    async function cargarProductos() {
        const response = await fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudieron cargar los productos"))
            return
        }
        setProductos(data)
    }

    async function cambiarEstado(usuarioActual) {
        const estado = usuarioActual.estado === "activo" ? "inactivo" : "activo"
        const response = await fetch(`${API_URL}/usuarios/${usuarioActual.id_usuario}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ estado }),
        })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudo cambiar el estado"))
            return
        }
        setMensaje(data.mensaje || "Estado actualizado correctamente")
        cargarUsuarios()
    }

    async function eliminarUsuario(id) {
        if (!window.confirm("¿Eliminar este usuario?")) return
        const response = await fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudo eliminar el usuario"))
            return
        }
        setMensaje(data.mensaje || "Usuario eliminado correctamente")
        cargarUsuarios()
    }

    async function eliminarProducto(id) {
        if (!window.confirm("¿Eliminar este producto?")) return
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
            const data = await readApiResponse(response)
            setError(apiErrorMessage(data, "No se pudo eliminar el producto"))
            return
        }
        setMensaje("Producto eliminado correctamente")
        cargarProductos()
    }

    function abrirCrearMesa() {
        setEditingMesaId(null)
        setMesaForm({ numero_mesa: "", capacidad: "", ubicacion: "interior", estado: "disponible" })
        setIsMesaModalOpen(true)
    }


    function editarMesa(item) {
        setEditingMesaId(item.id_mesa)
        setMesaForm({
            numero_mesa: item.numero_mesa,
            capacidad: item.capacidad,
            ubicacion: item.ubicacion,
            estado: item.estado,
        })
        setIsMesaModalOpen(true)
    }

    async function cargarMesas() {
        const response = await fetch(`${API_URL}/mesas`, { headers: { Authorization: `Bearer ${token}` } })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudieron cargar las mesas"))
            return
        }
        setMesas(data)
    }

    async function guardarMesa(event) {
        event.preventDefault()
        const method = editingMesaId ? "PUT" : "POST"
        const url = editingMesaId ? `${API_URL}/mesas/${editingMesaId}` : `${API_URL}/mesas`
        
        const payload = {
            ...mesaForm,
            numero_mesa: Number(mesaForm.numero_mesa),
            capacidad: Number(mesaForm.capacidad),
        }

        const response = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload)
        })
        const data = await readApiResponse(response)
        if (!response.ok) {
            setError(apiErrorMessage(data, "No se pudo guardar la mesa"))
            return
        }
        setMensaje(data.mensaje || (editingMesaId ? "Mesa actualizada correctamente" : "Mesa creada correctamente"))
        setIsMesaModalOpen(false)
        cargarMesas()
    }

    async function eliminarMesa(id) {
        if (!window.confirm("¿Eliminar esta mesa?")) return
        const response = await fetch(`${API_URL}/mesas/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!response.ok) {
            const data = await readApiResponse(response)
            setError(apiErrorMessage(data, "No se pudo eliminar la mesa"))
            return
        }
        setMensaje("Mesa eliminada correctamente")
        cargarMesas()
    }

    useEffect(() => {
        let isMounted = true
        Promise.all([
            fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/recuperacion/solicitudes`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/productos`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/mesas`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/servicios`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([usersRes, reqRes, prodRes, mesasRes, servRes]) => ({
                usersRes, reqRes, prodRes, mesasRes, servRes,
                users: await usersRes.json(),
                requests: await reqRes.json(),
                products: await prodRes.json(),
                mesasData: await mesasRes.json(),
                servicesData: await servRes.json(),
            }))
            .then(({ usersRes, reqRes, prodRes, mesasRes, servRes, users, requests, products, mesasData, servicesData }) => {
                if (!isMounted) return
                if (!usersRes.ok) setError(users.mensaje || "Error al cargar usuarios")
                else setUsuarios(users)
                if (reqRes.ok && Array.isArray(requests)) setSolicitudes(requests)
                if (prodRes.ok && Array.isArray(products)) setProductos(products)
                if (mesasRes.ok && Array.isArray(mesasData)) setMesas(mesasData)
                if (servRes.ok && Array.isArray(servicesData)) setServicios(servicesData)
            })
            .catch(() => { if (isMounted) setError("No se pudo conectar con el servidor") })
        return () => { isMounted = false }
    }, [token])


    if (!usuario) return <Navigate to="/login" replace />
    if (usuario.id_rol !== 1) return <Navigate to="/panel" replace />

    return (
        <Sidebar
            title="Administración"
            subtitle={usuario.nombre}
            sections={SECTIONS}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onLogout={cerrarSesion}
        >
            {/* Section header */}
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-(--terracotta)">Gestión interna</p>
                    <h2 className="mt-2 font-jost text-3xl font-semibold text-(--notte)">
                        {SECTIONS.find((s) => s.id === activeSection)?.label}
                    </h2>
                </div>
                
                <div className="flex items-center gap-4">
                    {activeSection !== "reservaciones" && (
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-base py-1.5 pl-9 text-sm"
                            />
                        </div>
                    )}

                    {activeSection === "usuarios" && (
                        <span className="rounded-full bg-(--limone)/20 px-3 py-1 text-sm text-(--notte)">{usuarios.length} usuarios</span>
                    )}
                    {activeSection === "productos" && (
                        <span className="rounded-full bg-(--limone)/20 px-3 py-1 text-sm text-(--notte)">{productos.length} productos</span>
                    )}
                    {activeSection === "servicios" && (
                        <span className="rounded-full bg-(--limone)/20 px-3 py-1 text-sm text-(--notte)">{servicios.length} servicios</span>
                    )}
                    {activeSection === "mesas" && (
                        <span className="rounded-full bg-(--limone)/20 px-3 py-1 text-sm text-(--notte)">{mesas.length} mesas</span>
                    )}
                </div>
            </div>

            {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {mensaje ? <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{mensaje}</p> : null}

            {/* ── User Modal ── */}
            {isUserModalOpen && (
                <Modal onClose={() => setIsUserModalOpen(false)}>
                    <form onSubmit={guardarUsuario}>
                        <h3 className="font-jost text-xl font-semibold text-(--notte)">{editingId ? "Editar usuario" : "Crear usuario"}</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <input required name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" className="input-base" />
                            <input required name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" className="input-base" />
                            <select name="tipo_documento" value={form.tipo_documento} onChange={handleChange} className="input-base"><option value="CC">CC</option><option value="CE">CE</option><option value="TI">TI</option><option value="PA">PA</option></select>
                            <input required name="numero_documento" value={form.numero_documento} onChange={handleChange} placeholder="Documento" maxLength={12} className="input-base" />
                            <input required name="telefono" value={form.telefono} onChange={handleChange} placeholder="Teléfono" maxLength={10} className="input-base" />
                            <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className="input-base" />
                            <input required type="email" name="correo" value={form.correo} onChange={handleChange} placeholder="Correo" className="input-base" />
                            <input required={!editingId} type="password" name="contrasena" value={form.contrasena} onChange={handleChange} placeholder={editingId ? "Nueva contraseña (opcional)" : "Contraseña"} className="input-base" />
                            <select name="rol" value={form.rol} onChange={handleChange} className="input-base"><option value="Cliente">Cliente</option><option value="Empleado">Empleado</option><option value="Administrador">Administrador</option></select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsUserModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button type="submit" className="rounded-lg bg-(--notte) px-5 py-2.5 font-medium text-white shadow hover:bg-(--notte)/90">{editingId ? "Guardar cambios" : "Crear usuario"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Product Modal ── */}
            {isProductModalOpen && (
                <Modal onClose={() => setIsProductModalOpen(false)}>
                    <form onSubmit={guardarProducto}>
                        <h3 className="font-jost text-xl font-semibold text-(--notte)">{editingProductoId ? "Editar producto" : "Crear producto"}</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <input required name="nombre" value={productoForm.nombre} onChange={handleProductoChange} placeholder="Nombre" className="input-base sm:col-span-2" />
                            <input name="descripcion" value={productoForm.descripcion} onChange={handleProductoChange} placeholder="Descripción" className="input-base sm:col-span-2" />
                            <input required type="number" step="0.01" min="0" name="precio" value={productoForm.precio} onChange={handleProductoChange} placeholder="Precio" className="input-base" />
                            <select name="estado" value={productoForm.estado} onChange={handleProductoChange} className="input-base">
                                <option value="disponible">Disponible</option>
                                <option value="agotado">Agotado</option>
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsProductModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button type="submit" className="rounded-lg bg-(--notte) px-5 py-2.5 font-medium text-white shadow hover:bg-(--notte)/90">{editingProductoId ? "Guardar cambios" : "Crear producto"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Service Modal ── */}
            {isServiceModalOpen && (
                <Modal onClose={() => setIsServiceModalOpen(false)}>
                    <form onSubmit={guardarServicio}>
                        <h3 className="font-jost text-xl font-semibold text-(--notte)">{editingServicioId ? "Editar servicio" : "Crear servicio"}</h3>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <input required name="nombre" value={servicioForm.nombre} onChange={handleServicioChange} placeholder="Nombre del servicio" className="input-base sm:col-span-2" />
                            <input name="descripcion" value={servicioForm.descripcion} onChange={handleServicioChange} placeholder="Descripción" className="input-base sm:col-span-2" />
                            <input required type="number" step="0.01" min="0" name="precio" value={servicioForm.precio} onChange={handleServicioChange} placeholder="Precio" className="input-base" />
                            <select name="estado" value={servicioForm.estado} onChange={handleServicioChange} className="input-base">
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsServiceModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button type="submit" className="rounded-lg bg-(--notte) px-5 py-2.5 font-medium text-white shadow hover:bg-(--notte)/90">{editingServicioId ? "Guardar cambios" : "Crear servicio"}</button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── Mesa Modal ── */}
            {isMesaModalOpen && (
                <Modal onClose={() => setIsMesaModalOpen(false)}>
                    <form onSubmit={guardarMesa}>
                        <h3 className="font-jost text-xl font-semibold text-(--notte)">{editingMesaId ? "Editar mesa" : "Crear mesa"}</h3>
                        <p className="mt-1 text-sm text-gray-500">Configura la información de la mesa para las reservaciones.</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Número de Mesa</label>
                                <input
                                    required
                                    min="1"
                                    type="number"
                                    name="numero_mesa"
                                    value={mesaForm.numero_mesa}
                                    onChange={handleMesaChange}
                                    placeholder="Ej: 1, 2, 3..."
                                    className="input-base w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Capacidad (Personas)</label>
                                <input
                                    required
                                    min="1"
                                    type="number"
                                    name="capacidad"
                                    value={mesaForm.capacidad}
                                    onChange={handleMesaChange}
                                    placeholder="Ej: 2, 4, 8..."
                                    className="input-base w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Ubicación</label>
                                <select
                                    name="ubicacion"
                                    value={mesaForm.ubicacion}
                                    onChange={handleMesaChange}
                                    className="input-base w-full capitalize"
                                >
                                    <option value="interior">Interior</option>
                                    <option value="terraza">Terraza</option>
                                    <option value="vip">VIP</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Estado</label>
                                <select
                                    name="estado"
                                    value={mesaForm.estado}
                                    onChange={handleMesaChange}
                                    className="input-base w-full"
                                >
                                    <option value="disponible">Disponible</option>
                                    <option value="ocupada">Ocupada</option>
                                    <option value="mantenimiento">Mantenimiento</option>
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsMesaModalOpen(false)} className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50">Cancelar</button>
                            <button type="submit" className="rounded-lg bg-(--notte) px-5 py-2.5 font-medium text-white shadow hover:bg-(--notte)/90">{editingMesaId ? "Guardar cambios" : "Crear mesa"}</button>
                        </div>
                    </form>
                </Modal>
            )}


            {/* ── Tabla de usuarios ── */}
            {activeSection === "usuarios" ? (
                <div className="mt-6">
                    <div className="mb-4 flex justify-end">
                        <button type="button" onClick={abrirCrearUsuario} className="rounded-lg bg-(--notte) px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-(--notte)/90 transition">
                            + Crear usuario
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl bg-white shadow-faro">
                        <table className="w-full min-w-190 text-left text-sm">
                            <thead className="bg-(--notte) text-(--panna)">
                                <tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr>
                            </thead>
                            <tbody>
                                {usuarios
                                    .filter(u => `${u.nombre} ${u.apellido} ${u.correo} ${u.numero_documento}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((item) => (
                                    <tr key={item.id_usuario} className="border-b border-(--notte)/10">
                                        <td className="p-4">{item.nombre} {item.apellido}</td>
                                        <td className="p-4">{item.correo}</td>
                                        <td className="p-4">
                                            <select value={ROLE_NAMES[item.id_rol]} onChange={(event) => cambiarRol(item, event.target.value)} className="rounded border border-(--notte)/20 bg-white px-2 py-1">
                                                <option value="Cliente">Cliente</option>
                                                <option value="Empleado">Empleado</option>
                                                <option value="Administrador">Administrador</option>
                                            </select>
                                        </td>
                                        <td className="p-4">{item.estado}</td>
                                        <td className="flex gap-2 p-4">
                                            <button type="button" onClick={() => editarUsuario(item)} className="rounded bg-(--azzurro) px-3 py-2 text-white">Editar</button>
                                            <button type="button" onClick={() => cambiarEstado(item)} className="rounded bg-(--terracotta) px-3 py-2 text-white">Cambiar estado</button>
                                            <button type="button" onClick={() => eliminarUsuario(item.id_usuario)} className="rounded bg-red-700 px-3 py-2 text-white">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {/* ── Servicios ── */}
            {activeSection === "servicios" ? (
                <div className="mt-6">
                    <div className="mb-4 flex justify-end">
                        <button type="button" onClick={abrirCrearServicio} className="rounded-lg bg-(--notte) px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-(--notte)/90 transition">
                            + Crear servicio
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl bg-white shadow-faro">
                        <table className="w-full min-w-190 text-left text-sm">
                            <thead className="bg-(--notte) text-(--panna)">
                                <tr><th className="p-4">ID</th><th className="p-4">Nombre</th><th className="p-4">Descripción</th><th className="p-4">Precio</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr>
                            </thead>
                            <tbody>
                                {servicios
                                    .filter(s => `${s.nombre} ${s.descripcion}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((item) => (
                                    <tr key={item.id_servicio} className="border-b border-(--notte)/10">
                                        <td className="p-4">{item.id_servicio}</td>
                                        <td className="p-4 font-semibold">{item.nombre}</td>
                                        <td className="p-4 text-(--inchiostro)/70 max-w-xs truncate">{item.descripcion || "—"}</td>
                                        <td className="p-4">${item.precio}</td>
                                        <td className="p-4">
                                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                                                item.estado === "activo"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : "bg-rose-100 text-rose-800"
                                            }`}>
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td className="flex gap-2 p-4">
                                            <button type="button" onClick={() => editarServicio(item)} className="rounded bg-(--azzurro) px-3 py-2 text-white">Editar</button>
                                            <button type="button" onClick={() => eliminarServicio(item.id_servicio)} className="rounded bg-red-700 px-3 py-2 text-white">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!servicios.length ? <p className="p-4 text-sm text-(--inchiostro)/60">No hay servicios registrados.</p> : null}
                    </div>
                </div>
            ) : null}

            {/* ── Productos ── */}
            {activeSection === "productos" ? (
                <div className="mt-6">
                    <div className="mb-4 flex justify-end">
                        <button type="button" onClick={abrirCrearProducto} className="rounded-lg bg-(--notte) px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-(--notte)/90 transition">
                            + Crear producto
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl bg-white shadow-faro">
                        <table className="w-full min-w-190 text-left text-sm">
                            <thead className="bg-(--notte) text-(--panna)">
                                <tr><th className="p-4">ID</th><th className="p-4">Nombre</th><th className="p-4">Precio</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr>
                            </thead>
                            <tbody>
                                {productos
                                    .filter(p => `${p.nombre} ${p.descripcion}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((item) => (
                                    <tr key={item.id_producto} className="border-b border-(--notte)/10">
                                        <td className="p-4">{item.id_producto}</td>
                                        <td className="p-4">{item.nombre}</td>
                                        <td className="p-4">${item.precio}</td>
                                        <td className="p-4">{item.estado}</td>
                                        <td className="flex gap-2 p-4">
                                            <button type="button" onClick={() => editarProducto(item)} className="rounded bg-(--azzurro) px-3 py-2 text-white">Editar</button>
                                            <button type="button" onClick={() => eliminarProducto(item.id_producto)} className="rounded bg-red-700 px-3 py-2 text-white">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!productos.length ? <p className="p-4 text-sm text-(--inchiostro)/60">No hay productos.</p> : null}
                    </div>
                </div>
            ) : null}

            {/* ── Mesas ── */}
            {activeSection === "mesas" ? (
                <div className="mt-6">
                    <div className="mb-4 flex justify-end">
                        <button type="button" onClick={abrirCrearMesa} className="rounded-lg bg-(--notte) px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-(--notte)/90 transition">
                            + Crear mesa
                        </button>
                    </div>
                    <div className="overflow-x-auto rounded-xl bg-white shadow-faro">
                        <table className="w-full min-w-190 text-left text-sm">
                            <thead className="bg-(--notte) text-(--panna)">
                                <tr>
                                    <th className="p-4">ID Mesa</th>
                                    <th className="p-4">Número de Mesa</th>
                                    <th className="p-4">Capacidad</th>
                                    <th className="p-4">Ubicación</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mesas
                                    .filter(m => `Mesa ${m.numero_mesa} ${m.ubicacion} ${m.capacidad}`.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((item) => (
                                    <tr key={item.id_mesa} className="border-b border-(--notte)/10">
                                        <td className="p-4 font-mono font-medium">{item.id_mesa}</td>
                                        <td className="p-4 font-semibold text-(--notte)">Mesa #{item.numero_mesa}</td>
                                        <td className="p-4">{item.capacidad} personas</td>
                                        <td className="p-4 capitalize">{item.ubicacion}</td>
                                        <td className="p-4">
                                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wider ${
                                                item.estado === "disponible"
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : item.estado === "ocupada"
                                                    ? "bg-amber-100 text-amber-800"
                                                    : "bg-rose-100 text-rose-800"
                                            }`}>
                                                {item.estado}
                                            </span>
                                        </td>
                                        <td className="flex gap-2 p-4">
                                            <button type="button" onClick={() => editarMesa(item)} className="rounded bg-(--azzurro) px-3 py-2 text-white hover:opacity-90 transition">Editar</button>
                                            <button type="button" onClick={() => eliminarMesa(item.id_mesa)} className="rounded bg-red-700 px-3 py-2 text-white hover:bg-red-800 transition">Eliminar</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!mesas.length ? <p className="p-4 text-sm text-(--inchiostro)/60">No hay mesas registradas.</p> : null}
                    </div>
                </div>
            ) : null}


            {/* ── Solicitudes ── */}
            {activeSection === "solicitudes" ? (
                <div className="mt-6 rounded-xl bg-white p-6 shadow-faro">
                    <h3 className="font-jost text-xl font-semibold text-(--notte)">Solicitudes de recuperación</h3>
                    <div className="mt-4 space-y-3">
                        {solicitudes
                            .filter(s => `${s.nombre} ${s.apellido} ${s.correo} ${s.numero_documento}`.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((solicitud) => (
                            <div key={solicitud.id_solicitud} className="flex flex-wrap items-center justify-between gap-3 border-b border-(--notte)/10 pb-3">
                                <div>
                                    <p className="font-medium">{solicitud.nombre} {solicitud.apellido}</p>
                                    <p className="text-sm text-(--inchiostro)/70">Documento: {solicitud.numero_documento} · Estado: {solicitud.estado}</p>
                                </div>
                                <div className="flex gap-2">
                                    {solicitud.estado === "pendiente" ? (
                                        <>
                                            <button type="button" onClick={() => resolverSolicitud(solicitud.id_solicitud, "aprobada")} className="rounded bg-(--oliva) px-3 py-2 text-sm text-white">Aprobar</button>
                                            <button type="button" onClick={() => resolverSolicitud(solicitud.id_solicitud, "rechazada")} className="rounded bg-red-700 px-3 py-2 text-sm text-white">Rechazar</button>
                                        </>
                                    ) : (
                                        <button type="button" onClick={() => eliminarSolicitud(solicitud.id_solicitud)} className="rounded bg-red-700 px-3 py-2 text-sm text-white">Eliminar</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    {!solicitudes.length ? <p className="mt-3 text-sm text-(--inchiostro)/60">No hay solicitudes.</p> : null}
                </div>
            ) : null}

            {/* ── Reservaciones ── */}
            {activeSection === "reservaciones" ? (
                <div className="mt-6">
                    <AdminReservationsBoard token={token} usuarios={usuarios} />
                </div>
            ) : null}
        </Sidebar>
    )
}
