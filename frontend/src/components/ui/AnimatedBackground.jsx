// Importamos useState de React aunque no se usa directamente aqui, por si se necesita luego
import { useState } from "react"
// Importamos el componente MeshGradient de la libreria de shaders
// Este es el que genera el degradado animado usando WebGL (la tarjeta grafica)
import { MeshGradient } from "@paper-design/shaders-react"

// Componente del fondo animado que se usa en todas las pantallas
// Recibe colores, velocidad, color de fondo y clases CSS como propiedades
// Si no se pasan, usa los valores por defecto que estan definidos abajo
export default function AnimatedBackground({
  colors = ["#000000", "#002b2b", "#004d4d", "#00E9E9"],  // 4 colores del degradado, van de negro a cyan
  speed = 0.6,                                              // velocidad de la animacion del degradado
  backgroundColor = "#000000",                              // color de fondo detras del shader
  className = "",                                           // clases CSS adicionales por si se necesitan
}) {
  return (
    // Contenedor principal que ocupa toda la pantalla
    // fixed + inset-0 hace que se quede fijo cubriendo todo el viewport
    // zIndex 0 para que quede detras de todo el contenido
    <div className={`fixed inset-0 w-full h-full ${className}`} style={{ zIndex: 0 }}>

      {/* Este es el degradado animado principal */}
      {/* MeshGradient usa WebGL para renderizar un degradado que se mueve y deforma */}
      {/* Los 4 colores se mezclan entre si y se van moviendo segun la velocidad */}
      <MeshGradient
        className="w-full h-full absolute inset-0"
        colors={colors}
        speed={speed}
        backgroundColor={backgroundColor}
      />

      {/* Capa de particulas de resplandor ambiental */}
      {/* Son circulos grandes difuminados que pulsan lentamente */}
      {/* pointer-events-none para que no interfieran con los clicks del usuario */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">

        {/* Primera particula: circulo grande arriba a la izquierda */}
        {/* Tiene 400px de tamaño, esta al 10% desde arriba y 20% desde la izquierda */}
        {/* Usa un degradado radial que va de cyan transparente al centro hasta invisible en los bordes */}
        {/* Pulsa cada 6 segundos con la animacion pulse-glow */}
        <div
          className="absolute rounded-full blur-3xl opacity-20"
          style={{
            width: '400px',
            height: '400px',
            top: '10%',
            left: '20%',
            background: 'radial-gradient(circle, rgba(0,233,233,0.3), transparent 70%)',
            animation: 'pulse-glow 6s ease-in-out infinite',
          }}
        />

        {/* Segunda particula: circulo mediano abajo a la derecha */}
        {/* Es mas pequeña (300px) y menos visible (opacity-15) */}
        {/* Pulsa cada 8 segundos con un retraso de 2 segundos para que no pulse al mismo tiempo que la primera */}
        <div
          className="absolute rounded-full blur-3xl opacity-15"
          style={{
            width: '300px',
            height: '300px',
            bottom: '15%',
            right: '15%',
            background: 'radial-gradient(circle, rgba(0,233,233,0.2), transparent 70%)',
            animation: 'pulse-glow 8s ease-in-out infinite 2s',
          }}
        />

        {/* Tercera particula: circulo chico en el centro-derecha */}
        {/* La mas pequeña (200px) y mas sutil (opacity-10) */}
        {/* Pulsa cada 5 segundos con un retraso de 1 segundo */}
        <div
          className="absolute rounded-full blur-2xl opacity-10"
          style={{
            width: '200px',
            height: '200px',
            top: '50%',
            right: '30%',
            background: 'radial-gradient(circle, rgba(0,233,233,0.15), transparent 70%)',
            animation: 'pulse-glow 5s ease-in-out infinite 1s',
          }}
        />
      </div>

      {/* Capa de oscurecimiento en los bordes */}
      {/* Es un degradado radial que va de transparente en el centro a oscuro en las orillas */}
      {/* Le da un efecto de viñeta sutil a toda la pantalla */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
        }}
      />
    </div>
  )
}
