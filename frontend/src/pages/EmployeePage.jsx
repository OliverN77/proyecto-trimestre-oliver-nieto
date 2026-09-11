/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"

const API_URL = import.meta.env.VITE_API_URL || "https://proyecto-trimestre.onrender.com/api"

const STATUS_LABELS = { pendiente: "Pendiente", confirmada: "Confirmada", completada: "Completada", cancelada: "Cancelada" }
const STATUS_COLORS = {
    pendiente: { bg: "rgba(232,178,61,0.12)", color: "#9a6e00" },
    confirmada: { bg: "rgba(107,124,78,0.12)", color: "var(--oliva)" },
    completada: { bg: "rgba(78,147,184,0.12)", color: "#2d6f91" },
    cancelada: { bg: "rgba(193,80,46,0.12)", color: "var(--terracotta)" },
}

// ─── Reservations Management Board ────────────────────────────────────────────

function ManageDishesModal({ reserva, catalogProductos, token, onClose, onUpdated }) {
    const [platos, setPlatos] = useState(reserva.productos?.map(p => ({ id_producto: p.id_producto, cantidad: p.cantidad, nombre: p.producto?.nombre })) || [])
    const [loading, setLoading] = useState(false)

    function togglePlato(prod) {
        setPlatos((prev) => {
            const exists = prev.find(p => p.id_producto === prod.id_producto)
            if (exists) return prev.map(p => p.id_producto === prod.id_producto ? { ...p, cantidad: p.cantidad + 1 } : p)
            return [...prev, { id_producto: prod.id_producto, cantidad: 1, nombre: prod.nombre }]
        })
    }

    function removePlato(id) {
        setPlatos(prev => prev.filter(p => p.id_producto !== id))
    }

    async function guardar() {
        setLoading(true)
        try {
            await fetch(`${API_URL}/reservas/${reserva.id_reserva}/productos`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(platos.map(p => ({ id_producto: p.id_producto, cantidad: p.cantidad })))
            })
            onUpdated()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(22,50,79,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
            <div style={{ background: "white", padding: "1.5rem", borderRadius: "1rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--notte)", marginBottom: "1rem" }}>Gestionar platos (Reserva #{reserva.id_reserva})</h3>
                
                <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr" }}>
                    <div>
                        <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--notte)", marginBottom: "0.5rem" }}>Catálogo</h4>
                        <div style={{ maxHeight: "250px", overflowY: "auto", display: "grid", gap: "0.5rem" }}>
                            {catalogProductos.map(p => (
                                <div key={p.id_producto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", background: "rgba(22,50,79,0.03)", borderRadius: "0.5rem" }}>
                                    <span style={{ fontSize: "0.8rem" }}>{p.nombre}</span>
                                    <button type="button" onClick={() => togglePlato(p)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "var(--oliva)", color: "white", borderRadius: "0.3rem", border: "none", cursor: "pointer" }}>+</button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 style={{ fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase", color: "var(--notte)", marginBottom: "0.5rem" }}>Seleccionados</h4>
                        <div style={{ maxHeight: "250px", overflowY: "auto", display: "grid", gap: "0.5rem" }}>
                            {platos.map(p => (
                                <div key={p.id_producto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem", background: "rgba(107,124,78,0.1)", borderRadius: "0.5rem" }}>
                                    <span style={{ fontSize: "0.8rem" }}>{p.cantidad}x {p.nombre}</span>
                                    <button type="button" onClick={() => removePlato(p.id_producto)} style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", background: "var(--terracotta)", color: "white", borderRadius: "0.3rem", border: "none", cursor: "pointer" }}>✕</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "1.5rem", justifyContent: "flex-end" }}>
                    <button type="button" onClick={onClose} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "1px solid rgba(22,50,79,0.2)", background: "white", cursor: "pointer" }}>Cancelar</button>
                    <button type="button" onClick={guardar} disabled={loading} style={{ padding: "0.5rem 1rem", borderRadius: "0.5rem", border: "none", background: "var(--notte)", color: "white", cursor: "pointer" }}>
                        {loading ? "Guardando..." : "Guardar platos"}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ReservationsBoard({ token, catalogProductos }) {
    const today = new Date().toISOString().slice(0, 10)
    const [reservas, setReservas] = useState([])
    const [filtroFecha, setFiltroFecha] = useState(today)
    const [filtroEstado, setFiltroEstado] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [actualizando, setActualizando] = useState(null)

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

    async function actualizarEstado(id_reserva, estado) {
        setActualizando(id_reserva)
        try {
            const response = await fetch(`${API_URL}/reservas/${id_reserva}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ estado }),
            })
            if (response.ok) {
                const updated = await response.json()
                setReservas((prev) => prev.map((r) => r.id_reserva === id_reserva ? { ...r, estado: updated.estado } : r))
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

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => { cargarReservas() }, [filtroFecha, filtroEstado, cargarReservas])

    // Group reservas by status
    const columns = [
        { key: "pendiente", label: "Pendiente", icon: "⏳", actions: [{ label: "Confirmar", next: "confirmada", style: { background: "var(--oliva)", color: "white" } }, { label: "Cancelar", next: "cancelada", style: { background: "rgba(193,80,46,0.12)", color: "var(--terracotta)", border: "1.5px solid var(--terracotta)" } }] },
        { key: "confirmada", label: "Confirmada", icon: "✅", actions: [{ label: "Completar", next: "completada", style: { background: "var(--azzurro)", color: "white" } }, { label: "Cancelar", next: "cancelada", style: { background: "rgba(193,80,46,0.12)", color: "var(--terracotta)", border: "1.5px solid var(--terracotta)" } }] },
        { key: "completada", label: "Completada", icon: "🎉", actions: [] },
        { key: "cancelada", label: "Cancelada", icon: "✗", actions: [] },
    ]

    const byStatus = (key) => reservas.filter((r) => r.estado === key)

    return (
        <div style={{ marginTop: "2.5rem" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--terracotta)", margin: 0 }}>Gestión</p>
                <h2 className="font-jost" style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--notte)", margin: 0 }}>Reservaciones</h2>
            </div>

            {/* Filter bar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", marginBottom: "1.5rem", background: "white", borderRadius: "1rem", padding: "1rem 1.25rem", boxShadow: "var(--tw-shadow, 0 1px 6px rgba(0,0,0,0.07))" }}>
                <div style={{ flex: "1", minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Fecha</label>
                    <input id="empleado-filtro-fecha" type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} className="input-base" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }} />
                </div>
                <div style={{ flex: "1", minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Estado</label>
                    <select id="empleado-filtro-estado" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="input-base" style={{ paddingTop: "0.5rem", paddingBottom: "0.5rem" }}>
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                </div>
                <button id="empleado-recargar-btn" type="button" onClick={cargarReservas} disabled={loading}
                    style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
                    {loading ? "Cargando…" : "↺ Recargar"}
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

            {/* Kanban columns */}
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
                                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "rgba(36,27,18,0.35)", fontSize: "0.78rem" }}>
                                    Sin reservas
                                </div>
                            )}
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                {items.map((reserva) => (
                                    <ReservaKanbanCard
                                        key={reserva.id_reserva}
                                        reserva={reserva}
                                        actions={col.actions}
                                        actualizando={actualizando}
                                        onActualizar={actualizarEstado}
                                        catalogProductos={catalogProductos}
                                        onPlatosActualizados={cargarReservas}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function ReservaKanbanCard({ reserva, actions, actualizando, onActualizar, catalogProductos, onPlatosActualizados }) {
    const isUpdating = actualizando === reserva.id_reserva
    const [editingDishes, setEditingDishes] = useState(false)

    return (
        <div className="reserva-card" style={{ padding: "0.875rem 1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                <div>
                    <p style={{ fontWeight: 700, color: "var(--notte)", fontSize: "0.88rem", margin: 0 }}>
                        Mesa {reserva.numero_mesa}
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.55)", margin: "0.1rem 0 0" }}>
                        {reserva.cliente_nombre} {reserva.cliente_apellido}
                    </p>
                </div>
                <div style={{ fontSize: "0.7rem", fontWeight: 600, color: "rgba(36,27,18,0.45)", textAlign: "right" }}>
                    #{reserva.id_reserva}
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem", marginBottom: "0.625rem" }}>
                <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.65)", margin: 0 }}>
                    📅 {reserva.fecha_reserva}
                </p>
                <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.65)", margin: 0 }}>
                    ⏰ {reserva.hora_inicio?.slice(0, 5)} – {reserva.hora_fin?.slice(0, 5)}
                </p>
                <p style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.65)", margin: 0 }}>
                    👥 {reserva.cantidad_personas} personas
                </p>
                {reserva.observaciones && (
                    <p style={{ fontSize: "0.73rem", color: "rgba(36,27,18,0.45)", fontStyle: "italic", margin: "0.1rem 0 0" }}>
                        "{reserva.observaciones}"
                    </p>
                )}
                {reserva.productos?.length > 0 && (
                    <div style={{ marginTop: "0.3rem" }}>
                        <p style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--oliva)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.1rem" }}>Platos</p>
                        <p style={{ fontSize: "0.75rem", color: "rgba(36,27,18,0.6)", margin: 0 }}>
                            {reserva.productos.map(p => `${p.cantidad}x ${p.producto?.nombre}`).join(", ")}
                        </p>
                    </div>
                )}
            </div>

            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                <button type="button" onClick={() => setEditingDishes(true)} style={{ padding: "0.2rem 0.5rem", borderRadius: "0.4rem", fontSize: "0.65rem", fontWeight: 600, background: "rgba(22,50,79,0.06)", color: "var(--notte)", border: "none", cursor: "pointer" }}>
                    🍽️ Gestionar platos
                </button>
            </div>

            {actions.length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {actions.map((action) => (
                        <button
                            key={action.next}
                            id={`reserva-${reserva.id_reserva}-${action.next}`}
                            type="button"
                            disabled={isUpdating}
                            onClick={() => onActualizar(reserva.id_reserva, action.next)}
                            style={{
                                padding: "0.3rem 0.7rem",
                                borderRadius: "0.45rem",
                                fontSize: "0.72rem",
                                fontWeight: 600,
                                border: "none",
                                cursor: isUpdating ? "not-allowed" : "pointer",
                                opacity: isUpdating ? 0.6 : 1,
                                transition: "opacity 150ms ease",
                                ...action.style,
                            }}
                        >
                            {isUpdating ? "…" : action.label}
                        </button>
                    ))}
                </div>
            )}
            
            {editingDishes && (
                <ManageDishesModal
                    reserva={reserva}
                    catalogProductos={catalogProductos}
                    token={token}
                    onClose={() => setEditingDishes(false)}
                    onUpdated={onPlatosActualizados}
                />
            )}
        </div>
    )
}

// ─── Orders Card ───────────────────────────────────────────────────────────────

function OrderCard({ pedido, token, onUpdated }) {
    async function updateStatus(estado) {
        await fetch(`${API_URL}/pedidos/${pedido.id_pedido}/estado`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ estado }) })
        onUpdated()
    }

    return <article className="rounded-lg border border-(--notte)/10 p-4"><div className="flex flex-wrap justify-between gap-2"><p className="font-medium">Pedido #{pedido.id_pedido} · ${pedido.total}</p><span className="text-sm text-(--terracotta)">{pedido.estado}</span></div><p className="mt-1 text-sm text-(--inchiostro)/70">Cliente: {pedido.cliente_nombre} {pedido.cliente_apellido}</p><div className="mt-3 flex flex-wrap gap-2">{pedido.estado === "pendiente" ? <button type="button" onClick={() => updateStatus("preparando")} className="rounded bg-(--azzurro) px-3 py-2 text-sm text-white">Empezar preparación</button> : null}{pedido.estado === "preparando" ? <button type="button" onClick={() => updateStatus("completado")} className="rounded bg-(--oliva) px-3 py-2 text-sm text-white">Marcar completado</button> : null}{pedido.estado === "pendiente" || pedido.estado === "preparando" ? <button type="button" onClick={() => updateStatus("cancelado")} className="rounded bg-red-700 px-3 py-2 text-sm text-white">Cancelar</button> : null}</div></article>
}

function CatalogList({ title, items, showPrice = false, onSelect }) {
    return (
        <div className="rounded-xl bg-white p-6 shadow-faro">
            <h2 className="font-jost text-xl font-semibold text-(--notte)">{title}</h2>
            <ul className="mt-4 space-y-3">
                {items.map((item) => (
                    <li key={item.id_producto || item.id_servicio} className="border-b border-(--notte)/10 pb-3">
                        <span className="font-medium">{item.nombre}</span>
                        <span className="ml-2 text-sm text-(--inchiostro)/70">{showPrice ? `$${item.precio}` : item.estado}</span>
                        {onSelect ? <button type="button" onClick={() => onSelect(item)} className="ml-3 rounded bg-(--azzurro) px-2 py-1 text-xs text-white">Seleccionar</button> : null}
                    </li>
                ))}
            </ul>
        </div>
    )
}

// ─── Employee Page ─────────────────────────────────────────────────────────────

export default function EmployeePage() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    const token = localStorage.getItem("token")
    const [catalog, setCatalog] = useState({ productos: [], servicios: [] })
    const [pedidos, setPedidos] = useState([])
    const [serviciosSeleccionados, setServiciosSeleccionados] = useState([])
    const [activeTab, setActiveTab] = useState("pedidos")
    const [error, setError] = useState("")

    useEffect(() => {
        let isMounted = true
        const headers = { Authorization: `Bearer ${token}` }
        Promise.all([fetch(`${API_URL}/productos`, { headers }), fetch(`${API_URL}/servicios`, { headers }), fetch(`${API_URL}/pedidos/asignados`, { headers })])
            .then(async ([productosResponse, serviciosResponse, pedidosResponse]) => ({
                productosResponse,
                serviciosResponse,
                pedidosResponse,
                productos: await productosResponse.json(),
                servicios: await serviciosResponse.json(),
                pedidos: await pedidosResponse.json(),
            }))
            .then(({ productosResponse, serviciosResponse, pedidosResponse, productos, servicios, pedidos }) => {
                if (!isMounted) return
                if (!productosResponse.ok || !serviciosResponse.ok || !pedidosResponse.ok) setError("No se pudo cargar la información del empleado")
                else { setCatalog({ productos, servicios }); setPedidos(pedidos) }
            })
            .catch(() => { if (isMounted) setError("No se pudo conectar con el servidor") })
        return () => { isMounted = false }
    }, [token])

    if (!usuario) return <Navigate to="/login" replace />
    if (usuario.id_rol !== 2) return <Navigate to="/panel" replace />

    const tabs = [
        { key: "pedidos", label: "Pedidos" },
        { key: "reservaciones", label: "Reservaciones" },
        { key: "catalogo", label: "Catálogo" },
    ]

    return (
        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-(--terracotta)">Operación</p>
            <h1 className="mt-2 font-jost text-3xl font-semibold text-(--notte)">Panel de empleado</h1>
            <p className="mt-3 text-(--inchiostro)/75">Gestiona pedidos y reservaciones del restaurante.</p>
            {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

            {/* Tab navigation */}
            <div style={{ display: "flex", gap: "0.25rem", marginTop: "2rem", borderBottom: "2px solid rgba(22,50,79,0.1)", paddingBottom: "0" }}>
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        id={`tab-${tab.key}`}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: "0.625rem 1.25rem",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            border: "none",
                            background: "none",
                            cursor: "pointer",
                            borderBottom: activeTab === tab.key ? "2.5px solid var(--terracotta)" : "2.5px solid transparent",
                            color: activeTab === tab.key ? "var(--terracotta)" : "rgba(36,27,18,0.5)",
                            marginBottom: "-2px",
                            transition: "color 200ms ease, border-color 200ms ease",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Pedidos tab */}
            {activeTab === "pedidos" && (
                <div style={{ marginTop: "1.75rem" }}>
                    <div className="rounded-xl bg-white p-6 shadow-faro">
                        <h2 className="font-jost text-xl font-semibold text-(--notte)">Pedidos asignados</h2>
                        <div className="mt-4 space-y-4">{pedidos.map((pedido) => <OrderCard key={pedido.id_pedido} pedido={pedido} token={token} onUpdated={() => window.location.reload()} />)}</div>
                        {!pedidos.length ? <p className="mt-4 text-sm text-(--inchiostro)/60">No tienes pedidos asignados.</p> : null}
                    </div>
                </div>
            )}

            {/* Reservaciones tab */}
            {activeTab === "reservaciones" && (
                <ReservationsBoard token={token} catalogProductos={catalog.productos} />
            )}

            {/* Catálogo tab */}
            {activeTab === "catalogo" && (
                <div style={{ marginTop: "1.75rem" }}>
                    {serviciosSeleccionados.length ? <div className="mb-4 rounded-lg bg-white p-4 shadow-faro"><p className="font-medium text-(--notte)">Servicios seleccionados</p><p className="mt-2 text-sm text-(--inchiostro)/70">{serviciosSeleccionados.map((servicio) => `${servicio.nombre} ($${servicio.precio || 0})`).join(" · ")}</p></div> : null}
                    <div className="grid gap-6 md:grid-cols-2">
                        <CatalogList title="Productos" items={catalog.productos} showPrice />
                        <CatalogList title="Servicios" items={catalog.servicios} onSelect={(servicio) => setServiciosSeleccionados((actual) => actual.some((item) => item.id_servicio === servicio.id_servicio) ? actual : [...actual, servicio])} />
                    </div>
                </div>
            )}
        </section>
    )
}
