import { useEffect, useState } from "react"

const slides = [
    { src: "/slides/slide-1.jfif", title: "Risotto al Limone", desc: "Cremoso, cítrico y equilibrado." },
    { src: "/slides/slide-2.jfif", title: "Spaghetti alle Vongole", desc: "Pasta fresca con almejas y vino blanco." },
    { src: "/slides/slide-3.jfif", title: "Bruschetta della Costa", desc: "Pan tostado con tomate y albahaca." },
    { src: "/slides/slide-4.jfif", title: "Branzino al Forno", desc: "Lubina horneada al estilo amalfitano." },
    { src: "/slides/slide-5.jfif", title: "Insalata Caprese", desc: "Tomate, mozzarella fresca y albahaca." },
    { src: "/slides/slide-6.jfif", title: "Tagliatelle al Tartufo", desc: "Pasta artesanal con trufa negra." },
    { src: "/slides/slide-7.jfif", title: "Polpo alla Griglia", desc: "Pulpo a la parrilla con papas confitadas." },
    { src: "/slides/slide-8.jfif", title: "Tiramisù Classico", desc: "El postre italiano por excelencia." },
    { src: "/slides/slide-9.jfif", title: "Panna Cotta al Limone", desc: "Suave y ligera, con esencia cítrica." },
    { src: "/slides/slide-10.jfif", title: "Vino della Casa", desc: "Selección de la bodega de la casa." },
]

export default function Carrusel() {
    const [currentIndex, setCurrentIndex] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentIndex((previous) => (previous + 1) % slides.length)
        }, 5000)

        return () => clearInterval(timer)
    }, [])

    return (
        <section className="bg-(--notte-2) px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
            <div className="mx-auto max-w-6xl">
                <div className="mb-6 text-center text-(--panna)">
                    <p className="text-xs uppercase tracking-[0.35em] text-(--limone)/90">Carrusel</p>
                    <h1 className="mt-3 font-jost text-3xl font-semibold sm:text-4xl">Selección de platos y ambiente</h1>
                </div>

                <div className="relative overflow-hidden rounded-3xl border border-(--limone)/15 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-[repeating-linear-gradient(90deg,#E8B23D_0_14px,#4E93B8_14px_28px,#C1502E_28px_42px,#F6EFDD_42px_56px)]" />

                    <div className="grid items-center gap-4 p-4 sm:p-6 lg:grid-cols-[auto_1fr_auto] lg:gap-6 lg:p-8">
                        <button
                            type="button"
                            onClick={() => setCurrentIndex((previous) => (previous === 0 ? slides.length - 1 : previous - 1))}
                            aria-label="Imagen anterior"
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-(--limone)/30 bg-(--limone) text-(--notte-2) transition hover:-translate-y-0.5 hover:bg-(--limone)/90 focus:outline-none focus:ring-4 focus:ring-(--limone)/30"
                        >
                            &lt;
                        </button>

                        <div className="relative overflow-hidden rounded-2xl bg-(--panna) p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] sm:p-3">
                            <img
                                src={slides[currentIndex].src}
                                alt={slides[currentIndex].title}
                                className="w-full rounded-xl object-cover"
                                style={{ aspectRatio: "4 / 3" }}
                            />
                            <div
                                className="absolute inset-x-2 bottom-2 rounded-xl p-4 sm:inset-x-3 sm:bottom-3 sm:p-5"
                                style={{ background: "linear-gradient(to top, rgba(14, 35, 56, 0.95), transparent)" }}
                            >
                                <h2 className="font-jost text-xl font-semibold text-[#f6efdd] sm:text-2xl">
                                    {slides[currentIndex].title}
                                </h2>
                                <p className="mt-1 max-w-2xl text-sm text-[#f6efdd] sm:text-base">
                                    {slides[currentIndex].desc}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setCurrentIndex((previous) => (previous + 1) % slides.length)}
                            aria-label="Imagen siguiente"
                            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-(--limone)/30 bg-(--limone) text-(--notte-2) transition hover:-translate-y-0.5 hover:bg-(--limone)/90 focus:outline-none focus:ring-4 focus:ring-(--limone)/30"
                        >
                            &gt;
                        </button>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 px-4 pb-5 sm:px-6 lg:px-8 lg:pb-8">
                        {slides.map((slide, index) => (
                            <button
                                type="button"
                                key={slide.title}
                                onClick={() => setCurrentIndex(index)}
                                aria-label={`Ir a ${slide.title}`}
                                className={`h-2.5 rounded-full transition-all ${index === currentIndex ? "w-8 bg-(--limone)" : "w-2.5 bg-(--panna)/40 hover:bg-(--panna)/70"}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}