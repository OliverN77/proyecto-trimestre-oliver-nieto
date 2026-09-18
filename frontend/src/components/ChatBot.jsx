import { useState, useRef, useEffect } from "react"
import { API_URL } from "../api"

export default function ChatBot({ token }) {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: "assistant", text: "¡Hola! 👋 Soy Faro, el asistente virtual de la Taberna del Faro. ¿En qué puedo ayudarte hoy?" }
    ])
    const [input, setInput] = useState("")
    const [loading, setLoading] = useState(false)
    const [idConversacion, setIdConversacion] = useState(null)
    const messagesEndRef = useRef(null)

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [messages])

    async function sendMessage(e) {
        e.preventDefault()
        if (!input.trim()) return

        const userText = input.trim()
        setInput("")
        setMessages(prev => [...prev, { role: "user", text: userText }])
        setLoading(true)

        try {
            // Optional token if logged in
            const headers = { "Content-Type": "application/json" }
            const savedToken = token || localStorage.getItem("token")
            if (savedToken) {
                headers["Authorization"] = `Bearer ${savedToken}`
            }

            const payload = { mensaje: userText }
            if (idConversacion) payload.id_conversacion = idConversacion

            const res = await fetch(`${API_URL}/chatbot`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                setIdConversacion(data.id_conversacion)
                setMessages(prev => [...prev, { role: "assistant", text: data.respuesta }])
            } else {
                setMessages(prev => [...prev, { role: "assistant", text: "Lo siento, tuve un problema de conexión. 🔌" }])
            }
        } catch {
            setMessages(prev => [...prev, { role: "assistant", text: "Lo siento, no pude conectar con el servidor. 🔌" }])
        }
        setLoading(false)
    }

    return (
        <div style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
            
            {/* Chat Panel */}
            {isOpen && (
                <div style={{ 
                    width: "350px", 
                    height: "500px", 
                    maxHeight: "80vh", 
                    backgroundColor: "white", 
                    borderRadius: "1rem", 
                    boxShadow: "0 10px 40px rgba(22,50,79,0.2)",
                    marginBottom: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid rgba(22,50,79,0.1)"
                }}>
                    {/* Header */}
                    <div style={{ background: "var(--notte)", padding: "1rem", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ width: "32px", height: "32px", background: "var(--limone)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>🤖</div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 600, fontFamily: "Jost, sans-serif" }}>Faro</h4>
                                <span style={{ fontSize: "0.7rem", opacity: 0.8 }}>Asistente Virtual</span>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: "transparent", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer", opacity: 0.8, hover: { opacity: 1 } }}>✕</button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.8rem", background: "rgba(246,239,221,0.3)" }}>
                        {messages.map((m, i) => (
                            <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                                <div style={{
                                    padding: "0.75rem 1rem",
                                    borderRadius: "1rem",
                                    borderBottomRightRadius: m.role === "user" ? 0 : "1rem",
                                    borderBottomLeftRadius: m.role === "assistant" ? 0 : "1rem",
                                    background: m.role === "user" ? "var(--azzurro)" : "white",
                                    color: m.role === "user" ? "white" : "var(--notte)",
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                                    fontSize: "0.85rem",
                                    lineHeight: "1.4",
                                    whiteSpace: "pre-wrap"
                                }}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div style={{ alignSelf: "flex-start", padding: "0.75rem 1rem", borderRadius: "1rem", borderBottomLeftRadius: 0, background: "white", boxShadow: "0 2px 5px rgba(0,0,0,0.05)", fontSize: "0.85rem", display: "flex", gap: "0.3rem" }}>
                                <span className="animate-pulse">●</span><span className="animate-pulse" style={{ animationDelay: "0.2s" }}>●</span><span className="animate-pulse" style={{ animationDelay: "0.4s" }}>●</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} style={{ padding: "0.75rem", background: "white", borderTop: "1px solid rgba(22,50,79,0.1)", display: "flex", gap: "0.5rem" }}>
                        <input 
                            type="text" 
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            placeholder="Escribe un mensaje..." 
                            style={{ flex: 1, padding: "0.6rem 1rem", borderRadius: "999px", border: "1px solid rgba(22,50,79,0.2)", fontSize: "0.85rem", outline: "none" }}
                        />
                        <button type="submit" disabled={!input.trim() || loading} style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--oliva)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "default", opacity: input.trim() && !loading ? 1 : 0.5 }}>
                            ➤
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                style={{ 
                    width: "60px", 
                    height: "60px", 
                    borderRadius: "50%", 
                    background: "var(--notte)", 
                    color: "var(--limone)", 
                    border: "none", 
                    boxShadow: "0 4px 15px rgba(22,50,79,0.3)", 
                    cursor: "pointer", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "2rem",
                    transition: "transform 0.2s ease"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "scale(1)"}
            >
                {isOpen ? "✕" : "🤖"}
            </button>
        </div>
    )
}
