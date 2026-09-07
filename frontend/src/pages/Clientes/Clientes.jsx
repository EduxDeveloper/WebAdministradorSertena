import { useState, useEffect } from "react"
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton } from "../../components/ui/AdminLayout"
import useAuth from "../../hooks/useAuth"
import Swal from 'sweetalert2'
import ViewModeToggle from "../../components/ui/ViewModeToggle"
import { CardsLoadingGrid, TableLoadingRows } from "../../components/ui/LoadingSkeleton"

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
  const [viewMode, setViewMode] = useState("list")
  const { fetchApi } = useAuth()

  // Estado del formulario del modal para agregar un nuevo cliente
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    tipo: "",
    isVerified: true,
  })

  // Errores de validacion por campo y error general de la API
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState("")

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

  // Cargar clientes al montar el componente y al cambiar la paginacion
  useEffect(() => {
    loadClientes()
  }, [page, limit])

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

    if (!formData.tipo) {
      newErrors.tipo = "Selecciona un tipo de cliente."
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
      background: "#ffffff",
      color: "#0f172a",
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
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
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: '#0d9488'
      })
      loadClientes()
    } catch (error) {
      console.error("Error al eliminar:", error)
      Swal.fire({
        title: "Error",
        text: "Hubo un error al eliminar",
        icon: "error",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488"
      })
    }
  }

  // Resetear el formulario a sus valores iniciales
  const resetForm = () => {
    setFormData({
      nombre: "",
      email: "",
      contraseña: "",
      tipo: "",
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
    <AdminLayout activeTab="Clientes">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Catalogo de Clientes"
          description="Gestion integral de socios industriales y seguimiento de contactos."
          action={
            <AdminPrimaryButton onClick={() => setShowModal(true)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Añadir
            </AdminPrimaryButton>
          }
        />

        <div className="flex justify-end">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        <div className={`admin-card admin-table-wrap ${viewMode === "list" ? "" : "hidden"}`}>
          <div className="overflow-x-auto w-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Contraseña</th>
                  <th>Tipo</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoadingRows columns={5} />
                ) : clientes.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-empty">No hay clientes registrados</td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente._id}>
                      <td className="font-medium text-slate-900">{cliente.nombre}</td>
                      <td className="admin-text-muted">{cliente.email}</td>
                      <td className="admin-text-subtle tracking-wider">********</td>
                      <td className="admin-text-muted capitalize">{cliente.tipo}</td>
                      <td className="text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteCliente(cliente._id)}
                          className="admin-btn admin-btn-icon admin-btn-danger ml-auto"
                          title="Eliminar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

        {viewMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
            {loading ? (
              <CardsLoadingGrid />
            ) : clientes.length === 0 ? (
              <p className="col-span-full admin-empty">No hay clientes registrados</p>
            ) : clientes.map((cliente) => (
              <article key={cliente._id} className="admin-card admin-card-padded">
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 truncate">{cliente.nombre}</h3>
                    <p className="text-sm admin-text-muted mt-1 break-all">{cliente.email}</p>
                  </div>
                  <button type="button" onClick={() => handleDeleteCliente(cliente._id)} className="admin-btn admin-btn-danger shrink-0 text-xs px-3 py-2">Eliminar</button>
                </div>
                <p className="mt-4 text-sm admin-text-muted">Tipo: <span className="capitalize text-slate-700">{cliente.tipo || "No especificado"}</span></p>
              </article>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between w-full mt-2 text-sm admin-text-muted px-2">
          <div className="flex items-center gap-2">
            <span>Mostrar</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="admin-input w-auto py-1 px-2"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>registros</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Página {page} de {totalPages || 1} ({total} en total)</span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-btn admin-btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || totalPages === 0} className="admin-btn admin-btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
            </div>
          </div>
        </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Agregar Nuevo Cliente</h2>
              <button type="button" onClick={handleCloseModal} className="admin-btn admin-btn-icon admin-btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <label className="admin-label mb-5 block">Nombre
                <input type="text" value={formData.nombre} onChange={(e) => handleFieldChange("nombre", e.target.value)} className={`admin-input ${errors.nombre ? "border-red-400" : ""}`} />
                {errors.nombre && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.nombre}</p>}
              </label>
              <label className="admin-label mb-5 block">Correo
                <input type="email" value={formData.email} onChange={(e) => handleFieldChange("email", e.target.value)} className={`admin-input ${errors.email ? "border-red-400" : ""}`} />
                {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
              </label>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <label className="admin-label">Contraseña
                  <input type="password" autoComplete="new-password" value={formData.contraseña} onChange={(e) => handleFieldChange("contraseña", e.target.value)} className={`admin-input ${errors.contraseña ? "border-red-400" : ""}`} />
                  {errors.contraseña && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.contraseña}</p>}
                </label>
                <label className="admin-label">Tipo
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleFieldChange("tipo", e.target.value)}
                    className={`admin-select mt-2 ${errors.tipo ? "border-red-400" : ""}`}
                  >
                    <option value="">Selecciona un tipo...</option>
                    <option value="empresa">Empresa</option>
                    <option value="personal">Personal</option>
                    <option value="cliente">Cliente</option>
                  </select>
                  {errors.tipo && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.tipo}</p>}
                </label>
              </div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-slate-900 mb-0.5">Estado de verificación</h3>
                  <p className="text-xs admin-text-muted">¿El cliente ha validado su informacion?</p>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setFormData(prev => ({ ...prev, isVerified: !prev.isVerified }))} className="relative w-14 h-7 rounded-full transition-colors cursor-pointer" style={{ background: formData.isVerified ? "#0d9488" : "#cbd5e1" }}>
                    <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300" style={{ left: formData.isVerified ? "calc(100% - 26px)" : "2px" }} />
                  </button>
                  <span className={`text-sm font-medium ${formData.isVerified ? "text-emerald-600" : "admin-text-muted"}`}>{formData.isVerified ? "Verificado" : "No verificado"}</span>
                </div>
              </div>
              {apiError && <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200">{apiError}</div>}
            </div>
            <div className="admin-modal-footer">
              <AdminSecondaryButton onClick={handleCloseModal} disabled={saving}>Cancelar</AdminSecondaryButton>
              <AdminPrimaryButton onClick={handleSaveCliente} disabled={saving}>{saving ? "Guardando..." : "Guardar Cliente"}</AdminPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
