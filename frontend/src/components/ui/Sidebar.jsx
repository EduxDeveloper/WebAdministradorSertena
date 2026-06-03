import { useNavigate } from "react-router-dom"
import logoSertena from "../../assets/Logo.png"

/**
 * Componente reutilizable de la barra lateral de navegacion.
 * Se usa en todas las paginas del panel de administracion (Dashboard, Servicios, Clientes, etc.)
 * Recibe el nombre de la pestaña activa para resaltar el elemento correspondiente del menu.
 */
export default function Sidebar({ activeTab = "Inicio" }) {
  const navigate = useNavigate()

  // Menu de navegacion de la barra lateral
  const menuItems = [
    { name: "Inicio", icon: "home", route: "/dashboard" },
    { name: "Servicios", icon: "tools", route: "/servicios" },
    { name: "Clientes", icon: "users", route: "/clientes" },
    { name: "Empleados", icon: "id-badge", route: null },
    { name: "Reseñas", icon: "star", route: null },
    { name: "Proximas citas", icon: "calendar", route: null },
  ]

  // Funcion para renderizar los iconos SVG de forma dinamica
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

  // Maneja la navegacion al hacer click en un elemento del menu
  const handleMenuClick = (item) => {
    if (item.route) {
      navigate(item.route)
    }
  }

  // Cerrar sesion y redirigir al login
  const handleLogout = () => {
    navigate("/login")
  }

  return (
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
          <img src={logoSertena} alt="Sertena" className="w-full max-w-[200px] h-auto object-contain" />
        </div>

        {/* Menu de navegacion */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isSelected = activeTab === item.name
            return (
              <button
                key={item.name}
                onClick={() => handleMenuClick(item)}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
