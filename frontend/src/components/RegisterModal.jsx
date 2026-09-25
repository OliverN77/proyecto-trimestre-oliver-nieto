import { useMemo, useState } from "react"
import Modal from "./ui/Modal"
import Input from "./ui/Input"
import Select from "./ui/Select"
import Button from "./ui/Button"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api"
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DOCUMENT_PATTERN = /^\d{6,12}$/
const PHONE_PATTERN = /^\d{7,10}$/
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,20}$/

const documentTypes = [
    { value: "CC", label: "Cédula de ciudadanía" },
    { value: "CE", label: "Cédula de extranjería" },
    { value: "TI", label: "Tarjeta de identidad" },
    { value: "PA", label: "Pasaporte" },
]

const INITIAL_STATE = {
    nombre: "",
    apellido: "",
    tipoDocumento: "",
    numeroDocumento: "",
    direccion: "",
    telefono: "",
    email: "",
    password: "",
    confirmPassword: "",
}

const INITIAL_TOUCHED = {
    nombre: false,
    apellido: false,
    tipoDocumento: false,
    numeroDocumento: false,
    direccion: false,
    telefono: false,
    email: false,
    password: false,
    confirmPassword: false,
}

// Centralized per-field validators. Each returns "" when valid or an error string.
function validateField(name, value, form) {
    switch (name) {
        case "nombre":
            if (!value.trim()) return "El nombre es obligatorio (máx. 20 caracteres)"
            return value.length > 20 ? "Máximo 20 caracteres" : ""
        case "apellido":
            if (!value.trim()) return "El apellido es obligatorio (máx. 20 caracteres)"
            return value.length > 20 ? "Máximo 20 caracteres" : ""
        case "tipoDocumento":
            return value ? "" : "Selecciona un tipo de documento"
        case "numeroDocumento":
            if (!value) return "El número de documento es obligatorio"
            return DOCUMENT_PATTERN.test(value) ? "" : "Debe tener entre 6 y 12 dígitos"
        case "direccion":
            return value.length > 50 ? "Máximo 50 caracteres" : ""
        case "telefono":
            if (!value) return "El teléfono es obligatorio"
            return PHONE_PATTERN.test(value) ? "" : "Debe tener entre 7 y 10 dígitos"
        case "email":
            if (!value) return "El correo es obligatorio (máx. 50 caracteres)"
            if (value.length > 50) return "Máximo 50 caracteres"
            return EMAIL_PATTERN.test(value) ? "" : "Escribe un correo electrónico válido"
        case "password":
            if (!value) return "La contraseña es obligatoria"
            return PASSWORD_PATTERN.test(value)
                ? ""
                : "Debe tener 8-20 caracteres, con letras y números"
        case "confirmPassword":
            if (!value) return "Confirma tu contraseña"
            return value === form.password ? "" : "Las contraseñas no coinciden"
        default:
            return ""
    }
}

function validateAll(form) {
    return Object.keys(INITIAL_STATE).reduce((errors, name) => {
        errors[name] = validateField(name, form[name], form)
        return errors
    }, {})
}

