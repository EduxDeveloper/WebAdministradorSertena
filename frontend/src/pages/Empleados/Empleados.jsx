import React, { useState, useEffect } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"

/**
 * Pagina de Gestión de Empleados - Muestra una tabla con la información de los empleados
 * registrados (nombre, apellido, correo, salario, estado, verificación) y permite agregar
 * nuevos empleados mediante un modal con formulario y toggle de verificación.
 */
export default function Empleados() {
  const [showModal, setShowModal] = useState(false)
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const { fetchApi } = useAuth()

  // Estado del formulario del modal para agregar un nuevo empleado
  const [formData, setFormData] = useState({
    id: null,
    nombre: "",
    apellido: "",
    email: "",
    contraseña: "",
    salario: "",
    estado: "activo",
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

  // Cargar empleados y servicios al montar el componente
  useEffect(() => {
    loadEmpleados()
    loadServices()
  }, [])

  const loadServices = async () => {
    try {
      const data = await fetchApi("/services")
      setServicesList(data || [])
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    }
  }

  const loadEmpleados = async () => {
    try {
      setLoading(true)
      const data = await fetchApi("/empleados/obtener")
      setEmpleados(data || [])
    } catch (error) {
      console.error("Error al cargar empleados:", error)
    } finally {
      setLoading(false)
    }
  }

  // Guardar un nuevo empleado o actualizar
  const handleSaveEmpleado = async () => {
    try {
      if (formData.id) {
        await fetchApi(`/empleados/actualizar/${formData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      } else {
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
      alert("Hubo un error al guardar el empleado: " + error.message)
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
      estado: empleado.estado || "activo",
      verificado: true,
      services: (empleado.services || []).map(s => s._id || s),
    })
    setShowModal(true)
  }

  // Eliminar un empleado
  const handleDeleteEmpleado = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este empleado?")) return
    try {
      await fetchApi(`/empleados/eliminar/${id}`, { method: "DELETE" })
      loadEmpleados()
    } catch (error) {
      console.error("Error al eliminar empleado:", error)
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
      estado: "activo",
      verificado: true,
      services: [],
    })
  }

  // Cerrar el modal y limpiar el formulario
  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  // Contar empleados activos
  const empleadosActivos = empleados.filter(e => e.estado?.toLowerCase() === "activo").length
  const totalEmpleados = empleados.length

  return (
    <div className="relative w-full min-h-screen flex text-white bg-[#15354d]">

      {/* BARRA LATERAL - Componente reutilizable */}
      <Sidebar activeTab="Empleados" />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 min-h-screen p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Encabezado */}
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="text-emerald-400 font-medium text-[15px] mb-1">
              Bienvenido! Administrador
            </div>
            <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
              Gestión de Empleados
            </h1>
            <p className="text-white/40 text-sm">
              Apartado administrativo de empleados
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

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-2 gap-4 w-full">
          {/* Tarjeta: Total de empleados */}
          <div
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(59, 130, 246, 0.2)",
                border: "1px solid rgba(59, 130, 246, 0.3)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Total de empleados</p>
              <p className="text-2xl font-bold text-white">{totalEmpleados}</p>
            </div>
          </div>

          {/* Tarjeta: Empleados Activos */}
          <div
            className="rounded-2xl p-6 flex items-center gap-4"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Activos</p>
              <p className="text-2xl font-bold text-white">{empleadosActivos}</p>
            </div>
          </div>
        </div>

        {/* Tabla de empleados */}
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
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Apellido</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Correo</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Salario</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Estado</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Verificación</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-5 text-center text-white/50">Cargando empleados...</td>
                  </tr>
                ) : empleados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-5 text-center text-white/50">No hay empleados registrados</td>
                  </tr>
                ) : (
                  empleados.map((empleado) => (
                    <React.Fragment key={empleado._id}>
                      <tr
                        className="hover:bg-white/[0.03] transition-colors duration-200"
                      >
                        <td className="px-6 py-5 text-sm font-medium text-white/90 flex items-center gap-2">
                          <button
                            onClick={() => toggleRow(empleado._id)}
                            className="p-1 rounded-md hover:bg-white/10 transition-colors"
                          >
                            <svg 
                              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                              className={`transition-transform duration-200 ${expandedRows[empleado._id] ? 'rotate-180' : ''}`}
                            >
                              <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                          </button>
                          {empleado.nombre}
                        </td>
                        <td className="px-6 py-5 text-sm text-white/60">{empleado.apellido}</td>
                      <td className="px-6 py-5 text-sm text-white/60">{empleado.email}</td>
                      <td className="px-6 py-5 text-sm text-white/60">${empleado.salario}</td>
                      <td className="px-6 py-5 text-sm">
                        <span
                          className="px-3 py-1.5 rounded-full text-xs font-medium flex w-fit"
                          style={{
                            background: empleado.estado?.toLowerCase() === "activo" 
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(107, 114, 128, 0.2)",
                            color: empleado.estado?.toLowerCase() === "activo" 
                              ? "#10b981"
                              : "#9ca3af",
                          }}
                        >
                          • {empleado.estado || "activo"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center justify-center">
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                      </td>
                      <td className="px-6 py-5 flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(empleado)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15 cursor-pointer"
                          style={{
                            background: "rgba(59, 130, 246, 0.15)",
                            border: "1px solid rgba(59, 130, 246, 0.3)",
                          }}
                          title="Editar"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteEmpleado(empleado._id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15 cursor-pointer"
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
                    {/* Expanded Row for Services */}
                    {expandedRows[empleado._id] && (
                      <tr>
                        <td colSpan="7" className="p-0 border-b border-white/5">
                          <div 
                            className="w-full px-6 py-5 flex flex-col gap-3"
                            style={{
                              background: "rgba(255, 255, 255, 0.02)",
                              boxShadow: "inset 0 4px 6px -4px rgba(0, 0, 0, 0.1)"
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                              </svg>
                              <span className="text-xs font-bold text-white/50 uppercase tracking-wider">Servicios Asignados a {empleado.nombre}</span>
                            </div>
                            
                            {empleado.services && empleado.services.length > 0 ? (
                              <div className="flex flex-wrap gap-2.5">
                                {empleado.services.map(srv => (
                                  <div 
                                    key={srv._id || srv} 
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
                                    style={{
                                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%)",
                                      border: "1px solid rgba(16, 185, 129, 0.3)",
                                      color: "#34d399",
                                      boxShadow: "0 2px 10px rgba(16, 185, 129, 0.05)"
                                    }}
                                  >
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    {srv.nameService || 'Servicio Desconocido'}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 px-3 py-2 rounded-lg w-fit" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)" }}>
                                <span className="text-sm text-white/40 italic">Sin servicios asignados por el momento</span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL: Agregar Nuevo Empleado */}
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
            className="relative w-full max-w-[620px] rounded-2xl p-8 animate-fade-in-up max-h-[90vh] overflow-y-auto"
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
              <h2 className="text-xl font-bold text-gray-900">
                {formData.id ? "Editar Empleado" : "Agregar Nuevo Empleado"}
              </h2>
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

            {/* Campo: Apellido */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Apellido</label>
              <input
                type="text"
                value={formData.apellido}
                onChange={(e) => setFormData(prev => ({ ...prev, apellido: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
            </div>

            {/* Campo: Correo */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
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

            {/* Fila: Contraseña y Salario */}
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
                <label className="block text-sm font-semibold text-gray-800 mb-2">Salario</label>
                <input
                  type="text"
                  value={formData.salario}
                  onChange={(e) => setFormData(prev => ({ ...prev, salario: e.target.value }))}
                  placeholder="$0.00"
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            </div>

            {/* Estado */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Estado</h3>
                <p className="text-[12px] text-gray-500">¿El empleado está activo?</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFormData(prev => ({ ...prev, estado: prev.estado === "activo" ? "inactivo" : "activo" }))}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: formData.estado === "activo"
                      ? "linear-gradient(135deg, #10b981, #34d399)"
                      : "rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{
                      left: formData.estado === "activo" ? "calc(100% - 26px)" : "2px",
                    }}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.estado === "activo" ? "text-emerald-600" : "text-gray-500"} capitalize`}>
                  {formData.estado}
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
                  style={{
                    background: formData.verificado
                      ? "linear-gradient(135deg, #10b981, #34d399)"
                      : "rgba(0,0,0,0.2)",
                  }}
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
                onClick={handleSaveEmpleado}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                {formData.id ? "Guardar Cambios" : "Guardar Empleado"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
