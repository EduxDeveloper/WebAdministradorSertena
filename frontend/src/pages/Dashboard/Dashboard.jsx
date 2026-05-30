import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AnimatedBackground from "../../components/ui/AnimatedBackground"
import logoSertena from "../../assets/Logo.png"

/**
 * Pagina del panel principal (Dashboard) - Coincide exactamente con el diseño de Sertena.
 * Cuenta con una barra lateral con efecto cristal, tarjetas superiores con colores e iconos,
 * un grafico de barras interactivo de tendencias, una lista de citas proximas
 * y una tabla de los servicios mas comprados.
 */
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("Inicio")
  const [chartPeriod, setChartPeriod] = useState("Semana")
  const [hoveredBar, setHoveredBar] = useState(null)
  const [selectedBar, setSelectedBar] = useState(3) // El indice 3 corresponde al dia Jueves

  // Menu de navegacion de la barra lateral
  const menuItems = [
    { name: "Inicio", icon: "home" },
    { name: "Servicios", icon: "tools" },
    { name: "Clientes", icon: "users" },
    { name: "Empleados", icon: "id-badge" },
    { name: "Reseñas", icon: "star" },
    { name: "Proximas citas", icon: "calendar" },
  ]

  // Datos para el grafico de barras
  const weeklyData = [
    { day: "Lun", value: 70000 },
    { day: "Mar", value: 40000 },
    { day: "Mie", value: 80000 },
    { day: "Jue", value: 92000, highlight: true },
    { day: "Vie", value: 50000 },
    { day: "Sab", value: 45000 },
    { day: "Dom", value: 75000 },
  ]

  // Datos para la tabla de servicios
  const purchasedServices = [
    {
      name: "Instalación Eléctrica Industrial",
      category: "Electricidad",
      frequency: 145,
      trend: "up",
      revenue: "$45,200.00",
    },
    {
      name: "Mantenimiento Preventivo de Calderas",
      category: "Calefacción",
      frequency: 112,
      trend: "up",
      revenue: "$38,400.00",
    },
    {
      name: "Automatización de Líneas de Ensamblaje",
      category: "Robótica",
      frequency: 89,
      trend: "down",
      revenue: "$62,100.00",
    },
    {
      name: "Reparación de Motores Trifásicos",
      category: "Mecánica",
      frequency: 76,
      trend: "up",
      revenue: "$18,900.00",
    },
  ]

  // Funcion para renderizar los iconos en formato SVG de forma dinamica
  const renderIcon = (name, color = "currentColor", size = 20) => {
    switch (name) {
      case "home":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        )
      case "tools":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        )
      case "users":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      case "id-badge":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="4" />
            <line x1="8" y1="2" x2="8" y2="4" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <circle cx="12" cy="14" r="2" />
          </svg>
        )
      case "star":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )
      case "calendar":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      default:
        return null
    }
  }

  const handleLogout = () => {
    navigate("/login")
  }

  return (
    <div className="relative w-full min-h-screen flex text-white">
      {/* Fondo animado */}
      <AnimatedBackground
        colors={["#0d1f2d", "#112a3d", "#15354d", "#0f2536"]}
        speed={0.2}
        backgroundColor="#0d1f2d"
      />

      {/* BARRA LATERAL (Izquierda) */}
      <aside
        className="w-[260px] shrink-0 sticky top-0 h-screen overflow-y-auto flex flex-col justify-between p-5 border-r border-white/10"
        style={{
          background: "rgba(0, 20, 20, 0.45)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          zIndex: 15,
        }}
      >
        <div>
          {/* Logotipo */}
          <div className="mb-10 px-2">
            <img
              src={logoSertena}
              alt="Sertena"
              className="w-full max-w-[200px] h-auto object-contain"
            />
          </div>

          {/* Elementos del menu */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const isSelected = activeTab === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-[14px] font-medium transition-all duration-300 ${isSelected
                    ? "bg-gradient-to-r from-emerald-500 to-green-400 text-black shadow-lg shadow-emerald-500/25 font-bold scale-[1.02]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                    }`}
                  style={!isSelected ? {
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.05)",
                  } : {}}
                >
                  {renderIcon(item.icon, isSelected ? "#000" : "rgba(255,255,255,0.7)", 20)}
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Boton del perfil de usuario */}
        <div className="relative mt-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
            title="Cerrar Sesión"
          >
            <div className="flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100&h=100"
                  alt="Admin User Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="font-semibold text-sm">Admin User</div>
                <div className="text-[11px] text-white/40">Conectado</div>
              </div>
            </div>
            {/* Icono de flecha hacia arriba */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
        </div>
      </aside>

      {/* AREA DE CONTENIDO PRINCIPAL (Derecha) */}
      <main className="flex-1 min-w-0 min-h-screen p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Barra de encabezado */}
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="text-emerald-400 font-medium text-[15px] mb-1">
              Bienvenido! Administrador
            </div>
            <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
              Resumen General
            </h1>
            <p className="text-white/40 text-sm">
              Monitoreo de operaciones industriales en tiempo real
            </p>
          </div>

          {/* Boton de exportacion */}
          <button
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "rgba(133, 130, 82, 0.35)",
              border: "1px solid rgba(133, 130, 82, 0.45)",
              color: "#f5f3e4",
              boxShadow: "0 4px 20px rgba(133, 130, 82, 0.1)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar
          </button>
        </div>

        {/* FILA SUPERIOR: 3 Tarjetas de estadisticas */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
          {/* Tarjeta 1: Ventas Semanales */}
          <div
            className="rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[170px]"
            style={{
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 95, 70, 0.08) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(16, 185, 129, 0.2)",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <span className="text-[12px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                <span>↗</span> +14.2%
              </span>
            </div>
            <div>
              <div className="text-white/40 text-[12px] font-semibold tracking-wider uppercase mb-1">
                VENTAS SEMANALES
              </div>
              <div className="text-3xl font-bold tracking-tight text-white">$124,500.00</div>
            </div>
          </div>

          {/* Tarjeta 2: Reseñas Nuevas */}
          <div
            className="rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[170px]"
            style={{
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 58, 138, 0.08) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(59, 130, 246, 0.2)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className="text-[12px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full">
                4.8 promedio
              </span>
            </div>
            <div>
              <div className="text-white/40 text-[12px] font-semibold tracking-wider uppercase mb-1">
                RESEÑAS NUEVAS
              </div>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold tracking-tight text-white">342</div>
                {/* Diseño de calificacion de 5 estrellas */}
                <div className="flex gap-0.5 text-blue-400 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta 3: Citas Pendientes */}
          <div
            className="rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[170px]"
            style={{
              background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(127, 29, 29, 0.08) 100%)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(239, 68, 68, 0.18)",
            }}
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: "rgba(239, 68, 68, 0.18)",
                  border: "1px solid rgba(239, 68, 68, 0.28)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <span className="text-[12px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                ⚠️ Urgente
              </span>
            </div>
            <div>
              <div className="text-white/40 text-[12px] font-semibold tracking-wider uppercase mb-1">
                CITAS PENDIENTES
              </div>
              <div className="text-3xl font-bold tracking-tight text-white mb-0.5">12</div>
              <div className="text-[12px] text-white/30">Esta semana</div>
            </div>
          </div>
        </div>

        {/* FILA INTERMEDIA: Grafico de barras y Lista */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
          {/* Contenedor del grafico de barras (Ocupa 2 columnas) */}
          <div
            className="xl:col-span-2 rounded-3xl p-8 flex flex-col justify-between"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {/* Titulo y encabezado del grafico */}
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-lg font-bold text-white mb-0.5">Tendencias de ingreso</h3>
              </div>
              {/* Pestañas del selector de periodo */}
              <div
                className="flex p-1 rounded-xl"
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                {["Semana", "Mes", "Año"].map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${chartPeriod === period
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-white/40 hover:text-white/80"
                      }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>

            {/* Diseño grafico del grafico de barras */}
            <div className="flex flex-col">
              <div className="flex h-56 items-end justify-between relative px-2">
                {/* Lineas horizontales de cuadricula de referencia */}
                <div className="absolute inset-x-0 bottom-[25%] border-b border-white/5 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-[50%] border-b border-white/5 pointer-events-none" />
                <div className="absolute inset-x-0 bottom-[75%] border-b border-white/5 pointer-events-none" />

                {/* Etiquetas de referencia del eje Y (Lado izquierdo) */}
                <div className="absolute left-[-16px] bottom-[25%] translate-y-[50%] text-[10px] text-white/30 font-semibold">25k</div>
                <div className="absolute left-[-16px] bottom-[50%] translate-y-[50%] text-[10px] text-white/30 font-semibold">50k</div>
                <div className="absolute left-[-16px] bottom-[75%] translate-y-[50%] text-[10px] text-white/30 font-semibold">75k</div>
                <div className="absolute left-[-20px] bottom-[98%] translate-y-[50%] text-[10px] text-white/30 font-semibold">100k</div>

                {/* Columnas del grafico de barras */}
                {weeklyData.map((data, index) => {
                  const percentage = (data.value / 100000) * 100
                  const isHovered = hoveredBar === index
                  const isHighlight = selectedBar === index

                  return (
                    <div
                      key={data.day}
                      className="flex-1 h-full flex flex-col items-center justify-end group relative cursor-pointer"
                      onMouseEnter={() => setHoveredBar(index)}
                      onMouseLeave={() => setHoveredBar(null)}
                      onClick={() => setSelectedBar(index)}
                    >
                      {/* Informacion emergente al pasar el cursor */}
                      <div
                        className={`absolute top-0 -translate-y-full mb-2 bg-black/90 border border-white/15 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 pointer-events-none ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
                          }`}
                        style={{ zIndex: 5 }}
                      >
                        ${data.value.toLocaleString()}
                      </div>

                      {/* Contenedor de la columna para asegurar que la altura se calcule correctamente */}
                      <div className="w-full h-full flex items-end justify-center">
                        <div
                          className="w-12 rounded-t-lg transition-all duration-300 relative"
                          style={{
                            height: `${percentage}%`,
                            background: isHighlight
                              ? "linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.4) 100%)"
                              : "rgba(255, 255, 255, 0.08)",
                            border: isHighlight
                              ? "1px solid rgba(16, 185, 129, 0.4)"
                              : "1px solid rgba(255, 255, 255, 0.05)",
                            boxShadow: isHighlight
                              ? "0 4px 20px rgba(16, 185, 129, 0.25)"
                              : "none",
                          }}
                        />
                      </div>

                      {/* Etiqueta del eje X de la barra */}
                      <span className="text-[11px] text-white/40 font-semibold mt-3 shrink-0">
                        {data.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Tarjeta derecha: Proximas Citas */}
          <div
            className="rounded-3xl p-8 flex flex-col justify-between"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white mb-4">Proximas citas</h3>

              {/* Listas de citas */}
              <div className="flex flex-col gap-4">
                {[
                  {
                    title: "Mantenimiento Completo",
                    address: "Zona Industrial Los Próceres, Nave 4-B, Calle Principal.",
                  },
                  {
                    title: "Mantenimiento Completo",
                    address: "Parque Logístico Norte, Kilómetro 12.5, Bodega #82.",
                  },
                  {
                    title: "Mantenimiento Completo",
                    address: "Complejo Fabril San José, Avenida Las Industrias, Edificio C.",
                  },
                ].map((cita, i) => (
                  <div
                    key={i}
                    className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                    style={{
                      background: "rgba(255,255,255,0.01)",
                      border: "1px solid rgba(255,255,255,0.03)",
                    }}
                  >
                    {/* Circulo con icono de reloj/calendario */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                    >
                      {/* Icono de reloj con dos puntos arriba */}
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                    </div>

                    {/* Texto de los detalles de la cita */}
                    <div>
                      <h4 className="text-sm font-semibold text-white/95 mb-0.5">{cita.title}</h4>
                      <p className="text-[11px] text-white/35 leading-normal">{cita.address}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* FILA INFERIOR: Servicios Mas Comprados */}
        <div
          className="rounded-3xl p-8 w-full mb-4"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <h3 className="text-lg font-bold text-white mb-5">Servicios mas comprados</h3>

          {/* Contenedor de la tabla */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[12px] text-white/40 tracking-wider uppercase font-semibold">
                  <th className="pb-4 font-semibold">Servicio</th>
                  <th className="pb-4 font-semibold">Categoria</th>
                  <th className="pb-4 font-semibold">Frecuencia</th>
                  <th className="pb-4 font-semibold">Tendencia</th>
                  <th className="pb-4 font-semibold text-right">Ingresos estimados</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {purchasedServices.map((service, index) => (
                  <tr key={index} className="hover:bg-white/[0.02] transition-colors duration-200">
                    <td className="py-4 font-medium text-white/90">{service.name}</td>
                    <td className="py-4">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-medium"
                        style={{
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        {service.category}
                      </span>
                    </td>
                    <td className="py-4 text-white/70">{service.frequency} ordenes</td>
                    <td className="py-4">
                      {service.trend === "up" ? (
                        <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
                          <span>▲</span> Alza
                        </span>
                      ) : (
                        <span className="text-rose-400 flex items-center gap-1 text-xs font-bold">
                          <span>▼</span> Baja
                        </span>
                      )}
                    </td>
                    <td className="py-4 text-right font-bold text-white/95">{service.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
