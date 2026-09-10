import { useEffect } from "react"

export default function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (!isOpen) {
            return undefined
        }

        const previousOverflow = document.body.style.overflow

        const handleEsc = (event) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        document.addEventListener("keydown", handleEsc)
        document.body.style.overflow = "hidden"

        return () => {
            document.removeEventListener("keydown", handleEsc)
            document.body.style.overflow = previousOverflow
        }
    }, [isOpen, onClose])

    if (!isOpen) {
        return null
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-(--notte-2)/70 px-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-(--panna) p-6 shadow-faro sm:p-8"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-(--notte) transition hover:bg-(--notte)/10"
                >
                    ✕
                </button>
                {title ? <h2 className="mb-6 font-jost text-2xl font-semibold text-(--notte)">{title}</h2> : null}
                {children}
            </div>
        </div>
    )
}