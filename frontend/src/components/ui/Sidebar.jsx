import { useState } from "react"
import { useNavigate } from "react-router-dom"
import logoSertena from "../../assets/Logo.png"
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"

/**
 * Barra lateral del panel administrativo.
 * Diseño corporativo: fondo oscuro sólido, acentos en color de marca.
 */
export default function Sidebar({ activeTab = "Inicio" }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { logout, user, isEmployee } = useAuth()

  const adminMenuItems = [
    { name: "Inicio", icon: "home", route: "/dashboard" },
    { name: "Servicios", icon: "tools", route: "/servicios" },
    { name: "Clientes", icon: "users", route: "/clientes" },
    { name: "Empleados", icon: "id-badge", route: "/empleados" },
    { name: "Reseñas", icon: "star", route: "/resenias" },
    { name: "Proximas citas", icon: "calendar", route: "/proximas-citas" },
    { name: "Configuración", icon: "settings", route: "/configuracion" },
  ]

  const employeeMenuItems = [
    { name: "Inicio", icon: "home", route: "/dashboard" },
    { name: "Mis citas", icon: "calendar", route: "/mis-citas" },
  ]

  const menuItems = isEmployee ? employeeMenuItems : adminMenuItems

  const renderIcon = (name, color = "currentColor", size = 18) => {
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
      case "settings":
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.05.05a2 2 0 1 1-2.83 2.83l-.05-.05A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.08A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.88.34l-.05.05a2 2 0 1 1-2.83-2.83l.05-.05A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.05-.05a2 2 0 1 1 2.83-2.83l.05.05A1.7 1.7 0 0 0 9 4.6h.01A1.7 1.7 0 0 0 10 3.04V3a2 2 0 1 1 4 0v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.05-.05a2 2 0 1 1 2.83 2.83l-.05.05A1.7 1.7 0 0 0 19.4 9v.01A1.7 1.7 0 0 0 20.96 10H21a2 2 0 1 1 0 4h-.08A1.7 1.7 0 0 0 19.4 15z" />
          </svg>
        )
      default:
        return null
    }
  }

  const handleMenuClick = (item) => {
    if (item.route) {
      setIsMobileMenuOpen(false)
      navigate(item.route)
    }
  }

  const handleLogout = () => {
    Swal.fire({
      title: "¿Seguro que quieres cerrar sesión?",
      text: "Tendrás que volver a iniciar sesión para acceder al panel",
      icon: "warning",
      showCancelButton: true,
      background: "#ffffff",
      color: "#0f172a",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
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
    <>
      <button
        type="button"
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-md"
        style={{ background: "#15354d", border: "1px solid rgba(255,255,255,0.12)" }}
        aria-label="Abrir menú de navegación"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {isMobileMenuOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Cerrar menú de navegación"
        />
      )}

      <aside
        className={`${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto flex flex-col justify-between p-5 border-r border-white/10 transition-transform duration-300 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:shrink-0 lg:translate-x-0`}
        style={{ background: "#15354d" }}
      >
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="lg:hidden absolute top-4 right-4 w-8 h-8 rounded-md text-white/70 hover:bg-white/10"
          aria-label="Cerrar menú"
        >
          ✕
        </button>

        <div>
          <div className="mb-8 px-1 pt-1">
            <img src={logoSertena} alt="Sertena" className="w-full max-w-[180px] h-auto object-contain" />
          </div>

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isSelected = activeTab === item.name
              return (
                <button
                  key={item.name}
                  onClick={() => handleMenuClick(item)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                    isSelected
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {renderIcon(item.icon, isSelected ? "#00E9E9" : "rgba(255,255,255,0.55)", 18)}
                  <span>{item.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="relative mt-6">
          {showDropdown && (
            <div className="absolute bottom-full left-0 w-full mb-2 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg z-20">
              {!isEmployee && (
                <button
                  onClick={() => { setShowDropdown(false); navigate("/configuracion") }}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-100"
                >
                  {renderIcon("settings", "#64748b", 16)}
                  Configuración
                </button>
              )}
              <button
                onClick={() => {
                  setShowDropdown(false)
                  handleLogout()
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
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
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors border border-white/10 bg-white/5"
            title="Menú de Usuario"
          >
            <div className="text-left">
              <div className="font-semibold text-sm text-white">{isEmployee ? (user?.name || "Empleado") : "Admin User"}</div>
              <div className="text-[11px] text-white/45">{isEmployee ? "Empleado conectado" : "Conectado"}</div>
            </div>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2"
              style={{ transform: showDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}
