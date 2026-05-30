// Importamos useState para poder guardar la posicion del mouse
import { useState } from "react"

// Componente de tarjeta con efecto de cristal liquido (glassmorphism)
// Se usa como contenedor en las pantallas de login, recuperacion, etc.
export default function LiquidGlassCard({ children, className = "" }) {
  // Guardamos la posicion del mouse dentro de la tarjeta
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Cuando el mouse se mueve, calculamos su posicion relativa a la tarjeta
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
  }

  return (
    // Contenedor con efecto de vidrio esmerilado (clase liquid-glass del CSS)
    <div
      className={`liquid-glass relative ${className}`}
      onMouseMove={handleMouseMove}
      style={{
        width: '520px',
        maxWidth: '92vw',
        padding: '48px 50px 44px',
        position: 'relative',
        animation: 'fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      }}
    >
      {/* Circulo de luz que sigue al cursor, da efecto interactivo */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: '250px',
          height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,233,233,0.06), transparent 70%)',
          left: mousePos.x - 125,
          top: mousePos.y - 125,
          transition: 'left 0.3s ease, top 0.3s ease',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      {/* Contenido real de la tarjeta, encima del resplandor */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
