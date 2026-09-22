import { useEffect, useRef, useState } from "react"
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom"

const links = [
    { to: "/", label: "Inicio" },
]

function Header() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [menuUsuarioOpen, setMenuUsuarioOpen] = useState(false)
    const [usuario, setUsuario] = useState(() => JSON.parse(localStorage.getItem("usuario") || "null"))
    const location = useLocation()
    const navigate = useNavigate()
    const menuUsuarioRef = useRef(null)

    useEffect(() => {
        const syncUser = () => setUsuario(JSON.parse(localStorage.getItem("usuario") || "null"))
        window.addEventListener("storage", syncUser)
        window.addEventListener("auth-change", syncUser)
        return () => {
            window.removeEventListener("storage", syncUser)
            window.removeEventListener("auth-change", syncUser)
        }
    }, [])

    useEffect(() => {
        function manejarClickFuera(e) {
            if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(e.target)) {
                setMenuUsuarioOpen(false)
            }
        }
        document.addEventListener("mousedown", manejarClickFuera)
        return () => document.removeEventListener("mousedown", manejarClickFuera)
    }, [])

    if (location.pathname === "/admin" && usuario?.id_rol === 1) return null

    function getDashboardUrl() {
        if (!usuario) return "/"
        if (usuario.id_rol === 1) return "/admin"
        if (usuario.id_rol === 2) return "/empleado"
        return "/panel"
    }

    function cerrarSesion() {
        localStorage.removeItem("token")
        localStorage.removeItem("usuario")
        window.dispatchEvent(new Event("auth-change"))
        setMenuOpen(false)
        setMenuUsuarioOpen(false)
        navigate("/")
    }

    return (
        <header className="sticky top-0 z-50 border-b border-(--limone)/15 bg-(--notte-2)/95 text-(--panna) shadow-md backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <Link to="/" className="flex items-center gap-3">
                    <img src="/img/logo.png" alt="Logo del Faro" className="h-12 w-12 object-contain" />
                    <div>
                        <p className="font-jost text-lg font-semibold leading-none text-limone sm:text-xl">
                            Taberna del Faro
                        </p>
                        <p className="text-xs uppercase tracking-[0.28em] text-(--panna)/60">
                            Cocina costera
                        </p>
                    </div>
                </Link>

                <nav className="hidden items-center gap-7 md:flex">
                    {links.map((link) => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `text-sm font-medium tracking-wide transition ${isActive ? "text-(--limone)" : "text-(--panna)/80 hover:text-(--limone)"}`
                            }
                        >
                            {link.label}
                        </NavLink>
                    ))}
                    {usuario ? (
                        <div className="relative" ref={menuUsuarioRef}>
                            <button
                                type="button"
                                onClick={() => setMenuUsuarioOpen((prev) => !prev)}
                                className="flex items-center gap-1.5 rounded-full bg-(--limone) px-4 py-2 text-sm font-semibold text-(--notte-2) transition hover:bg-(--limone)/90"
                            >
                                Hola, {usuario.nombre}
                                <svg
                                    className={`h-3.5 w-3.5 transition-transform ${menuUsuarioOpen ? "rotate-180" : ""}`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2.5}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {menuUsuarioOpen && (
                                <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-(--panna)/10 bg-(--notte-2) shadow-lg">
                                    <Link
                                        to={getDashboardUrl()}
                                        onClick={() => setMenuUsuarioOpen(false)}
                                        className="block w-full px-4 py-2.5 text-left text-sm font-medium text-(--panna) transition hover:bg-(--limone)/10 hover:text-(--limone)"
                                    >
                                        Ir al Panel
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={cerrarSesion}
                                        className="w-full px-4 py-2.5 text-left text-sm font-medium text-(--panna) transition hover:bg-(--limone)/10 hover:text-(--limone)"
                                    >
                                        Salir
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="rounded-full bg-(--limone) px-4 py-2 text-sm font-semibold text-(--notte-2) transition hover:bg-(--limone)/90">
                            Iniciar sesión
                        </Link>
                    )}
                </nav>

                <button
                    type="button"
                    className="rounded-full border border-(--panna)/20 px-3 py-2 text-sm text-(--panna) md:hidden"
                    onClick={() => setMenuOpen((previous) => !previous)}
                    aria-label="Abrir menú"
                >
                    {menuOpen ? "✕" : "☰"}
                </button>
            </div>

            {menuOpen && (
                <nav className="border-t border-(--panna)/10 bg-(--notte-2) px-4 py-4 md:hidden">
                    <div className="mx-auto flex max-w-6xl flex-col gap-3">
                        {links.map((link) => (
                            <NavLink
                                key={link.to}
                                to={link.to}
                                onClick={() => setMenuOpen(false)}
                                className={({ isActive }) =>
                                    `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? "bg-(--panna)/10 text-(--limone)" : "text-(--panna)/85 hover:bg-(--panna)/5 hover:text-(--limone)"}`
                                }
                            >
                                {link.label}
                            </NavLink>
                        ))}
                        {usuario ? (
                            <div className="mt-1 flex flex-col gap-2 rounded-xl bg-(--panna)/5 p-3">
                                <p className="text-center text-sm font-semibold text-(--panna)">Hola, {usuario.nombre}</p>
                                <Link to={getDashboardUrl()} onClick={() => setMenuOpen(false)} className="rounded-full bg-(--limone)/20 px-4 py-2 text-center text-sm font-medium text-(--limone) transition hover:bg-(--limone)/30">
                                    Ir al Panel
                                </Link>
                                <button type="button" onClick={cerrarSesion} className="rounded-full bg-(--limone) px-4 py-2 text-center text-sm font-semibold text-(--notte-2) transition hover:bg-(--limone)/90">
                                    Salir
                                </button>
                            </div>
                        ) : (
                            <Link to="/login" onClick={() => setMenuOpen(false)} className="mt-1 rounded-full bg-(--limone) px-4 py-2 text-center text-sm font-semibold text-(--notte-2) transition hover:bg-(--limone)/90">
                                Iniciar sesión
                            </Link>
                        )}
                    </div>
                </nav>
            )}
        </header>
    )
}

export default Header