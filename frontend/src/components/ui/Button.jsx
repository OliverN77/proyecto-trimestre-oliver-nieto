const VARIANTS = {
    limone: "bg-(--limone) text-(--notte-2) hover:bg-(--limone)/90 focus:ring-(--limone)/40",
    terracotta: "bg-(--terracotta) text-(--panna) hover:bg-(--terracotta)/90 focus:ring-(--terracotta)/40",
    notte: "bg-(--notte) text-(--panna) hover:bg-(--notte)/90 focus:ring-(--notte)/40",
    outline: "border border-(--notte) text-(--notte) hover:bg-(--notte) hover:text-(--panna) focus:ring-(--notte)/30",
}

export default function Button({
    children,
    variant = "notte",
    type = "button",
    onClick,
    disabled = false,
    fullWidth = false,
    className = "",
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`rounded-lg px-5 py-2.5 font-medium tracking-wide transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-50 ${fullWidth ? "w-full" : ""} ${VARIANTS[variant] ?? VARIANTS.notte} ${className}`}
        >
            {children}
        </button>
    )
}