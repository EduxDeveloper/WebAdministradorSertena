// Importamos los hooks necesarios de React
import { useState, useRef, useEffect } from "react"
// Hooks para navegar entre paginas y leer el state de navegacion
import { useNavigate, useLocation } from "react-router-dom"
// Componentes visuales reutilizables
import AnimatedBackground from "../../components/ui/AnimatedBackground"
import LiquidGlassCard from "../../components/ui/LiquidGlassCard"
// Hook de autenticacion para conectar con el backend
import useAuth from "../../hooks/useAuth"

// Pagina para verificar el codigo de 6 digitos que se envio al correo
// El backend genera un randomCode con crypto.randomBytes(3).toString('hex') = 6 caracteres hexadecimales
export default function VerifyCode() {
  // Arreglo de 6 posiciones vacias, una por cada caracter del codigo hex
  const [code, setCode] = useState(["", "", "", "", "", ""])
  // Estado de carga mientras se valida el codigo
  const [isLoading, setIsLoading] = useState(false)
  // Estado para mostrar mensajes de error
  const [error, setError] = useState("")
  // Referencias a cada uno de los 6 campos de texto para poder mover el foco entre ellos
  const inputRefs = [
    useRef(null), useRef(null), useRef(null),
    useRef(null), useRef(null), useRef(null)
  ]
  const navigate = useNavigate()
  // Leemos el location para recuperar el email enviado desde RecoveryEmail
  const location = useLocation()
  const email = location.state?.email
  // Funcion para verificar el codigo y para reenviarlo, ambas del contexto
  const { verifyRecoveryCode, requestRecoveryCode } = useAuth()

  // VALIDACION: si el usuario llega directo a esta pagina sin pasar por
  // RecoveryEmail (por ejemplo escribiendo la URL a mano), no tenemos el
  // correo necesario para reenviar el codigo, asi que lo regresamos.
  useEffect(() => {
    if (!email) {
      navigate("/recovery-email", { replace: true })
    }
  }, [email, navigate])

  // Efecto que se ejecuta cada vez que cambia el codigo
  // Si los 6 caracteres estan llenos, envia automaticamente
  useEffect(() => {
    if (code.every((val) => val !== "")) {
      handleVerify(code.join(""))
    }
  }, [code])

  // Funcion para reenviar el codigo de verificacion al correo
  // (antes no existia y el boton "Reenviar Codigo" rompia la pagina)
  const handleResend = async () => {
    if (!email) return

    setError("")
    setIsLoading(true)

    const result = await requestRecoveryCode({ email })

    setIsLoading(false)

    if (!result.ok) {
      setError(result.message)
      return
    }

    // Limpiamos el codigo actual para que el usuario ingrese el nuevo
    setCode(["", "", "", "", "", ""])
    inputRefs[0].current?.focus()
  }

  // Funcion que hace la llamada real al backend para verificar el codigo
  const handleVerify = async (fullCode) => {
    setError("")
    setIsLoading(true)

    // Llamada REAL al backend: verifica el codigo OTP en la cookie de recuperacion
    const result = await verifyRecoveryCode({ code: fullCode })

    setIsLoading(false)

    if (!result.ok) {
      // Si el codigo es invalido, mostramos el error y limpiamos los campos
      setError(result.message)
      setCode(["", "", "", "", "", ""])
      // Ponemos el foco de vuelta al primer campo
      inputRefs[0].current?.focus()
      return
    }

    // Si el codigo es correcto, navegamos a restablecer contraseña
    navigate("/reset-password")
  }


  // Maneja cuando el usuario escribe en un campo de caracter
  const handleChange = (index, value) => {
    // Solo permitimos caracteres hexadecimales (numeros 0-9 y letras a-f)
    if (!/^[0-9a-fA-F]*$/.test(value)) return

    // Copiamos el arreglo del codigo y ponemos solo el ultimo caracter que escribio
    const newCode = [...code]
    newCode[index] = value.substring(value.length - 1).toLowerCase()
    setCode(newCode)

    // Si escribio algo y no es el ultimo campo, movemos el foco al siguiente
    if (value && index < 5) {
      inputRefs[index + 1].current.focus()
    }
  }

  // Maneja cuando el usuario presiona una tecla
  const handleKeyDown = (index, e) => {
    // Si presiono Backspace (borrar)
    if (e.key === "Backspace") {
      if (code[index] === "" && index > 0) {
        // Si el campo ya esta vacio, borramos el anterior y movemos el foco atras
        const newCode = [...code]
        newCode[index - 1] = ""
        setCode(newCode)
        inputRefs[index - 1].current.focus()
      } else {
        // Si tiene algo, solo lo borramos
        const newCode = [...code]
        newCode[index] = ""
        setCode(newCode)
      }
    }
  }

  // Maneja cuando el usuario pega texto desde el portapapeles
  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()
    // Solo aceptamos si lo pegado son caracteres hexadecimales
    if (!/^[0-9a-fA-F]+$/.test(pastedData)) return

    // Tomamos los primeros 6 caracteres del texto pegado
    const chars = pastedData.slice(0, 6).toLowerCase().split("")
    const newCode = [...code]
    chars.forEach((char, i) => {
      newCode[i] = char
    })
    setCode(newCode)

    // Movemos el foco al ultimo caracter que se pego
    const lastFilledIndex = Math.min(chars.length - 1, 5)
    inputRefs[lastFilledIndex].current.focus()
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

      {/* Tarjeta de verificacion */}
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
              Ingrese el codigo que le enviamos a su correo, el codigo podria tardar en llegar de 2 a 3 minutos.
            </p>
          </div>

          {/* Mensaje de error si el código es inválido */}
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

          {/* Formulario con los campos de digitos */}
          <form onSubmit={(e) => e.preventDefault()}>

            {/* Etiqueta del codigo */}
            <div
              style={{
                marginBottom: "24px",
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "16px",
                }}
              >
                Ingrese el codigo de 6 digitos:
              </label>

              {/* Fila de 6 cuadros para los digitos */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  width: "100%",
                  maxWidth: "420px",
                  margin: "0 auto",
                }}
              >
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={isLoading}
                    style={{
                      width: "60px",
                      height: "60px",
                      background: "rgba(255, 255, 255, 0.07)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "16px",
                      color: "#fff",
                      fontSize: "24px",
                      fontWeight: "600",
                      textAlign: "center",
                      outline: "none",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    className="verify-digit-input"
                  />
                ))}
              </div>
            </div>

            {/* Boton para reenviar el codigo */}
            <div
              style={{
                textAlign: "center",
                animation: "fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.4s both",
              }}
            >
              <button
                type="button"
                onClick={handleResend}
                className="login-button"
                disabled={isLoading}
              >
                {isLoading ? "Validando..." : "Reenviar Codigo"}
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

      {/* Estilos para el resplandor cyan cuando se hace foco en un campo de digito */}
      <style>{`
        .verify-digit-input:focus {
          border-color: rgba(0, 233, 233, 0.5) !important;
          background: rgba(255, 255, 255, 0.12) !important;
          box-shadow: 0 0 16px rgba(0, 233, 233, 0.15) !important;
        }
      `}</style>
    </div>
  )
}