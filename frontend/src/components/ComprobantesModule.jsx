import { useEffect, useState } from "react"
import { API_URL } from "../api"

export default function ComprobantesModule({ token, userRole }) {
    const [comprobantes, setComprobantes] = useState([])
    const [loading, setLoading] = useState(false)
    const [idReservaGen, setIdReservaGen] = useState("")
    const [filters, setFilters] = useState({ numero: "", cliente: "", fecha_inicio: "", fecha_fin: "" })

    async function buscar() {
        setLoading(true)
        const params = new URLSearchParams()
        Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
        try {
            const res = await fetch(`${API_URL}/comprobantes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setComprobantes(await res.json())
        } catch { /* silent */ }
        setLoading(false)
    }

    useEffect(() => { buscar() }, [])

    async function generar() {
        if (!idReservaGen) return alert("Ingrese un ID de reserva")
        try {
            const res = await fetch(`${API_URL}/comprobantes?id_reserva=${idReservaGen}`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                alert("Comprobante generado con éxito")
                setIdReservaGen("")
                buscar()
            } else {
                const data = await res.json()
                alert(data.detail || "Error al generar comprobante")
            }
        } catch (e) {
            alert("Error de conexión")
        }
    }

    function descargarPDF(id_comprobante, numero) {
        const a = document.createElement("a")
        a.href = `${API_URL}/comprobantes/${id_comprobante}/pdf`
        a.download = `${numero}.pdf`

        fetch(a.href, { headers: { Authorization: `Bearer ${token}` } })
            .then((res) => res.blob())
            .then((blob) => {
                const url = URL.createObjectURL(blob)
                a.href = url
                a.click()
                URL.revokeObjectURL(url)
            })
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {/* Generate Comprobante (Only Admin/Employee) */}
            {(userRole === 1 || userRole === 2) && (
                <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)", display: "flex", gap: "1rem", alignItems: "flex-end" }}>
                    <div style={{ flex: 1, maxWidth: "250px" }}>
                        <label style={{ display: "block", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.3rem" }}>ID Reserva</label>
                        <input type="number" placeholder="Ej: 15" value={idReservaGen} onChange={(e) => setIdReservaGen(e.target.value)} className="input-base" />
                    </div>
                    <button type="button" onClick={generar} style={{ padding: "0.55rem 1.25rem", borderRadius: "0.6rem", background: "var(--azzurro)", color: "white", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                        ➕ Generar Comprobante
                    </button>
                </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", alignItems: "flex-end", background: "white", borderRadius: "1rem", padding: "1rem 1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                {[
                    { label: "Número", key: "numero", type: "text", placeholder: "COMP-..." },
                    { label: "Cliente", key: "cliente", type: "text", placeholder: "Nombre..." },
                    { label: "Desde", key: "fecha_inicio", type: "date" },
                    { label: "Hasta", key: "fecha_fin", type: "date" },
                ].map((f) => (
                    <div key={f.key} style={{ flex: 1, minWidth: "140px" }}>
                        <label style={{ display: "block", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(22,50,79,0.55)", marginBottom: "0.25rem" }}>{f.label}</label>
                        <input type={f.type} placeholder={f.placeholder} value={filters[f.key]} onChange={(e) => setFilters({ ...filters, [f.key]: e.target.value })} className="input-base" style={{ paddingTop: "0.4rem", paddingBottom: "0.4rem", fontSize: "0.82rem" }} />
                    </div>
                ))}
                <button type="button" onClick={buscar} disabled={loading} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.6rem", background: "var(--notte)", color: "var(--panna)", fontWeight: 600, fontSize: "0.82rem", border: "none", cursor: "pointer" }}>
                    {loading ? "Buscando..." : "🔍 Buscar"}
                </button>
            </div>

            {/* List */}
            <div style={{ overflowX: "auto", borderRadius: "1rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                <table style={{ width: "100%", minWidth: "800px", borderCollapse: "collapse", background: "white", fontSize: "0.82rem" }}>
                    <thead>
                        <tr style={{ background: "var(--notte)", color: "var(--panna)" }}>
                            {["Número", "Fecha Emisión", "Reserva", "Cliente", "Total", "Acciones"].map((h) => (
                                <th key={h} style={{ padding: "0.75rem 0.6rem", textAlign: "left", fontWeight: 600, fontSize: "0.72rem", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {comprobantes.map((c) => {
                            const data = JSON.parse(c.datos_json)
                            const cliente = data.cliente || {}
                            return (
                                <tr key={c.id_comprobante} style={{ borderBottom: "1px solid rgba(22,50,79,0.08)" }}>
                                    <td style={{ padding: "0.6rem", fontWeight: 600 }}>{c.numero_comprobante}</td>
                                    <td style={{ padding: "0.6rem" }}>{new Date(c.fecha_emision).toLocaleString()}</td>
                                    <td style={{ padding: "0.6rem" }}>#{c.id_reserva}</td>
                                    <td style={{ padding: "0.6rem" }}>{cliente.nombre} {cliente.apellido}</td>
                                    <td style={{ padding: "0.6rem", fontWeight: 700 }}>${data.total?.toFixed(2)}</td>
                                    <td style={{ padding: "0.6rem" }}>
                                        <button type="button" onClick={() => descargarPDF(c.id_comprobante, c.numero_comprobante)} style={{ padding: "0.3rem 0.6rem", borderRadius: "0.4rem", background: "var(--oliva)", color: "white", fontWeight: 600, fontSize: "0.7rem", border: "none", cursor: "pointer" }}>
                                            📥 PDF
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
                {!comprobantes.length && <p style={{ padding: "1.5rem", textAlign: "center", color: "rgba(36,27,18,0.4)" }}>No se encontraron comprobantes.</p>}
            </div>
        </div>
    )
}
