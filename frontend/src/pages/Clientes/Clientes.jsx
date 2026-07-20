import { useState, useEffect } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"
import Swal from 'sweetalert2'

/**
 * Pagina del Catalogo de Clientes - Muestra una tabla con la informacion de los clientes
 * registrados (nombre, correo, contraseña, tipo) y permite agregar nuevos clientes
 * mediante un modal con formulario y toggle de verificacion.
 */
// Formato basico de correo electronico usado por validateForm
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Clientes() {
  const [showModal, setShowModal] = useState(false)
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(5)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { fetchApi } = useAuth()

  // Estado del formulario del modal para agregar un nuevo cliente
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    tipo: "persona",
    isVerified: true,
  })

  // Errores de validacion por campo y error general de la API
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState("")

  // Cargar clientes al montar el componente
  useEffect(() => {
    loadClientes()
  }, [page, limit])

  const loadClientes = async () => {
    try {
      setLoading(true)
      const data = await fetchApi(`/clientes/paginado?page=${page}&limit=${limit}`)
      if (data && data.data) {
        setClientes(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } else {
        setClientes([])
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error)
    } finally {
      setLoading(false)
    }
  }

  // Valida los campos del formulario. Devuelve true si todo es valido
  // y en caso contrario carga el estado `errors` con los mensajes por campo.
  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre.trim() || formData.nombre.trim().length < 3) {
      newErrors.nombre = "El nombre debe tener al menos 3 caracteres."
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = "Ingresa un correo electronico valido."
    }

    if (formData.contraseña.length < 6) {
      newErrors.contraseña = "La contraseña debe tener al menos 6 caracteres."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Guardar un nuevo cliente
  const handleSaveCliente = async () => {
    setApiError("")
    if (!validateForm()) return

    try {
      setSaving(true)
      await fetchApi("/clientes/crear", {
        method: "POST",
        body: JSON.stringify(formData),
      })
      handleCloseModal()
      loadClientes() // Recargar la tabla
    } catch (error) {
      console.error("Error al crear cliente:", error)
      setApiError(error.message || "Hubo un error al crear el cliente. Intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  // Eliminar un cliente
  const handleDeleteCliente = async (id) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "No podrás revertir esto",
      icon: 'warning',
      background: "#001a1a",
      color: "#fff",
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#00E9E9',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!result.isConfirmed) return

    try {
      await fetchApi(`/clientes/eliminar/${id}`, { method: "DELETE" })
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El cliente ha sido eliminado.',
        icon: 'success',
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: '#00E9E9'
      })
      loadClientes()
    } catch (error) {
      console.error("Error al eliminar:", error)
      Swal.fire({
        title: "Error",
        text: "Hubo un error al eliminar",
        icon: "error",
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: "#00E9E9"
      })
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
    setErrors({})
    setApiError("")
  }

  // Cerrar el modal y limpiar el formulario
  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  // Actualiza un campo del formulario y limpia su error asociado al escribir
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
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

        {/* Paginación */}
        <div className="flex items-center justify-between w-full mt-2 text-sm text-white/70 px-2">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="bg-white/10 border border-white/20 rounded px-2 py-1 outline-none focus:border-emerald-400"
            >
              <option value={5} className="text-black">5</option>
              <option value={10} className="text-black">10</option>
              <option value={20} className="text-black">20</option>
            </select>
            <span>registros</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Página {page} de {totalPages || 1} ({total} en total)</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 transition-colors"
              >
                Siguiente
              </button>
            </div>
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
                onChange={(e) => handleFieldChange("nombre", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: errors.nombre ? "1px solid #ef4444" : "1px solid rgba(0,0,0,0.1)",
                }}
              />
              {errors.nombre && (
                <p className="mt-1.5 text-[12px] font-medium text-red-600">{errors.nombre}</p>
              )}
            </div>

            {/* Campo: Correo */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Correo</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: errors.email ? "1px solid #ef4444" : "1px solid rgba(0,0,0,0.1)",
                }}
              />
              {errors.email && (
                <p className="mt-1.5 text-[12px] font-medium text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Fila: Contraseña y Tipo */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contraseña</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={formData.contraseña}
                  onChange={(e) => handleFieldChange("contraseña", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: errors.contraseña ? "1px solid #ef4444" : "1px solid rgba(0,0,0,0.1)",
                  }}
                />
                {errors.contraseña && (
                  <p className="mt-1.5 text-[12px] font-medium text-red-600">{errors.contraseña}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Tipo</label>
                <input
                  type="text"
                  value={formData.tipo}
                  onChange={(e) => handleFieldChange("tipo", e.target.value)}
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

            {/* Error general de la API */}
            {apiError && (
              <div
                className="mb-4 px-4 py-3 rounded-lg text-sm font-medium text-red-700"
                style={{
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                {apiError}
              </div>
            )}

            {/* Botones de accion */}
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-black/10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCliente}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                {saving ? "Guardando..." : "Guardar Cliente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
