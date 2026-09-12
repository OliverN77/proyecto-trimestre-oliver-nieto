import { useNavigate, Link } from "react-router-dom"
import logoFaro from "../../public/img/logo.png"

/**
 * Shared sidebar navigation for Admin, Employee and Customer panels.
 * Props:
 *   title        — usually "Administración", "Empleado", "Mi cuenta"
 *   subtitle     — usually the user's name
 *   sections     — array of { id, label, description }
 *   activeSection — id of the currently active section
 *   onSectionChange(id) — called when the user clicks a section button
 *   onLogout     — called when the user clicks "Cerrar sesión"
 *   children     — the main content area rendered to the right of the sidebar
 */
export default function Sidebar({ title, subtitle, sections, activeSection, onSectionChange, onLogout, children }) {
    return (
        <section className="flex min-h-screen flex-col bg-(--panna) lg:flex-row">
            <aside className="flex w-full h-full shrink-0 flex-col bg-(--notte-2) p-6 text-(--panna) shadow-faro lg:sticky lg:top-0 lg:h-screen lg:w-72 lg:overflow-y-auto gap-4">
                <div className="flex items-center gap-3 border-b border-(--panna)/15 px-3 pb-6">
                    <div>
                        <img src={logoFaro} alt="Logo Taberna del Faro"/>
                        <p className="text-xs uppercase tracking-[0.25em] text-(--limone)">Taberna del Faro</p>
                        <h1 className="mt-1 font-jost text-xl font-semibold">{title}</h1>
                        {subtitle && (
                            <p className="mt-0.5 truncate text-sm text-(--panna)/60">{subtitle}</p>
                        )}
                    </div>
                </div>

                <nav className="mt-6 flex flex-col gap-2 px-1">
                    {sections.map((sec) => (
                        <button
                            key={sec.id}
                            type="button"
                            onClick={() => onSectionChange(sec.id)}
                            className={`flex flex-col items-start rounded-xl px-4 py-3 text-left transition-colors ${
                                activeSection === sec.id
                                    ? "bg-(--limone) text-(--notte-2)"
                                    : "text-(--panna) hover:bg-(--panna)/10"
                            }`}
                        >
                            <span className="font-semibold">{sec.label}</span>
                            <span className={`text-xs mt-0.5 ${activeSection === sec.id ? "text-(--notte-2)/70" : "text-(--panna)/50"}`}>
                                {sec.description}
                            </span>
                        </button>
                    ))}
                </nav>

                <div className="mt-8 flex flex-col gap-3 px-1 lg:mt-auto">
                    <Link
                        to="/"
                        className="block w-full rounded-xl border border-(--panna)/20 px-3 py-2.5 text-center text-sm text-(--panna)/75 transition hover:border-(--azzurro) hover:bg-(--azzurro) hover:text-white"
                    >
                        🏠 Ir al sitio web
                    </Link>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full rounded-xl border border-(--panna)/20 px-3 py-2.5 text-center text-sm text-(--panna)/75 transition hover:border-(--terracotta) hover:bg-(--terracotta) hover:text-white"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <main className="flex-1 p-6 sm:p-8 lg:p-10">
                <div className="mx-auto max-w-6xl">
                    {children}
                </div>
            </main>
        </section>
    )
}
