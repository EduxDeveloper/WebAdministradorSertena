// Importamos useState para manejar el estado del formulario
import { useState } from "react"
// Importamos useNavigate para poder cambiar de pagina programaticamente
import { useNavigate } from "react-router-dom"
// Importamos el fondo animado que se muestra detras de todo
import AnimatedBackground from "../../components/ui/AnimatedBackground"
// Importamos la tarjeta con efecto de cristal que envuelve el formulario
import LiquidGlassCard from "../../components/ui/LiquidGlassCard"
// Importamos el logo de Sertena que se muestra arriba del formulario
import logoSertena from "../../assets/Logo.png"
// Hook de autenticacion para conectar con el backend
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"

// Pagina de inicio de sesion
// Es la primera pantalla que ve el usuario al entrar a la aplicacion
export default function Login() {
  // Estado para guardar el correo que escribe el usuario
  const [email, setEmail] = useState("")
  // Estado para guardar la contraseña que escribe el usuario
  const [password, setPassword] = useState("")
  // Estado para saber si estamos esperando la respuesta del servidor
  const [isLoading, setIsLoading] = useState(false)
  // Hook para navegar a otras paginas
  const navigate = useNavigate()
  // Funcion login que viene del contexto de autenticacion
  const { login } = useAuth()

  // Funcion que se ejecuta cuando el usuario envia el formulario
  const handleSubmit = async (e) => {
    // Evitamos que la pagina se recargue al enviar el formulario
    e.preventDefault()
    // Activamos el estado de carga para mostrar "Ingresando..." en el boton
    setIsLoading(true)

    // Llamada REAL al backend via el contexto de autenticacion
    const result = await login({ email, password })

    setIsLoading(false)

    if (!result.ok) {
      // Si el login falla, mostramos SWAL
      Swal.fire({
        icon: "error",
        title: "Error",
        text: result.message || "Credenciales incorrectas o error en el servidor",
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: "#00E9E9",
      })
      return
    }

    // Si todo sale bien, mostramos exito y mandamos al usuario al dashboard
    Swal.fire({
      icon: "success",
      title: "Bienvenido",
      text: result.message || "Sesión iniciada exitosamente",
      background: "#001a1a",
      color: "#fff",
      confirmButtonColor: "#00E9E9",
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      navigate("/dashboard")
    })
  }

  return (
    // Contenedor principal que ocupa toda la pantalla y centra el contenido
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden">

      {/* Fondo animado con degradado de colores oscuros a cyan */}
      <AnimatedBackground
        colors={["#000000", "#001a1a", "#003333", "#00E9E9"]}
        speed={0.5}
        backgroundColor="#000000"
      />

      {/* Contenedor de la tarjeta de login, z-10 para que quede encima del fondo */}
      <div className="relative" style={{ zIndex: 10 }}>
        <LiquidGlassCard>

          {/* Seccion del logo de Sertena */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '40px',
              animation: 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both',
            }}
          >
            <img
              src={logoSertena}
              alt="Sertena Técnicos Industriales"
              style={{
                width: '280px',
                height: 'auto',
                margin: '0 auto',
                display: 'block',
                filter: 'drop-shadow(0 2px 8px rgba(0,233,233,0.15))',
              }}
            />
          </div>

          {/* Formulario de inicio de sesion */}
          <form onSubmit={handleSubmit}>

            {/* Campo de correo electronico */}
            <div
              style={{
                marginBottom: '24px',
                animation: 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both',
              }}
            >
              <label
                htmlFor="login-email"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '10px',
                }}
              >
                Ingrese su correo electronico:
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="salvador@gmail.com"
                className="login-input"
                required
                autoComplete="email"
              />
            </div>

            {/* Campo de contraseña */}
            <div
              style={{
                marginBottom: '36px',
                animation: 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both',
              }}
            >
              <label
                htmlFor="login-password"
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '400',
                  color: 'rgba(255,255,255,0.7)',
                  marginBottom: '10px',
                }}
              >
                Ingrese su contraseña:
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="contraseña"
                className="login-input"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Boton para enviar el formulario */}
            <div
              style={{
                textAlign: 'center',
                animation: 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both',
              }}
            >
              <button
                type="submit"
                className="login-button"
                disabled={isLoading}
                id="login-submit-btn"
              >
                {isLoading ? "Ingresando..." : "Ingresar"}
              </button>
            </div>

            {/* Enlace para ir a la recuperacion de contraseña */}
            <div
              style={{
                textAlign: 'center',
                marginTop: '20px',
                animation: 'fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.6s both',
              }}
            >
              <button
                type="button"
                onClick={() => navigate("/recovery-email")}
                style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.65)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => e.target.style.color = '#00E9E9'}
                onMouseLeave={(e) => e.target.style.color = 'rgba(255,255,255,0.65)'}
              >
                ¿Olvido su contraseña?
              </button>
            </div>
          </form>
        </LiquidGlassCard>
      </div>
    </div>
  )
}
