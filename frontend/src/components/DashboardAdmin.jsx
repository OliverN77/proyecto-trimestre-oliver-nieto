import { useEffect, useState } from "react"
import { API_URL } from "../api"

const CARD_STYLE = {
    borderRadius: "1rem",
    background: "white",
    padding: "1.25rem 1.5rem",
    boxShadow: "0 2px 12px rgba(22,50,79,0.08)",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    transition: "transform 200ms ease, box-shadow 200ms ease",
}

const CARD_HOVER = "translateY(-2px)"

function KpiCard({ label, value, icon, color = "var(--notte)" }) {
    const [hovered, setHovered] = useState(false)
    return (
        <div
            style={{
                ...CARD_STYLE,
                borderLeft: `4px solid ${color}`,
                transform: hovered ? CARD_HOVER : "none",
                boxShadow: hovered ? "0 6px 24px rgba(22,50,79,0.15)" : CARD_STYLE.boxShadow,
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(36,27,18,0.5)" }}>
                {icon} {label}
            </span>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color, fontFamily: "Jost, sans-serif" }}>
                {value}
            </span>
        </div>
    )
}

// ─── Simple SVG Bar Chart ──────────────────────────────────────────────────────

function BarChart({ data, labelKey = "dia", valueKey = "total", title = "Reservas por día", color = "var(--azzurro)" }) {
    if (!data || !data.length) return <p style={{ color: "rgba(36,27,18,0.4)", fontSize: "0.85rem" }}>Sin datos para el gráfico</p>
    const maxVal = Math.max(...data.map((d) => d[valueKey]), 1)
    const barWidth = Math.max(30, Math.min(60, 400 / data.length))
    const chartHeight = 200
    const svgWidth = data.length * (barWidth + 10) + 40

    return (
        <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
            <h4 style={{ margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--notte)", fontFamily: "Jost, sans-serif" }}>📊 {title}</h4>
            <div style={{ overflowX: "auto" }}>
                <svg width={svgWidth} height={chartHeight + 40} viewBox={`0 0 ${svgWidth} ${chartHeight + 40}`}>
                    {data.map((d, i) => {
                        const h = (d[valueKey] / maxVal) * chartHeight
                        const x = i * (barWidth + 10) + 20
                        return (
                            <g key={i}>
                                <rect x={x} y={chartHeight - h} width={barWidth} height={h} rx={4} fill={color} opacity={0.85}>
                                    <animate attributeName="height" from="0" to={h} dur="600ms" fill="freeze" />
                                    <animate attributeName="y" from={chartHeight} to={chartHeight - h} dur="600ms" fill="freeze" />
                                </rect>
                                <text x={x + barWidth / 2} y={chartHeight - h - 6} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--notte)">
                                    {d[valueKey]}
                                </text>
                                <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fontSize="9" fill="rgba(36,27,18,0.6)">
                                    {d[labelKey]}
                                </text>
                            </g>
                        )
                    })}
                    <line x1="15" y1={chartHeight} x2={svgWidth - 5} y2={chartHeight} stroke="rgba(22,50,79,0.15)" strokeWidth="1" />
                </svg>
            </div>
        </div>
    )
}

// ─── Simple SVG Line Chart ─────────────────────────────────────────────────────

