import { useState } from "react"
import { API_URL } from "../api"

export default function ReportesDiarios({ token }) {
    const today = new Date().toISOString().slice(0, 10)
    const [fecha, setFecha] = useState(today)
    const [reporte, setReporte] = useState(null)
    const [loading, setLoading] = useState(false)

    async function cargarReporte() {
        setLoading(true)
        try {
            const res = await fetch(`${API_URL}/reportes/reservas/diario?fecha=${fecha}`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setReporte(await res.json())
        } catch { /* silent */ }
        setLoading(false)
    }

    function descargarPDF() {
        const a = document.createElement("a")
        a.href = `${API_URL}/reportes/reservas/diario/pdf?fecha=${fecha}`
        a.download = `reporte_reservas_${fecha}.pdf`

        fetch(a.href, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob)
                a.href = url
                a.click()
                URL.revokeObjectURL(url)
            })
    }

    function descargarExcel() {
        fetch(`${API_URL}/reportes/reservas/diario/excel?fecha=${fecha}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = `reporte_reservas_${fecha}.xlsx`
                a.click()
                URL.revokeObjectURL(url)
            })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Controls */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "flex-end", background: "white", borderRadius: "1rem", padding: "1rem 1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                <div style={{ flex: 1, minWidth: "160px" }}>
                    <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>Fecha del reporte</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="input-base" />
                </div>
                <button type="button" onClick={cargarReporte} disabled={loading} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    {loading ? "Cargando..." : "📋 Ver reporte"}
                </button>
                <button type="button" onClick={descargarPDF} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--terracotta)", color: "white", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    📥 PDF
                </button>
                <button type="button" onClick={descargarExcel} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--oliva)", color: "white", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    📥 Excel
                </button>
            </div>

            {/* Report preview */}
            {reporte && (
                <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--notte)", fontFamily: "Jost, sans-serif" }}>
                                Reporte del {reporte.fecha}
                            </h3>
                            <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "rgba(36,27,18,0.55)" }}>
                                {reporte.total_reservas} reserva{reporte.total_reservas !== 1 ? "s" : ""}
                            </p>
                        </div>
                        <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--oliva)", fontFamily: "Jost, sans-serif" }}>
                            ${reporte.total_general?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                            <thead>
                                <tr style={{ background: "rgba(22,50,79,0.06)" }}>
                                    {["#", "Cliente", "Mesa", "Personas", "Horario", "Estado", "Total"].map((h) => (
                                        <th key={h} style={{ padding: "0.6rem", textAlign: "left", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase", color: "var(--notte)" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {reporte.reservas?.map((r) => (
                                    <tr key={r.id_reserva} style={{ borderBottom: "1px solid rgba(22,50,79,0.06)" }}>
                                        <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600 }}>{r.id_reserva}</td>
                                        <td style={{ padding: "0.5rem 0.6rem" }}>{r.cliente}</td>
                                        <td style={{ padding: "0.5rem 0.6rem" }}>{r.mesa}</td>
                                        <td style={{ padding: "0.5rem 0.6rem", textAlign: "center" }}>{r.cantidad_personas}</td>
                                        <td style={{ padding: "0.5rem 0.6rem" }}>{r.hora_inicio}–{r.hora_fin}</td>
                                        <td style={{ padding: "0.5rem 0.6rem", textTransform: "capitalize" }}>{r.estado}</td>
                                        <td style={{ padding: "0.5rem 0.6rem", textAlign: "right", fontWeight: 700 }}>${r.total?.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!reporte.reservas?.length && <p style={{ textAlign: "center", color: "rgba(36,27,18,0.4)", padding: "1rem" }}>No hay reservas para esta fecha.</p>}
                </div>
            )}
        </div>
    )
}
