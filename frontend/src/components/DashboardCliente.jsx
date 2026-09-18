import { useEffect, useState } from "react"
import { API_URL } from "../api"

function KpiCard({ label, value, icon, color = "var(--notte)" }) {
    return (
        <div style={{ borderRadius: "1rem", background: "white", padding: "1.25rem 1.5rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)", borderLeft: `4px solid ${color}`, transition: "transform 200ms ease", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(36,27,18,0.5)" }}>{icon} {label}</span>
            <span style={{ fontSize: "1.75rem", fontWeight: 700, color, fontFamily: "Jost, sans-serif" }}>{value}</span>
        </div>
    )
}

export default function DashboardCliente({ token }) {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(`${API_URL}/dashboard/cliente`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.ok ? r.json() : null)
            .then((data) => { if (data) setStats(data) })
            .catch(() => {})
            .finally(() => setLoading(false))
    }, [token])

    if (loading) return <p style={{ color: "rgba(36,27,18,0.5)" }}>Cargando...</p>
    if (!stats) return <p style={{ color: "rgba(36,27,18,0.5)" }}>No se pudo cargar el dashboard.</p>

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                <KpiCard label="Mis reservas" value={stats.total_reservas} icon="📅" color="var(--azzurro)" />
                <KpiCard label="Reservas activas" value={stats.reservas_activas} icon="✅" color="var(--oliva)" />
                <KpiCard label="Total gastado" value={`$${stats.total_gastado.toLocaleString()}`} icon="💰" color="var(--terracotta)" />
                <KpiCard label="Mis PQR" value={stats.mis_pqr} icon="📋" color="var(--notte)" />
                <KpiCard label="PQR pendientes" value={stats.pqr_pendientes} icon="⚠" color="#d4a017" />
            </div>
        </div>
    )
}
