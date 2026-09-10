export default function Select({
    label,
    name,
    value,
    onChange,
    onBlur,
    options = [],
    error = "",
    required = false,
}) {
    return (
        <div className="mb-4">
            {label ? (
                <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-(--notte)">
                    {label} {required ? <span className="text-(--terracotta)">*</span> : null}
                </label>
            ) : null}
            <select
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                className={`input-base bg-white ${error ? "input-error" : ""}`}
            >
                <option value="">Selecciona una opción</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error ? <p className="mt-1 text-xs font-medium text-(--terracotta)">{error}</p> : null}
        </div>
    )
}