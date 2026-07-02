import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logoSertena from "../../assets/Logo.png"
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"

/**
 * Componente reutilizable de la barra lateral de navegacion.
 * Se usa en todas las paginas del panel de administracion (Dashboard, Servicios, Clientes, etc.)
 * Recibe el nombre de la pestaña activa para resaltar el elemento correspondiente del menu.
 */
export default function Sidebar({ activeTab = "Inicio" }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  // Menu de navegacion de la barra lateral
  const menuItems = [
    { name: "Inicio", icon: "home", route: "/dashboard" },
    { name: "Servicios", icon: "tools", route: "/servicios" },
    { name: "Clientes", icon: "users", route: "/clientes" },
    { name: "Empleados", icon: "id-badge", route: "/empleados" },
    { name: "Reseñas", icon: "star", route: "/resenias" },
    { name: "Proximas citas", icon: "calendar", route: "/proximas-citas" },
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

  // Cerrar sesion de forma real en el backend y luego redirigir al login
  const handleLogout = () => {
    Swal.fire({
      title: "¿Seguro que quieres cerrar sesión?",
      text: "Tendrás que volver a iniciar sesión para acceder al panel",
      icon: "warning",
      showCancelButton: true,
      background: "#001a1a",
      color: "#fff",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#374151",
      confirmButtonText: "Sí, cerrar sesión",
      cancelButtonText: "Cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout()
        navigate("/login")
      }
    })
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

      {/* Menú de perfil de usuario con Dropdown */}
      <div className="relative mt-8">
        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute bottom-full left-0 w-full mb-2 bg-[#001a1a] border border-[#00E9E9]/30 rounded-xl overflow-hidden shadow-xl z-20">
            <button
              onClick={() => setShowDropdown(false)}
              className="w-full text-left px-4 py-3 text-sm text-white/80 hover:bg-[#00E9E9]/10 hover:text-[#00E9E9] transition-colors flex items-center gap-2 border-b border-white/5"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Configuración
            </button>
            <button
              onClick={() => {
                setShowDropdown(false)
                handleLogout()
              }}
              className="w-full text-left px-4 py-3 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Cerrar Sesión
            </button>
          </div>
        )}

        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
          title="Menú de Usuario"
        >
          <div className="flex items-center gap-3 text-left">
            <div>
              <div className="font-semibold text-sm">Admin User</div>
              <div className="text-[11px] text-white/40">Conectado</div>
            </div>
          </div>
          <svg 
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2"
            style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </aside>
  )
}
