import { Link } from "react-router-dom"
import Carrusel from "../components/Carrusel"

const courses = [
    {
        numeral: "I",
        name: "Entrantes",
        items: [
            "Boquerones marinados, lim&oacute;n de Amalfi, pan tostado",
            "Burrata pugliese, tomates confitados, albahaca",
            "Pulpo a la brasa, patatas machacadas, aceitunas taggiasche",
        ],
    },
    {
        numeral: "II",
        name: "Primeros",
        items: [
            "Scialatielli al marisco",
            "Paccheri con tomate San Marzano",
            "Risotto de cítricos y gambas rojas",
        ],
    },
    {
        numeral: "III",
        name: "Platos principales",
        items: [
            "Lubina al sal, verduras de temporada",
            "Tagliata de ternera, rúcula y grana",
            "Rollitos de pez espada a la siciliana",
        ],
    },
    {
        numeral: "IV",
        name: "Postres",
        items: [
            "Delicia de lim&oacute;n",
            "Tiramis&uacute; de la casa",
            "Sorbete de albahaca y lima",
        ],
    },
]

export default function HomePage() {
    return (
        <div className="bg-(--panna)">
            <section className="relative overflow-hidden bg-(--notte-2) px-4 py-20 text-(--panna) sm:px-6 lg:py-24">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(232,178,61,0.16),transparent_55%)]" />
                <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
                    <p className="mb-4 text-xs uppercase tracking-[0.35em] text-(--limone)/90">
                        Costa Amalfitana - desde 1962
                    </p>
                    <h1 className="max-w-3xl font-jost text-4xl font-semibold tracking-tight text-(--panna) sm:text-5xl lg:text-7xl">
                        Taberna <span className="italic text-(--limone)">del Faro</span>
                    </h1>
                    <p className="mt-6 max-w-2xl text-base leading-7 text-(--panna)/80 sm:text-lg">
                        Cocina marinera en una terraza suspendida entre las rocas y el golfo.
                        Un espacio sobrio, cálido y pensado para que la experiencia sea visual y funcional.
                    </p>
                    <div className="mt-10 flex flex-wrap justify-center gap-3">
                        <a
                            href="#carrusel"
                            className="rounded-full bg-(--limone) px-6 py-3 text-sm font-semibold text-(--notte-2) transition hover:bg-(--limone)/90"
                        >
                            Ver carrusel
                        </a>
                        <Link
                            to="/login"
                            className="rounded-full border border-(--panna)/20 px-6 py-3 text-sm font-semibold text-(--panna) transition hover:bg-(--panna)/10"
                        >
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </section>

            <section id="carrusel">
                <Carrusel />
            </section>

            <div className="h-2 bg-[repeating-linear-gradient(90deg,#E8B23D_0_14px,#4E93B8_14px_28px,#C1502E_28px_42px,#F6EFDD_42px_56px)]" />

            <section className="px-4 py-16 sm:px-6 lg:py-20">
                <div className="mx-auto max-w-6xl">
                    <p className="text-center text-xs uppercase tracking-[0.32em] text-(--terracotta)">
                        El menú
                    </p>
                    <h2 className="mt-3 text-center font-jost text-3xl font-semibold text-(--notte-2) sm:text-4xl">
                        Cuatro platos, un solo mar
                    </h2>
                    <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                        {courses.map((course) => (
                            <article
                                key={course.name}
                                className="rounded-2xl border border-(--notte)/10 bg-white p-6 shadow-faro"
                            >
                                <span className="block text-3xl font-semibold italic text-(--azzurro)">
                                    {course.numeral}
                                </span>
                                <h3 className="mt-2 text-xl font-semibold text-(--notte-2)">{course.name}</h3>
                                <ul className="mt-4 space-y-3 text-sm leading-6 text-(--inchiostro)/85">
                                    {course.items.map((item) => (
                                        <li key={item} className="border-t border-(--terracotta)/15 pt-3 first:border-0 first:pt-0">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <div className="h-2 bg-[repeating-linear-gradient(90deg,#E8B23D_0_14px,#4E93B8_14px_28px,#C1502E_28px_42px,#F6EFDD_42px_56px)]" />

            <section className="bg-(--oliva) px-4 py-16 text-(--panna) sm:px-6 lg:py-20">
                <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                    <div>
                        <p className="text-xs uppercase tracking-[0.32em] text-(--limone)">La historia</p>
                        <h2 className="mt-3 max-w-xl font-jost text-3xl font-semibold text-(--panna) sm:text-4xl">
                            Tres generaciones sobre el mismo acantilado
                        </h2>
                        <div className="mt-6 space-y-4 text-sm leading-7 text-(--panna)/90 sm:text-base">
                            <p>
                                Abierta en 1962 por el abuelo Salvatore, la Taberna del Faro ha permanecido
                                en manos de la misma familia durante más de sesenta años.
                            </p>
                            <p>
                                Hoy la sala la dirige Chiara, que mantiene la receta familiar de scialatielli
                                como una pieza central de la casa.
                            </p>
                        </div>
                    </div>
                    <div className="overflow-hidden rounded-2xl shadow-[0_20px_40px_-16px_rgba(0,0,0,0.5)]">
                        <img
                            src="/img/img.jpg"
                            alt="Vista de la Taberna del Faro"
                            className="h-full w-full object-cover"
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}