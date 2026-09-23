import React, { useState, useEffect } from "react"
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton, AdminStatCard, AdminStatGrid } from "../../components/ui/AdminLayout"
import useAuth from "../../hooks/useAuth"
import Swal from 'sweetalert2'
import ViewModeToggle from "../../components/ui/ViewModeToggle"
import { CardsLoadingGrid, TableLoadingRows } from "../../components/ui/LoadingSkeleton"

/**
 * Pagina de Gestión de Empleados - Muestra una tabla con la información de los empleados
 * registrados (nombre, apellido, correo, salario, estado, verificación) y permite agregar
 * nuevos empleados mediante un modal con formulario y toggle de verificación.
 */

// Solo letras (incluye acentos y ñ) y espacios
const NOMBRE_REGEX = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Empleados() {
  const [showModal, setShowModal] = useState(false)
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(4)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState("list")
  const { fetchApi } = useAuth()

  // Estado del formulario del modal para agregar un nuevo empleado
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    apellido: "",
    email: "",
    contraseña: "",
    salario: "",
    status: true,
    verificado: true,
    services: [],
  })

  const [servicesList, setServicesList] = useState([])
  const [expandedRows, setExpandedRows] = useState({})

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Errores de validacion por campo y error general de la API
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState("")

  // Cargar empleados y servicios al montar el componente
  useEffect(() => {
    loadEmpleados()
    loadServices()
  }, [page, limit])

  async function loadServices() {
    try {
      const data = await fetchApi("/services")
      setServicesList(data || [])
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    }
  }

  async function loadEmpleados() {
    try {
      setLoading(true)
      const data = await fetchApi(`/empleados/paginado?page=${page}&limit=${limit}`)
      if (data && data.data) {
        setEmpleados(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } else {
        setEmpleados([])
      }
    } catch (error) {
      console.error("Error al cargar empleados:", error)
    } finally {
      setLoading(false)
    }
  }

  // Valida los campos del formulario. Devuelve true si todo es valido
  // y en caso contrario carga el estado `errors` con los mensajes por campo.
  const validateForm = () => {
    const newErrors = {}

    const nombre = formData.nombre.trim()
    if (!nombre || nombre.length < 2 || !NOMBRE_REGEX.test(nombre)) {
      newErrors.nombre = "El nombre es obligatorio, minimo 2 caracteres y solo letras."
    }

    const apellido = formData.apellido.trim()
    if (!apellido || apellido.length < 2 || !NOMBRE_REGEX.test(apellido)) {
      newErrors.apellido = "El apellido es obligatorio, minimo 2 caracteres y solo letras."
    }

    if (!EMAIL_REGEX.test(formData.email.trim())) {
      newErrors.email = "Ingresa un correo electronico valido."
    }

    if (formData.contraseña.length < 6) {
      newErrors.contraseña = "La contraseña debe tener al menos 6 caracteres."
    }

    const salarioLimpio = parseFloat(String(formData.salario).replace(/[^0-9.]/g, ""))
    if (!formData.salario || !Number.isFinite(salarioLimpio) || salarioLimpio <= 0) {
      newErrors.salario = "El salario es obligatorio y debe ser un numero mayor a 0."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Guardar un nuevo empleado o actualizar
  const handleSaveEmpleado = async () => {
    setApiError("")
    if (!validateForm()) return

    try {
      if (formData.id) {
        await fetchApi(`/empleados/actualizar/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      } else {
        setSaving(true)
      await fetchApi("/empleados/crear", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }
      handleCloseModal()
      loadEmpleados() // Recargar la tabla
    } catch (error) {
      console.error("Error al guardar empleado:", error)
      setApiError(error.message || "Hubo un error al guardar el empleado. Intenta nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  // Abrir modal para editar
  const handleOpenEdit = (empleado) => {
    setFormData({
      id: empleado._id,
      nombre: empleado.nombre || "",
      apellido: empleado.apellido || "",
      email: empleado.email || "",
      contraseña: "",
      salario: empleado.salario || "",
      status: empleado.status === true,
      verificado: true,
      services: (empleado.services || []).map(s => s._id || s),
    })
    setShowModal(true)
  }

  // Eliminar un empleado
  const handleDeleteEmpleado = async (id) => {
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
      await fetchApi(`/empleados/eliminar/${id}`, { method: "DELETE" })
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El empleado ha sido eliminado.',
        icon: 'success',
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: '#0d9488'
      })
      loadEmpleados()
    } catch (error) {
      console.error("Error al eliminar empleado:", error)
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

  const resetForm = () => {
    setFormData({
      id: null,
      nombre: "",
      apellido: "",
      email: "",
      contraseña: "",
      salario: "",
      status: true,
      verificado: true,
      services: [],
    })
    setErrors({})
    setApiError("")
  }

  // Cerrar el modal y limpiar el formulario
  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    resetForm()
  }

  // Actualiza un campo del formulario y limpia su error asociado al escribir
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  // Contar empleados activos
  const empleadosActivos = empleados.filter(e => e.status === true).length
  const totalEmpleados = empleados.length

  return (
    <AdminLayout activeTab="Empleados">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Gestión de Empleados"
          description="Apartado administrativo de empleados"
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

        <AdminStatGrid columns={2}>
          <AdminStatCard
            label="Total de empleados"
            value={totalEmpleados}
            iconTone="blue"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            }
          />
          <AdminStatCard
            label="Activos"
            value={empleadosActivos}
            iconTone="green"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
        </AdminStatGrid>

        <div className="flex justify-end">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        <div className={`admin-card admin-table-wrap ${viewMode === "list" ? "" : "hidden"}`}>
          <div className="overflow-x-auto w-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Correo</th>
                  <th>Salario</th>
                  <th>Estado</th>
                  <th>Verificación</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoadingRows columns={7} />
                ) : empleados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="admin-empty">No hay empleados registrados</td>
                  </tr>
                ) : (
                  empleados.map((empleado) => {
                    const estaActivo = empleado.status === true

                    return (
                    <React.Fragment key={empleado._id}>
                        <tr>
                          <td className="font-medium text-slate-900">
                          <button type="button" onClick={() => toggleRow(empleado._id)} className="admin-btn admin-btn-icon admin-btn-secondary mr-2">
                            <svg 
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className={`transition-transform duration-200 ${expandedRows[empleado._id] ? 'rotate-180' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>
                          {empleado.nombre}
                        </td>
                          <td className="admin-text-muted">{empleado.apellido}</td>
                        <td className="admin-text-muted">{empleado.email}</td>
                        <td className="admin-text-muted">${empleado.salario}</td>
                        <td>
                          <span className={`admin-badge ${estaActivo ? "admin-badge--green" : "admin-badge--slate"}`}>
                            {estaActivo ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center justify-center">
                            {empleado.verificado ? (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#10b981"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                title="Verificado"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#f87171"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                title="No verificado"
                              >
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            )}
                          </div>
                        </td>
                        <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                        <button type="button" onClick={() => handleOpenEdit(empleado)} className="admin-btn admin-btn-icon admin-btn-secondary" title="Editar">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                          <button type="button" onClick={() => handleDeleteEmpleado(empleado._id)} className="admin-btn admin-btn-icon admin-btn-danger" title="Eliminar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              <line x1="10" y1="11" x2="10" y2="17"></line>
                              <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                          </button>
                        </div>
                        </td>
                      </tr>
                    {/* Expanded Row for Services */}
                    {expandedRows[empleado._id] && (
                      <tr>
                        <td colSpan="7" className="p-0 border-b border-slate-100">
                          <div className="w-full px-6 py-5 flex flex-col gap-3 bg-slate-50">
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                              </svg>
                              <span className="text-xs font-bold admin-text-muted uppercase tracking-wider">Servicios Asignados a {empleado.nombre}</span>
                            </div>
                            {empleado.services && empleado.services.length > 0 ? (
                              <div className="flex flex-wrap gap-2.5">
                                {empleado.services.map(srv => (
                                  <span key={srv._id || srv} className="admin-badge admin-badge--green">
                                    {srv.nameService || 'Servicio Desconocido'}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-fit border border-dashed border-slate-300 bg-white">
                                <span className="text-sm admin-text-muted italic">Sin servicios asignados por el momento</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewMode === "cards" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
            {loading ? (
              <CardsLoadingGrid />
            ) : empleados.length === 0 ? (
              <p className="col-span-full admin-empty">No hay empleados registrados</p>
            ) : empleados.map((empleado) => {
              const estaActivo = empleado.status === true
              return (
                <article key={empleado._id} className="admin-card admin-card-padded">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 truncate">{empleado.nombre} {empleado.apellido}</h3>
                      <p className="text-sm admin-text-muted mt-1 break-all">{empleado.email}</p>
                    </div>
                    <span className={`admin-badge shrink-0 ${estaActivo ? "admin-badge--green" : "admin-badge--slate"}`}>{estaActivo ? "Activo" : "Inactivo"}</span>
                  </div>
                  <p className="mt-3 text-sm admin-text-muted">Salario: <span className="text-slate-900">${empleado.salario}</span></p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(empleado.services || []).length > 0 ? empleado.services.map((service) => (
                      <span key={service._id || service} className="admin-badge admin-badge--green">{service.nameService || "Servicio"}</span>
                    )) : <span className="text-xs admin-text-muted">Sin servicios asignados</span>}
                  </div>
                  <div className="mt-5 flex gap-2">
                    <AdminSecondaryButton onClick={() => handleOpenEdit(empleado)} className="flex-1 justify-center">Editar</AdminSecondaryButton>
                    <button type="button" onClick={() => handleDeleteEmpleado(empleado._id)} className="admin-btn admin-btn-danger flex-1 justify-center">Eliminar</button>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        <div className="admin-pagination">
          <div className="admin-pagination-size">
            <span>Mostrar</span>
            <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1) }} className="admin-input w-auto py-1 px-2">
              <option value={4}>4</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>registros</span>
          </div>
          <div className="admin-pagination-controls">
            <span className="admin-pagination-status">Página {page} de {totalPages || 1} ({total} en total)</span>
            <div className="admin-pagination-buttons">
              <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="admin-btn admin-btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed">Anterior</button>
              <button type="button" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || totalPages === 0} className="admin-btn admin-btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed">Siguiente</button>
            </div>
          </div>
        </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal max-h-[90vh] overflow-y-auto" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{formData.id ? "Editar Empleado" : "Agregar Nuevo Empleado"}</h2>
              <button type="button" onClick={handleCloseModal} disabled={saving} className="admin-btn admin-btn-icon admin-btn-secondary disabled:opacity-50">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <label className="admin-label mb-5 block">Nombre
                <input type="text" value={formData.nombre} onChange={(e) => handleFieldChange("nombre", e.target.value)} className={`admin-input ${errors.nombre ? "border-red-400" : ""}`} />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>}
              </label>
              <label className="admin-label mb-5 block">Apellido
                <input type="text" value={formData.apellido} onChange={(e) => handleFieldChange("apellido", e.target.value)} className={`admin-input ${errors.apellido ? "border-red-400" : ""}`} />
                {errors.apellido && <p className="text-red-500 text-xs mt-1">{errors.apellido}</p>}
              </label>
              <label className="admin-label mb-5 block">Email
                <input type="email" value={formData.email} onChange={(e) => handleFieldChange("email", e.target.value)} className={`admin-input ${errors.email ? "border-red-400" : ""}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </label>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <label className="admin-label">Contraseña
                  <input type="password" autoComplete="new-password" value={formData.contraseña} onChange={(e) => handleFieldChange("contraseña", e.target.value)} className={`admin-input ${errors.contraseña ? "border-red-400" : ""}`} />
                  {errors.contraseña && <p className="text-red-500 text-xs mt-1">{errors.contraseña}</p>}
                </label>
                <label className="admin-label">Salario
                  <input type="text" value={formData.salario} onChange={(e) => handleFieldChange("salario", e.target.value)} placeholder="$0.00" className={`admin-input ${errors.salario ? "border-red-400" : ""}`} />
                  {errors.salario && <p className="text-red-500 text-xs mt-1">{errors.salario}</p>}
                </label>
              </div>

            {/* Estado */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Estado</h3>
                <p className="text-[12px] text-gray-500">¿El empleado está activo?</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, status: !prev.status }))}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                  style={{ background: formData.status ? "#0d9488" : "#cbd5e1" }}
                >
                  <div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{
                      left: formData.status ? "calc(100% - 26px)" : "2px",
                    }}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.status ? "text-emerald-600" : "text-gray-500"}`}>
                  {formData.status ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>

            {/* Verificación */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Verificación</h3>
                <p className="text-[12px] text-gray-500">¿El empleado ha sido verificado?</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, verificado: !prev.verificado }))}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                  style={{ background: formData.verificado ? "#0d9488" : "#cbd5e1" }}
                >
                  <div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{
                      left: formData.verificado ? "calc(100% - 26px)" : "2px",
                    }}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.verificado ? "text-emerald-600" : "text-gray-500"}`}>
                  {formData.verificado ? "Verificado" : "No verificado"}
                </span>
              </div>
            </div>

            {/* Servicios Asignados */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Servicios Asignados</label>
              <div 
                className="w-full flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1"
              >
                {servicesList.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No hay servicios disponibles.</p>
                ) : (
                  servicesList.map(servicio => {
                    const isChecked = formData.services.includes(servicio._id)
                    return (
                      <button 
                        key={servicio._id}
                        type="button"
                        onClick={() => {
                          if (!isChecked) {
                            setFormData(prev => ({ ...prev, services: [...prev.services, servicio._id] }))
                          } else {
                            setFormData(prev => ({ ...prev, services: prev.services.filter(id => id !== servicio._id) }))
                          }
                        }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border outline-none ${
                          isChecked 
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-[0_0_10px_rgba(16,185,129,0.15)]" 
                            : "bg-white/50 border-gray-200 text-gray-600 hover:bg-white hover:border-emerald-300"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center border transition-colors duration-200 ${
                          isChecked ? "bg-emerald-500 border-emerald-500" : "bg-white border-gray-300"
                        }`}>
                          {isChecked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                        </div>
                        {servicio.nameService}
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {apiError && <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium text-red-700 bg-red-50 border border-red-200">{apiError}</div>}
            </div>
            <div className="admin-modal-footer">
              <AdminSecondaryButton onClick={handleCloseModal} disabled={saving}>Cancelar</AdminSecondaryButton>
              <AdminPrimaryButton onClick={handleSaveEmpleado} disabled={saving} className="gap-2">
                {saving && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
                    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                )}
                {saving ? "Guardando..." : formData.id ? "Guardar Cambios" : "Guardar Empleado"}
              </AdminPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
