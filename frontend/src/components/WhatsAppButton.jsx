export default function WhatsAppButton({ numero = '573001234567', mensaje = 'Hola, quiero más información' }) {
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Contactar por WhatsApp"
            className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-xl font-bold text-white shadow-lg transition-transform hover:scale-105"
        >
            <img src="img/whatsapp-icon.svg" alt="WhatsApp" className="h-10 w-10" />
        </a>
    )
}
