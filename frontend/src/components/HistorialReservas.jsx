import { useEffect, useState } from "react"
import { API_URL } from "../api"

const STATUS_COLORS = {
    pendiente: { bg: "rgba(232,178,61,0.15)", color: "#9a6e00" },
    confirmada: { bg: "rgba(107,124,78,0.15)", color: "var(--oliva)" },
    completada: { bg: "rgba(78,147,184,0.15)", color: "#2d6f91" },
    cancelada: { bg: "rgba(193,80,46,0.12)", color: "var(--terracotta)" },
}

export default function HistorialReservas({ token }) {
    const today = new Date().toISOString().slice(0, 10)
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const [reservas, setReservas] = useState([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({ fecha_inicio: monthAgo, fecha_fin: today, cliente: "", id_mesa: "", estado: "", valor_min: "", valor_max: "" })

    async function buscar() {
        setLoading(true)
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
        try {
            const res = await fetch(`${API_URL}/reservas/historial?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setReservas(await res.json())
        } catch { /* silent */ }
        setLoading(false)
    }

    useEffect(() => { buscar() }, [])

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "flex-end", background: "white", borderRadius: "1rem", padding: "1rem 1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                {[
                    { label: "Desde", key: "fecha_inicio", type: "date" },
                    { label: "Hasta", key: "fecha_fin", type: "date" },
                    { label: "Cliente", key: "cliente", type: "text", placeholder: "Nombre..." },
                    { label: "Mesa", key: "id_mesa", type: "number", placeholder: "ID" },
                    { label: "Valor mín.", key: "valor_min", type: "number", placeholder: "$" },
                    { label: "Valor máx.", key: "valor_max", type: "number", placeholder: "$" },
                ].map((f) => (
                    <div key={f.key} style={{ flex: 1, minWidth: "120px" }}>
                        <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.25rem" }}>{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={filters[f.key]} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} className="input-base" style={{ paddingTop: "0.4rem", paddingBottom: "0.4rem", fontSize: "0.82rem" }} />
                    </div>
                ))}
                <div style={{ flex: 1, minWidth: "120px" }}>
                    <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.25rem" }}>Estado</label>
                    <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })} className="input-base" style={{ paddingTop: "0.4rem", paddingBottom: "0.4rem", fontSize: "0.82rem" }}>
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmada">Confirmada</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                    </select>
                </div>
                <button type="button" onClick={buscar} disabled={loading} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    {loading ? "Buscando..." : "🔍 Buscar"}
                </button>
            </div>

            {/* Results */}
            <div style={{ fontSize: "0.78rem", color: "rgba(36,27,18,0.5)" }}>{reservas.length} resultado{reservas.length !== 1 ? "s" : ""}</div>

            <div style={{ overflowX: "auto", borderRadius: "1rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                <table style={{ width: "100%", minWidth: "900px", borderCollapse: "collapse", background: "white", fontSize: "0.82rem" }}>
                    <thead>
                        <tr style={{ background: "var(--notte)", color: "var(--panna)" }}>
                            {["#", "Fecha", "Horario", "Cliente", "Mesa", "Personas", "Estado", "Subtotal", "Impuestos", "Total"].map((h) => (
                                <th key={h} style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {reservas.map((r) => (
                            <tr key={r.id_reserva} style={{ borderBottom: "1px solid rgba(22,50,79,0.08)" }}>
                                <td style={{ padding: "0.6rem", fontWeight: 600 }}>{r.id_reserva}</td>
                                <td style={{ padding: "0.6rem" }}>{r.fecha_reserva}</td>
                                <td style={{ padding: "0.6rem" }}>{r.hora_inicio?.slice(0, 5)}–{r.hora_fin?.slice(0, 5)}</td>
                                <td style={{ padding: "0.6rem" }}>{r.cliente_nombre} {r.cliente_apellido}</td>
                                <td style={{ padding: "0.6rem" }}>Mesa {r.numero_mesa}</td>
                                <td style={{ padding: "0.6rem", textAlign: "center" }}>{r.cantidad_personas}</td>
                                <td style={{ padding: "0.6rem" }}>
                                    <span style={{ display: "inline-block", padding: "0.2rem 0.6rem", borderRadius: "999px", fontSize: "0.68rem", fontWeight: 600, textTransform: "uppercase", background: STATUS_COLORS[r.estado]?.bg || "#eee", color: STATUS_COLORS[r.estado]?.color || "#333" }}>
                                        {r.estado}
                                    </span>
                                </td>
                                <td style={{ padding: "0.6rem", textAlign: "right" }}>${r.subtotal?.toFixed(2)}</td>
                                <td style={{ padding: "0.6rem", textAlign: "right" }}>${r.impuestos?.toFixed(2)}</td>
                                <td style={{ padding: "0.6rem", textAlign: "right", fontWeight: 700 }}>${r.total?.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!reservas.length && <p style={{ padding: "1.5rem", textAlign: "center", color: "rgba(36,27,18,0.4)" }}>No se encontraron reservas con esos criterios.</p>}
            </div>
        </div>
    )
}
