import { useState, useEffect } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"

/**
 * Pagina del Catalogo de Clientes - Muestra una tabla con la informacion de los clientes
 * registrados (nombre, correo, contraseña, tipo) y permite agregar nuevos clientes
 * mediante un modal con formulario y toggle de verificacion.
 */
export default function Clientes() {
  const [showModal, setShowModal] = useState(false)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const { fetchApi } = useAuth()

  // Estado del formulario del modal para agregar un nuevo cliente
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    tipo: "persona",
    isVerified: true,
  })

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClientes()
  }, [])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const data = await fetchApi("/clientes/obtener")
      setClientes(data || [])
    } catch (error) {
      console.error("Error al cargar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  // Guardar un nuevo cliente
  const handleSaveCliente = async () => {
    try {
      await fetchApi("/clientes/crear", {
        method: "POST",
        body: JSON.stringify(formData),
      })
      handleCloseModal()
      loadClientes() // Recargar la tabla
    } catch (error) {
      console.error("Error al crear cliente:", error)
      alert("Hubo un error al crear el cliente: " + error.message)
    }
  }

  // Eliminar un cliente
  const handleDeleteCliente = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este cliente?")) return
    try {
      await fetchApi(`/clientes/eliminar/${id}`, { method: "DELETE" })
      loadClientes()
    } catch (error) {
      console.error("Error al eliminar:", error)
    }
  }

  // Resetear el formulario a sus valores iniciales
  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      contraseña: "",
      tipo: "persona",
      isVerified: true,
    })
  }

  // Cerrar el modal y limpiar el formulario
  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  return (
    <div className="relative w-full min-h-screen flex text-white bg-[#15354d]">

      {/* BARRA LATERAL - Componente reutilizable */}
      <Sidebar activeTab="Clientes" />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 min-h-screen p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Encabezado */}
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="text-emerald-400 font-medium text-[15px] mb-1">
              Bienvenido! Administrador
            </div>
            <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
              Catalogo de Clientes
            </h1>
            <p className="text-white/40 text-sm">
              Gestion integral de socios industriales y seguimiento de contactos.
            </p>
          </div>

          {/* Boton Añadir */}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
              boxShadow: "0 4px 20px rgba(16, 185, 129, 0.3)",
              color: "#fff",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Añadir
          </button>
        </div>

        {/* Tabla de clientes */}
        <div
          className="rounded-2xl overflow-hidden w-full"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Nombre</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Correo</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Contraseña</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Tipo</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-5 text-center text-white/50">Cargando clientes...</td>
                  </tr>
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-5 text-center text-white/50">No hay clientes registrados</td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr
                      key={cliente._id}
                      className="hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-white/90">{cliente.nombre}</td>
                      <td className="px-6 py-5 text-sm text-white/60">{cliente.email}</td>
                      <td className="px-6 py-5 text-sm text-white/50 tracking-wider">********</td>
                      <td className="px-6 py-5 text-sm text-white/50 tracking-wider">{cliente.tipo}</td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleDeleteCliente(cliente._id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15 cursor-pointer ml-auto"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                          title="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: Agregar Nuevo Cliente */}
      {showModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 100 }}
        >
          {/* Overlay oscuro */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseModal}
          />

          {/* Contenido del modal */}
          <div
            className="relative w-full max-w-[620px] rounded-2xl p-8 animate-fade-in-up"
            style={{
              background: "linear-gradient(135deg, rgba(200, 200, 210, 0.85) 0%, rgba(180, 180, 195, 0.80) 100%)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Cliente</h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition-all duration-200 cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Campo: Nombre */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Nombre</label>
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
            </div>

            {/* Campo: Correo */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Correo</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
            </div>

            {/* Fila: Contraseña y Tipo */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={formData.contraseña}
                  onChange={(e) => setFormData(prev => ({ ...prev, contraseña: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Tipo</label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            </div>

            {/* Estado de verificacion */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Estado de verificación</h3>
                <p className="text-[12px] text-gray-500">¿El cliente ha validado su informacion?</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, isVerified: !prev.isVerified }))}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: formData.isVerified
                      ? "linear-gradient(135deg, #10b981, #34d399)"
                      : "rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{
                      left: formData.isVerified ? "calc(100% - 26px)" : "2px",
                    }}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.isVerified ? "text-emerald-600" : "text-gray-500"}`}>
                  {formData.isVerified ? "Verificado" : "No verificado"}
                </span>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-black/10 mb-6" />

            {/* Botones de accion */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-black/10 cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCliente}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                Guardar Cliente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
