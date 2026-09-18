import { useEffect, useState } from "react"
import { API_URL } from "../api"

const STATUS_COLORS = {
    pendiente: { bg: "rgba(232,178,61,0.15)", color: "#9a6e00" },
    en_proceso: { bg: "rgba(78,147,184,0.15)", color: "#2d6f91" },
    respondida: { bg: "rgba(107,124,78,0.15)", color: "var(--oliva)" },
    cerrada: { bg: "rgba(193,80,46,0.12)", color: "var(--terracotta)" },
}

export default function PQRModule({ token, userRole }) {
    const [pqrs, setPqrs] = useState([])
    const [loading, setLoading] = useState(false)
    const [filters, setFilters] = useState({ estado: "", tipo: "" })

    // For creating (Client)
    const [nuevaPqr, setNuevaPqr] = useState({ tipo: "peticion", asunto: "", descripcion: "" })

    // For responding (Admin/Employee)
    const [responderId, setResponderId] = useState(null)
    const [respuestaTxt, setRespuestaTxt] = useState("")

    async function cargar() {
        setLoading(true)
        const params = new URLSearchParams()
        if (filters.estado) params.set("estado", filters.estado)
        if (filters.tipo) params.set("tipo", filters.tipo)
        try {
            const res = await fetch(`${API_URL}/pqr?${params}`, { headers: { Authorization: `Bearer ${token}` } })
            if (res.ok) setPqrs(await res.json())
        } catch { /* silent */ }
        setLoading(false)
    }

    useEffect(() => { cargar() }, [filters])

    async function crearPQR(e) {
        e.preventDefault()
        try {
            const res = await fetch(`${API_URL}/pqr`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(nuevaPqr)
            })
            if (res.ok) {
                alert("PQR enviada correctamente")
                setNuevaPqr({ tipo: "peticion", asunto: "", descripcion: "" })
                cargar()
            } else {
                const data = await res.json()
                alert(data.detail || "Error al enviar")
            }
        } catch (err) {
            alert("Error de red")
        }
    }

    async function cambiarEstado(id, nuevoEstado) {
        try {
            const res = await fetch(`${API_URL}/pqr/${id}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ estado: nuevoEstado })
            })
            if (res.ok) cargar()
        } catch { /* silent */ }
    }

    async function responder(e) {
        e.preventDefault()
        try {
            const res = await fetch(`${API_URL}/pqr/${responderId}/responder`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ respuesta: respuestaTxt })
            })
            if (res.ok) {
                setResponderId(null)
                setRespuestaTxt("")
                cargar()
            } else {
                alert("Error al responder")
            }
        } catch { /* silent */ }
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Create form for Clients */}
            {userRole === 3 && (
                <form onSubmit={crearPQR} style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--notte)" }}>Registrar nueva PQR</h3>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "200px" }}>
                            <label className="block text-xs font-bold uppercase tracking-wider text-(--notte)/60 mb-1">Tipo</label>
                            <select value={nuevaPqr.tipo} onChange={(e) => setNuevaPqr({ ...nuevaPqr, tipo: e.target.value })} className="input-base w-full">
                                <option value="peticion">Petición</option>
                                <option value="queja">Queja</option>
                                <option value="reclamo">Reclamo</option>
                            </select>
                        </div>
                        <div style={{ flex: 2, minWidth: "200px" }}>
                            <label className="block text-xs font-bold uppercase tracking-wider text-(--notte)/60 mb-1">Asunto</label>
                            <input type="text" required minLength="3" maxLength="255" value={nuevaPqr.asunto} onChange={(e) => setNuevaPqr({ ...nuevaPqr, asunto: e.target.value })} className="input-base w-full" placeholder="Breve descripción..." />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-(--notte)/60 mb-1">Descripción detallada</label>
                        <textarea required minLength="10" rows="3" value={nuevaPqr.descripcion} onChange={(e) => setNuevaPqr({ ...nuevaPqr, descripcion: e.target.value })} className="input-base w-full" placeholder="Explique su caso..." />
                    </div>
                    <button type="submit" className="self-end px-6 py-2 bg-(--notte) text-white font-semibold rounded-lg hover:bg-(--notte-2) transition">Enviar</button>
                </form>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: "1rem", background: "white", padding: "1rem", borderRadius: "1rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--notte)/60 mb-1">Estado</label>
                    <select value={filters.estado} onChange={(e) => setFilters({ ...filters, estado: e.target.value })} className="input-base py-1.5 text-sm">
                        <option value="">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="respondida">Respondida</option>
                        <option value="cerrada">Cerrada</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-(--notte)/60 mb-1">Tipo</label>
                    <select value={filters.tipo} onChange={(e) => setFilters({ ...filters, tipo: e.target.value })} className="input-base py-1.5 text-sm">
                        <option value="">Todos</option>
                        <option value="peticion">Petición</option>
                        <option value="queja">Queja</option>
                        <option value="reclamo">Reclamo</option>
                    </select>
                </div>
            </div>

            {/* List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {loading && <p className="text-sm text-(--notte)/60">Cargando...</p>}
                {!loading && pqrs.length === 0 && <p className="text-sm text-(--notte)/60">No se encontraron registros.</p>}
                
                {pqrs.map((p) => (
                    <div key={p.id_pqr} style={{ background: "white", borderRadius: "1rem", padding: "1.25rem", boxShadow: "0 2px 12px rgba(22,50,79,0.08)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "var(--notte)" }}>{p.asunto}</h4>
                                <div style={{ fontSize: "0.75rem", color: "rgba(36,27,18,0.5)", marginTop: "0.2rem", display: "flex", gap: "0.8rem" }}>
                                    <span style={{ textTransform: "capitalize", fontWeight: 600 }}>📝 {p.tipo}</span>
                                    <span>📅 {new Date(p.creada_en).toLocaleDateString()}</span>
                                    {(userRole === 1 || userRole === 2) && (
                                        <span>👤 {p.cliente_nombre} {p.cliente_apellido}</span>
                                    )}
                                </div>
                            </div>
                            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "999px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", background: STATUS_COLORS[p.estado]?.bg, color: STATUS_COLORS[p.estado]?.color }}>
                                {p.estado.replace("_", " ")}
                            </span>
                        </div>
                        
                        <p style={{ fontSize: "0.9rem", color: "var(--notte-2)", margin: "1rem 0", whiteSpace: "pre-wrap" }}>{p.descripcion}</p>

                        {p.respuesta && (
                            <div style={{ background: "rgba(107,124,78,0.08)", padding: "1rem", borderRadius: "0.5rem", marginTop: "1rem", borderLeft: "4px solid var(--oliva)" }}>
                                <strong style={{ display: "block", fontSize: "0.8rem", color: "var(--oliva)", textTransform: "uppercase", marginBottom: "0.5rem" }}>Respuesta:</strong>
                                <p style={{ fontSize: "0.9rem", margin: 0, whiteSpace: "pre-wrap" }}>{p.respuesta}</p>
                            </div>
                        )}

                        {/* Admin/Employee Actions */}
                        {(userRole === 1 || userRole === 2) && (
                            <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid rgba(22,50,79,0.1)", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                                <select 
                                    value={p.estado} 
                                    onChange={(e) => cambiarEstado(p.id_pqr, e.target.value)}
                                    className="input-base py-1 text-xs"
                                >
                                    <option value="pendiente">Marcar Pendiente</option>
                                    <option value="en_proceso">Marcar En Proceso</option>
                                    <option value="respondida" disabled>Respondida</option>
                                    <option value="cerrada">Cerrada</option>
                                </select>
                                
                                {p.estado !== "cerrada" && (
                                    <button onClick={() => setResponderId(responderId === p.id_pqr ? null : p.id_pqr)} className="px-3 py-1 bg-(--azzurro) text-white text-xs font-semibold rounded-md hover:bg-(--inchiostro) transition">
                                        {responderId === p.id_pqr ? "Cancelar" : "Responder"}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Response Form */}
                        {responderId === p.id_pqr && (
                            <form onSubmit={responder} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                                <textarea required minLength="5" rows="3" value={respuestaTxt} onChange={(e) => setRespuestaTxt(e.target.value)} className="input-base w-full text-sm" placeholder="Escriba la respuesta oficial aquí..." />
                                <button type="submit" className="self-end px-4 py-1.5 bg-(--oliva) text-white text-xs font-semibold rounded-md hover:opacity-90 transition">Enviar Respuesta</button>
                            </form>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}
