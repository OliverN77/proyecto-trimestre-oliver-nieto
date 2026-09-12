function Footer() {
    return (
        <footer className="border-t border-(--limone)/15 bg-(--notte-2) px-4 py-10 text-(--panna)/80 sm:px-6">
            <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
                <div>
                    <h3 className="mb-3 font-jost text-xl font-semibold text-(--limone)">Taberna del Faro</h3>
                    <p className="max-w-sm text-sm leading-relaxed">
                        Cocina marinera con una identidad mediterránea sobria, luminosa y cercana.
                    </p>
                </div>
                <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-(--azzurro)">
                        Contacto
                    </h4>
                    <p className="text-sm">Via del Faro 12</p>
                    <p className="text-sm">Praiano, Costa Amalfitana</p>
                    <p className="text-sm">+39 089 555 0192</p>
                </div>
                <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-(--azzurro)">
                        Horario
                    </h4>
                    <p className="text-sm">Martes - Domingo</p>
                    <p className="text-sm">19:00 - 23:30</p>
                </div>
                <div>
                    <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-(--azzurro)">
                        Ubicación
                    </h4>
                    <div className="overflow-hidden rounded-lg border border-(--limone)/15">
                        <iframe
                            title="Ubicación de Taberna del Faro"
                            src="https://www.google.com/maps?q=Praiano,Costa+Amalfitana,Italia&output=embed"
                            width="100%"
                            height="160"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            className="grayscale-[15%] sepia-[8%]"
                        ></iframe>
                    </div>
                </div>
            </div>
            <p className="mt-8 text-center text-xs tracking-[0.18em] text-(--panna)/50">
                &copy; {new Date().getFullYear()} Taberna del Faro
            </p>
        </footer>
    )
}

export default Footer