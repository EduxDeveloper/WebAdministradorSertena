// Importamos useState para manejar el estado del formulario
import { useState } from "react"
// Importamos useNavigate para navegar entre paginas
import { useNavigate } from "react-router-dom"
// Importamos el fondo animado y la tarjeta de cristal
import AnimatedBackground from "../../components/ui/AnimatedBackground"
import LiquidGlassCard from "../../components/ui/LiquidGlassCard"
// Hook de autenticacion para conectar con el backend
import useAuth from "../../hooks/useAuth"

// Pagina de recuperacion de contraseña
// Aqui el usuario ingresa su correo para que le enviemos un codigo de verificacion
export default function RecoveryEmail() {
  // Estado para guardar el correo que escribe el usuario
  const [email, setEmail] = useState("")
  // Estado para saber si estamos esperando la respuesta del servidor
  const [isLoading, setIsLoading] = useState(false)
  // Estado para mostrar mensajes de error
  const [error, setError] = useState("")
  // Hook para navegar a otras paginas
  const navigate = useNavigate()
  // Funcion para solicitar codigo de recuperacion que viene del contexto
  const { requestRecoveryCode } = useAuth()

  // Expresion regular simple para validar formato de correo electronico
  const CORREO_PATRON = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  // Funcion que se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    // Prevenimos que la pagina se recargue
    e.preventDefault()
    // Limpiamos errores anteriores
    setError("")

    // Quitamos espacios en blanco antes de validar
    const trimmedEmail = email.trim()

    // VALIDACION: campo requerido
    if (!trimmedEmail) {
      setError("El correo electronico es obligatorio")
      return
    }

    // VALIDACION: formato de correo valido
    if (!CORREO_PATRON.test(trimmedEmail)) {
      setError("Ingrese un correo electronico valido")
      return
    }

    // Activamos el estado de carga
    setIsLoading(true)

    // Llamada REAL al backend: solicita que se envie el codigo OTP al correo
    const result = await requestRecoveryCode({ email: trimmedEmail })

    setIsLoading(false)

    if (!result.ok) {
      // Si el correo no existe en la BD o hay error, mostramos el mensaje
      setError(result.message)
      return
    }

    // Si se envio exitosamente, navegamos a la pantalla de verificacion
    // Enviamos el correo en el state para poder reenviar el codigo despues
    navigate("/verify-code", { state: { email: trimmedEmail } })
  }

  return (
    // Contenedor principal centrado en toda la pantalla
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">

      {/* Fondo animado igual que en el login */}
      <AnimatedBackground
        colors={["#000000", "#001a1a", "#003333", "#00E9E9"]}
        speed={0.5}
        backgroundColor="#000000"
      />

      {/* Tarjeta de cristal con el formulario */}
      <div className="relative" style={{ zIndex: 10 }}>
        <LiquidGlassCard>

          {/* Encabezado con titulo y descripcion */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "36px",
              animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both",
            }}
          >
            <h1
              style={{
                fontSize: "30px",
                fontWeight: "700",
                color: "#fff",
                marginBottom: "12px",
                letterSpacing: "-0.5px",
              }}
            >
              Recuperacion de contraseña
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: "1.5",
                maxWidth: "380px",
                margin: "0 auto",
              }}
            >
              Ingrese su correo electronico y le enviaremos un codigo para recuperar su cuenta
            </p>
          </div>

          {/* Mensaje de error si el correo no existe en la base de datos */}
          {error && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '10px',
                color: '#fca5a5',
                fontSize: '13px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {/* Formulario con el campo de correo */}
          <form onSubmit={handleSubmit}>

            {/* Campo de correo electronico */}
            <div
              style={{
                marginBottom: "36px",
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
              }}
            >
              <label
                htmlFor="recovery-email"
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "10px",
                }}
              >
                Ingrese su correo electronico:
              </label>
              <input
                id="recovery-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salvador@gmail.com"
                className="login-input"
                required
                autoComplete="email"
              />
            </div>

            {/* Boton para enviar el codigo */}
            <div
              style={{
                textAlign: "center",
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both",
              }}
            >
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? "Enviando..." : "Enviar Codigo"}
              </button>
            </div>

            {/* Enlace para regresar al login */}
            <div
              style={{
                textAlign: "center",
                marginTop: "24px",
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both",
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/login")}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.65)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#00E9E9")}
                onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.65)")}
              >
                ← Regresar al login
              </button>
            </div>
          </form>
        </LiquidGlassCard>
      </div>
    </div>
  )
}