export default function RegisterModal({ isOpen, onClose }) {
    const [form, setForm] = useState(INITIAL_STATE)
    const [touched, setTouched] = useState(INITIAL_TOUCHED)
    const [submitError, setSubmitError] = useState("")
    const [success, setSuccess] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Recomputed on every keystroke so feedback is truly real-time.
    const fieldErrors = useMemo(() => validateAll(form), [form])
    const isFormValid = useMemo(
        () => Object.values(fieldErrors).every((error) => !error),
        [fieldErrors]
    )

    function resetForm() {
        setForm(INITIAL_STATE)
        setTouched(INITIAL_TOUCHED)
        setSubmitError("")
        setSuccess("")
    }

    function handleChange(event) {
        let { name, value } = event.target
        if (name === "telefono" || name === "numeroDocumento") {
            value = value.replace(/\D/g, "")
        }
        setForm((previous) => {
            const next = { ...previous, [name]: value }
            // Re-touch confirmPassword so it re-validates live if password changes after it.
            return next
        })
        setSubmitError("")
    }

    function handleBlur(event) {
        const { name } = event.target
        setTouched((previous) => ({ ...previous, [name]: true }))
    }

    function fieldError(name) {
        return touched[name] ? fieldErrors[name] : ""
    }

    async function handleSubmit(event) {
        event.preventDefault()
        // Force every field into "touched" so any hidden errors surface on submit.
        setTouched(Object.fromEntries(Object.keys(INITIAL_STATE).map((key) => [key, true])))

            if (!isFormValid) {
            setSubmitError("Revisa los campos marcados antes de continuar")
            return
        }

        setIsSubmitting(true)
        setSubmitError("")
        try {
            const response = await fetch(`${API_URL}/usuarios/registro`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre: form.nombre,
                    apellido: form.apellido,
                    tipo_documento: form.tipoDocumento,
                    numero_documento: form.numeroDocumento,
                    direccion: form.direccion,
                    telefono: form.telefono,
                    correo: form.email,
                    contrasena: form.password,
                    confirmar_contrasena: form.confirmPassword,
                }),
            })
            const data = await response.json()
            if (!response.ok) {
                setSubmitError(data.detail || data.mensaje || "No se pudo completar el registro")
                return
            }
            setSuccess("Usuario registrado correctamente.")
            setForm(INITIAL_STATE)
            setTouched(INITIAL_TOUCHED)
        } catch {
            setSubmitError("No se pudo conectar con el servidor")
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleClose() {
        resetForm()
        onClose()
    }

    if (success) {
        return (
            <Modal isOpen={isOpen} onClose={handleClose} title="¡Registro Exitoso!" closeOnOutsideClick={false}>
                <div className="py-6 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="mb-2 font-jost text-2xl font-bold text-(--notte)">¡Bienvenido!</h3>
                    <p className="mb-8 text-gray-600">{success}</p>
                    <Button type="button" variant="notte" onClick={handleClose} fullWidth>
                        Continuar
                    </Button>
                </div>
            </Modal>
        )
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Crear una cuenta" closeOnOutsideClick={false}>
            <form noValidate onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FieldWrapper error={fieldError("nombre")}>
                        <Input
                            label="Nombre"
                            name="nombre"
                            value={form.nombre}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={20}
                            aria-invalid={Boolean(fieldError("nombre"))}
                        />
                    </FieldWrapper>

                    <FieldWrapper error={fieldError("apellido")}>
                        <Input
                            label="Apellido"
                            name="apellido"
                            value={form.apellido}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={20}
                            aria-invalid={Boolean(fieldError("apellido"))}
                        />
                    </FieldWrapper>

                    <FieldWrapper error={fieldError("tipoDocumento")}>
                        <Select
                            label="Tipo de documento"
                            name="tipoDocumento"
                            value={form.tipoDocumento}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            options={documentTypes}
                            required
                            aria-invalid={Boolean(fieldError("tipoDocumento"))}
                        />
                    </FieldWrapper>

                    <FieldWrapper error={fieldError("numeroDocumento")}>
                        <Input
                            type="text"
                            label="Número de documento"
                            name="numeroDocumento"
                            value={form.numeroDocumento}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={12}
                            inputMode="numeric"
                            aria-invalid={Boolean(fieldError("numeroDocumento"))}
                        />
                    </FieldWrapper>
                </div>

                <FieldWrapper error={fieldError("direccion")}>
                    <Input
                        label="Dirección"
                        name="direccion"
                        value={form.direccion}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        maxLength={50}
                    />
                </FieldWrapper>

                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                    <FieldWrapper error={fieldError("telefono")}>
                        <Input
                            type="text"
                            label="Teléfono"
                            name="telefono"
                            value={form.telefono}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={10}
                            inputMode="numeric"
                            aria-invalid={Boolean(fieldError("telefono"))}
                        />
                    </FieldWrapper>

                    <FieldWrapper error={fieldError("email")}>
                        <Input
                            label="Correo electrónico"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={50}
                            aria-invalid={Boolean(fieldError("email"))}
                        />
                    </FieldWrapper>

                    <FieldWrapper error={fieldError("password")}>
                        <Input
                            label="Contraseña"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={20}
                            aria-invalid={Boolean(fieldError("password"))}
                        />
                    </FieldWrapper>

                    <FieldWrapper error={fieldError("confirmPassword")}>
                        <Input
                            label="Confirmar contraseña"
                            name="confirmPassword"
                            type="password"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required
                            maxLength={20}
                            aria-invalid={Boolean(fieldError("confirmPassword"))}
                        />
                    </FieldWrapper>
                </div>

                {submitError ? (
                    <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
                ) : null}

                <Button type="submit" variant="limone" fullWidth disabled={isSubmitting}>
                    {isSubmitting ? "Registrando..." : "Registrarme"}
                </Button>
            </form>
        </Modal>
    )
}

function FieldWrapper({ error, children }) {
    return (
        <div className="mb-3">
            {children}
            {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </div>
    )
}