function LineChart({ data, labelKey = "fecha", valueKey = "total", title = "Reservas en el tiempo", color = "var(--oliva)" }) {
    if (!data || !data.length) return <p style={{ color: "rgba(36,27,18,0.4)", fontSize: "0.85rem" }}>Sin datos para el gráfico</p>
    const maxVal = Math.max(...data.map((d) => d[valueKey]), 1)
    const chartHeight = 180
    const chartWidth = Math.max(400, data.length * 50)
    const padding = 30

    const points = data.map((d, i) => {
        const x = padding + (i / Math.max(data.length - 1, 1)) * (chartWidth - padding * 2)
        const y = chartHeight - padding - ((d[valueKey] / maxVal) * (chartHeight - padding * 2))
        return { x, y, ...d }
    })

    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")

    return (
        <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
            <h4 style={{ margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--notte)", fontFamily: "Jost, sans-serif" }}>📈 {title}</h4>
            <div style={{ overflowX: "auto" }}>
                <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <animate attributeName="stroke-dashoffset" from="2000" to="0" dur="1.2s" fill="freeze" />
                    </path>
                    {points.map((p, i) => (
                        <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
                            <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="600" fill="var(--notte)">
                                {p[valueKey]}
                            </text>
                            <text x={p.x} y={chartHeight - 5} textAnchor="middle" fontSize="7" fill="rgba(36,27,18,0.5)" transform={`rotate(-30, ${p.x}, ${chartHeight - 5})`}>
                                {String(p[labelKey]).slice(5)}
                            </text>
                        </g>
                    ))}
                    <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(22,50,79,0.12)" strokeWidth="1" />
                </svg>
            </div>
        </div>
    )
}

// ─── Status Breakdown Donut ────────────────────────────────────────────────────

function StatusBreakdown({ data }) {
    if (!data || !Object.keys(data).length) return null
    const colors = { pendiente: "#d4a017", confirmada: "var(--oliva)", completada: "var(--azzurro)", cancelada: "var(--terracotta)" }
    const total = Object.values(data).reduce((a, b) => a + b, 0)

    return (
        <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
            <h4 style={{ margin: "0 0 1rem", fontSize: "0.85rem", fontWeight: 700, color: "var(--notte)", fontFamily: "Jost, sans-serif" }}>📋 Desglose por estado</h4>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {Object.entries(data).map(([estado, count]) => (
                    <div key={estado} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 1rem", borderRadius: "0.75rem", background: `${colors[estado] || "var(--notte)"}15` }}>
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: colors[estado] || "var(--notte)" }} />
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: colors[estado] || "var(--notte)", textTransform: "capitalize" }}>
                            {estado}: {count}
                        </span>
                        <span style={{ fontSize: "0.68rem", color: "rgba(36,27,18,0.45)" }}>
                            ({total > 0 ? Math.round((count / total) * 100) : 0}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Admin Dashboard ───────────────────────────────────────────────────────────

export default function DashboardAdmin({ token }) {
    const [stats, setStats] = useState(null)
    const [reservaStats, setReservaStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const today = new Date().toISOString().slice(0, 10)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
    const [fechaInicio, setFechaInicio] = useState(thirtyDaysAgo)
    const [fechaFin, setFechaFin] = useState(today)

    async function cargarDatos() {
        setLoading(true)
        try {
            const [adminRes, reservasRes] = await Promise.all([
                fetch(`${API_URL}/dashboard/admin`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_URL}/dashboard/reservas?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`, { headers: { Authorization: `Bearer ${token}` } }),
            ])
            if (adminRes.ok) setStats(await adminRes.json())
            if (reservasRes.ok) setReservaStats(await reservasRes.json())
        } catch { /* silent */ }
        setLoading(false)
    }

    useEffect(() => { cargarDatos() }, [fechaInicio, fechaFin])

    if (loading && !stats) return <p style={{ color: "rgba(36,27,18,0.5)", padding: "2rem" }}>Cargando dashboard...</p>

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* KPI Cards */}
            {stats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <KpiCard label="Usuarios" value={stats.total_usuarios} icon="👥" color="var(--notte)" />
                    <KpiCard label="Mesas" value={stats.total_mesas} icon="🍽️" color="var(--azzurro)" />
                    <KpiCard label="Servicios" value={stats.total_servicios} icon="✨" color="var(--oliva)" />
                    <KpiCard label="Reservas" value={stats.total_reservas} icon="📅" color="var(--terracotta)" />
                    <KpiCard label="Comprobantes" value={stats.total_comprobantes} icon="📄" color="#d4a017" />
                    <KpiCard label="PQR Total" value={stats.total_pqr} icon="📋" color="var(--notte)" />
                    <KpiCard label="PQR Pendientes" value={stats.pqr_pendientes} icon="⚠" color="var(--terracotta)" />
                </div>
            )}

            {/* Date Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", background: "white", borderRadius: "1rem", padding: "1rem 1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                <div style={{ flex: 1, minWidth: "150px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Desde</label>
                    <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="input-base" />
                </div>
                <div style={{ flex: 1, minWidth: "150px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Hasta</label>
                    <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="input-base" />
                </div>
                <button type="button" onClick={cargarDatos} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    ↺ Actualizar
                </button>
            </div>

            {/* Reserva KPI */}
            {reservaStats?.cards && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                    <KpiCard label="Reservas en período" value={reservaStats.cards.total_reservas} icon="📊" color="var(--azzurro)" />
                    <KpiCard label="Ingresos totales" value={`$${reservaStats.cards.ingresos_totales.toLocaleString()}`} icon="💰" color="var(--oliva)" />
                    <KpiCard label="Prom. personas" value={reservaStats.cards.promedio_personas} icon="👥" color="var(--terracotta)" />
                </div>
            )}

            {/* Charts */}
            {reservaStats && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1rem" }}>
                    <BarChart data={reservaStats.bar_chart} title="Reservas por día de la semana" color="var(--azzurro)" />
                    <LineChart data={reservaStats.line_chart} title="Reservas en el tiempo" color="var(--oliva)" />
                </div>
            )}

            {reservaStats?.status_breakdown && <StatusBreakdown data={reservaStats.status_breakdown} />}

            {/* Mesa occupancy */}
            {reservaStats?.mesa_occupancy?.length > 0 && (
                <BarChart data={reservaStats.mesa_occupancy} labelKey="mesa" valueKey="total" title="Ocupación por mesa" color="var(--terracotta)" />
            )}
        </div>
    )
}

export { KpiCard, BarChart, LineChart, StatusBreakdown }
