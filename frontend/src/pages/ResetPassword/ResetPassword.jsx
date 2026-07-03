// Importamos useState para manejar los estados del formulario
import { useState } from "react"
// Hook para navegar entre paginas
import { useNavigate } from "react-router-dom"
// Componentes visuales
import AnimatedBackground from "../../components/ui/AnimatedBackground"
import LiquidGlassCard from "../../components/ui/LiquidGlassCard"
// Hook de autenticacion para conectar con el backend
import useAuth from "../../hooks/useAuth"

// Pagina para restablecer la contraseña
// El usuario llega aqui despues de verificar su codigo correctamente
export default function ResetPassword() {
  // Estado para la nueva contraseña
  const [password, setPassword] = useState("")
  // Estado para la confirmacion de la contraseña
  const [confirmPassword, setConfirmPassword] = useState("")
  // Estado de carga mientras se procesa el cambio
  const [isLoading, setIsLoading] = useState(false)
  // Estado para mostrar mensajes de error (como contraseñas que no coinciden)
  const [error, setError] = useState("")
  // Estado que indica si la contraseña se cambio con exito
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()
  // Funcion para restablecer la contraseña que viene del contexto
  const { resetPassword } = useAuth()

  // Longitud minima requerida para la nueva contraseña
  const MIN_PASSWORD_LENGTH = 8

  // Funcion que se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    // Limpiamos errores anteriores
    setError("")

    // VALIDACION: campos requeridos
    if (!password || !confirmPassword) {
      setError("Debe completar ambos campos")
      return
    }

    // VALIDACION: longitud minima de la contraseña
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`)
      return
    }

    // VALIDACION: al menos una letra y un numero, para evitar contraseñas debiles
    const hasLetter = /[a-zA-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    if (!hasLetter || !hasNumber) {
      setError("La contraseña debe incluir letras y numeros")
      return
    }

    // Validamos que las dos contraseñas sean iguales
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    // Llamada REAL al backend para restablecer la contraseña
    const result = await resetPassword({ 
      newPassword: password, 
      confirmNewPassword: confirmPassword 
    })

    setIsLoading(false)

    if (!result.ok) {
      // Si ocurre un error, mostramos el mensaje
      setError(result.message)
      return
    }

    // Mostramos el mensaje de exito
    setSuccess(true)
    // Despues de 2 segundos redirigimos al login
    setTimeout(() => {
      navigate("/login")
    }, 2000)
  }

  return (
    // Contenedor principal centrado en la pantalla
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">

      {/* Fondo animado */}
      <AnimatedBackground
        colors={["#000000", "#001a1a", "#003333", "#00E9E9"]}
        speed={0.5}
        backgroundColor="#000000"
      />

      {/* Tarjeta de cristal */}
      <div className="relative" style={{ zIndex: 10 }}>
        <LiquidGlassCard>

          {/* Encabezado */}
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
              Restablecer contraseña
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(255,255,255,0.7)",
                lineHeight: "1.5",
              }}
            >
              Ingrese su nueva contraseña
            </p>
          </div>

          {/* Si el cambio fue exitoso, mostramos el mensaje de confirmacion */}
          {success ? (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both",
              }}
            >
              {/* Circulo verde con el icono de check */}
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  margin: "0 auto 20px",
                  borderRadius: "50%",
                  background: "rgba(0, 233, 233, 0.15)",
                  border: "1px solid #00E9E9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00E9E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "8px" }}>
                ¡Contraseña cambiada!
              </h2>
              <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.5)" }}>
                Redirigiendo al login...
              </p>
            </div>
          ) : (
            // Si todavia no se ha cambiado, mostramos el formulario
            <form onSubmit={handleSubmit}>

              {/* Mensaje de error si las contraseñas no coinciden */}
              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.4)",
                    borderRadius: "10px",
                    color: "#fca5a5",
                    fontSize: "13px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  {error}
                </div>
              )}

              {/* Campo de nueva contraseña */}
              <div
                style={{
                  marginBottom: "20px",
                  animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
                }}
              >
                <label
                  htmlFor="reset-password-input"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "10px",
                  }}
                >
                  Ingrese su Contraseña
                </label>
                <input
                  id="reset-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="login-input"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Campo de confirmacion de contraseña */}
              <div
                style={{
                  marginBottom: "36px",
                  animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both",
                }}
              >
                <label
                  htmlFor="confirm-password-input"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "400",
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "10px",
                  }}
                >
                  Confime su Contraseña
                </label>
                <input
                  id="confirm-password-input"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confrimar Contraseña"
                  className="login-input"
                  required
                  autoComplete="new-password"
                />
              </div>

              {/* Boton para cambiar la contraseña */}
              <div
                style={{
                  textAlign: "center",
                  animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both",
                }}
              >
                <button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                >
                  {isLoading ? "Cambiando..." : "Cambiar contraseña"}
                </button>
              </div>

              {/* Enlace para regresar al login */}
              <div
                style={{
                  textAlign: "center",
                  marginTop: "24px",
                  animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both",
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
          )}
        </LiquidGlassCard>
      </div>
    </div>
  )
}