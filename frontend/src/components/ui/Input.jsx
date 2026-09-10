export default function Input({
    label,
    name,
    type = "text",
    value,
    onChange,
    onBlur,
    placeholder = "",
    error = "",
    required = false,
    maxLength,
}) {
    return (
        <div className="mb-4">
            {label ? (
                <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-(--notte)">
                    {label} {required ? <span className="text-(--terracotta)">*</span> : null}
                </label>
            ) : null}
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                maxLength={maxLength}
                className={`input-base ${error ? "input-error" : ""}`}
            />
            {error ? <p className="mt-1 text-xs font-medium text-(--terracotta)">{error}</p> : null}
        </div>
    )
}