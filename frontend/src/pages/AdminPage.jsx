import { useEffect, useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { API_URL, apiErrorMessage, readApiResponse } from "../api"
const ROLE_NAMES = { 1: "Administrador", 2: "Empleado", 3: "Cliente" }
const SECTIONS = [
    { id: "usuarios", label: "Usuarios", description: "Consulta y administra las cuentas" },
    { id: "crear", label: "Crear usuario", description: "Registra una nueva cuenta" },
    { id: "solicitudes", label: "Solicitudes", description: "Revisa recuperaciones" },
]

export default function AdminPage() {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "null")
    const token = localStorage.getItem("token")
    const navigate = useNavigate()
    const [usuarios, setUsuarios] = useState([])
    const [error, setError] = useState("")
    const [mensaje, setMensaje] = useState("")
    const [solicitudes, setSolicitudes] = useState([])
    const [editingId, setEditingId] = useState(null)
    const [activeSection, setActiveSection] = useState("usuarios")
    const [form, setForm] = useState({
        nombre: "", apellido: "", tipo_documento: "CC", numero_documento: "",
        direccion: "", telefono: "", correo: "", contrasena: "", rol: "Cliente",
    })

    function handleChange(event) {
        const { name, value } = event.target
        setForm((previous) => ({ ...previous, [name]: value }))
        setError("")
    }

    function resetForm() {
        setEditingId(null)
        setForm({ nombre: "", apellido: "", tipo_documento: "CC", numero_documento: "", direccion: "", telefono: "", correo: "", contrasena: "", rol: "Cliente" })
    }

    function cerrarSesion() {
        localStorage.removeItem("token")
        localStorage.removeItem("usuario")
        window.dispatchEvent(new Event("auth-change"))
        navigate("/")
    }

    function editarUsuario(item) {
        setEditingId(item.id_usuario)
        setActiveSection("crear")
        setForm({ nombre: item.nombre, apellido: item.apellido, tipo_documento: item.tipo_documento, numero_documento: item.numero_documento, direccion: item.direccion || "", telefono: item.telefono, correo: item.correo, contrasena: "", rol: ROLE_NAMES[item.id_rol] })
        window.scrollTo({ top: 0, behavior: "smooth" })
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
        resetForm()
        cargarUsuarios()
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

    useEffect(() => {
        let isMounted = true
        Promise.all([
            fetch(`${API_URL}/usuarios`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${API_URL}/recuperacion/solicitudes`, { headers: { Authorization: `Bearer ${token}` } }),
        ])
            .then(async ([usersResponse, requestsResponse]) => ({
                usersResponse,
                requestsResponse,
                users: await usersResponse.json(),
                requests: await requestsResponse.json(),
            }))
            .then(({ usersResponse, requestsResponse, users, requests }) => {
                if (!isMounted) return
                if (!usersResponse.ok) setError(users.mensaje || "No se pudieron cargar los usuarios")
                else setUsuarios(users)
                if (requestsResponse.ok && Array.isArray(requests)) setSolicitudes(requests)
            })
            .catch(() => { if (isMounted) setError("No se pudo conectar con el servidor") })
        return () => { isMounted = false }
    }, [token])

    if (!usuario) return <Navigate to="/login" replace />
    if (usuario.id_rol !== 1) return <Navigate to="/panel" replace />

    return (
        <section className="min-h-[calc(100vh-4rem)] bg-(--panna) px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
                <aside className="w-full shrink-0 rounded-2xl bg-(--notte-2) p-4 text-(--panna) shadow-faro lg:sticky lg:top-6 lg:w-64">
                <img src="../../public/img/logo.png" alt="logo" />
                    <div className="border-b border-(--panna)/15 px-3 pb-4">
                        <p className="text-xs uppercase tracking-[0.25em] text-(--limone)">Taberna del Faro</p>
                        <h1 className="mt-2 font-jost text-xl font-semibold">Administración</h1>
                        <p className="mt-1 truncate text-sm text-(--panna)/60">{usuario.nombre}</p>
                    </div>
                    <nav className="mt-4 grid gap-1 sm:grid-cols-3 lg:grid-cols-1" aria-label="Secciones de administración">
                        {SECTIONS.map((section) => (
                            <button key={section.id} type="button" onClick={() => setActiveSection(section.id)} className={`rounded-xl px-3 py-3 text-left transition ${activeSection === section.id ? "bg-(--limone) text-(--notte-2)" : "text-(--panna)/75 hover:bg-(--panna)/10 hover:text-(--panna)"}`}>
                                <span className="block font-medium">{section.label}</span>
                                <span className={`mt-0.5 block text-xs ${activeSection === section.id ? "text-(--notte-2)/70" : "text-(--panna)/45"}`}>{section.description}</span>
                            </button>
                        ))}
                    </nav>
                    <button type="button" onClick={cerrarSesion} className="mt-4 w-full rounded-xl border border-(--panna)/20 px-3 py-2.5 text-left text-sm text-(--panna)/75 transition hover:border-(--terracotta) hover:bg-(--terracotta) hover:text-white">Cerrar sesión</button>
                </aside>
                <main className="min-w-0 flex-1">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-(--terracotta)">Gestión interna</p>
                    <h1 className="mt-2 font-jost text-3xl font-semibold text-(--notte)">{SECTIONS.find((section) => section.id === activeSection).label}</h1>
                </div>
                <span className="rounded-full bg-(--limone)/20 px-3 py-1 text-sm text-(--notte)">{usuarios.length} usuarios</span>
            </div>
            {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
            {mensaje ? <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{mensaje}</p> : null}
            {activeSection === "crear" ? <form onSubmit={guardarUsuario} className="mt-6 rounded-xl bg-white p-6 shadow-faro">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="font-jost text-xl font-semibold text-(--notte)">{editingId ? "Editar usuario" : "Crear usuario"}</h2>
                    {editingId ? <button type="button" onClick={resetForm} className="text-sm text-(--azzurro) hover:underline">Cancelar edición</button> : null}
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <button type="submit" className="mt-4 rounded-lg bg-(--notte) px-5 py-2.5 font-medium text-white">{editingId ? "Guardar cambios" : "Crear usuario"}</button>
            </form> : null}
            {activeSection === "solicitudes" ? <div className="mt-6 rounded-xl bg-white p-6 shadow-faro">
                <h2 className="font-jost text-xl font-semibold text-(--notte)">Solicitudes de recuperación</h2>
                <div className="mt-4 space-y-3">{solicitudes.map((solicitud) => <div key={solicitud.id_solicitud} className="flex flex-wrap items-center justify-between gap-3 border-b border-(--notte)/10 pb-3"><div><p className="font-medium">{solicitud.nombre} {solicitud.apellido}</p><p className="text-sm text-(--inchiostro)/70">Documento: {solicitud.numero_documento} · Estado: {solicitud.estado}</p></div><div className="flex gap-2">{solicitud.estado === "pendiente" ? <><button type="button" onClick={() => resolverSolicitud(solicitud.id_solicitud, "aprobada")} className="rounded bg-(--oliva) px-3 py-2 text-sm text-white">Aprobar</button><button type="button" onClick={() => resolverSolicitud(solicitud.id_solicitud, "rechazada")} className="rounded bg-red-700 px-3 py-2 text-sm text-white">Rechazar</button></> : <button type="button" onClick={() => eliminarSolicitud(solicitud.id_solicitud)} className="rounded bg-red-700 px-3 py-2 text-sm text-white">Eliminar</button>}</div></div>)}</div>
                {!solicitudes.length ? <p className="mt-3 text-sm text-(--inchiostro)/60">No hay solicitudes.</p> : null}
            </div> : null}
            {activeSection === "usuarios" ? <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-faro">
                <table className="w-full min-w-190 text-left text-sm">
                    <thead className="bg-(--notte) text-(--panna)">
                        <tr><th className="p-4">Nombre</th><th className="p-4">Correo</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4">Acciones</th></tr>
                    </thead>
                    <tbody>
                        {usuarios.map((item) => (
                            <tr key={item.id_usuario} className="border-b border-(--notte)/10">
                                <td className="p-4">{item.nombre} {item.apellido}</td>
                                <td className="p-4">{item.correo}</td>
                                <td className="p-4"><select value={ROLE_NAMES[item.id_rol]} onChange={(event) => cambiarRol(item, event.target.value)} className="rounded border border-(--notte)/20 bg-white px-2 py-1"><option value="Cliente">Cliente</option><option value="Empleado">Empleado</option><option value="Administrador">Administrador</option></select></td>
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
            </div> : null}
                </main>
            </div>
        </section>
    )
}
