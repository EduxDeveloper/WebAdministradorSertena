import { useState } from "react"
import Sidebar from "../../components/ui/Sidebar"

/**
 * Pagina de Gestión de Empleados - Muestra una tabla con la información de los empleados
 * registrados (nombre, apellido, correo, salario, estado, verificación) y permite agregar
 * nuevos empleados mediante un modal con formulario y toggle de verificación.
 */
export default function Empleados() {
  const [showModal, setShowModal] = useState(false)

  // Estado del formulario del modal para agregar un nuevo empleado
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo: "",
    contrasena: "",
    salario: "",
    estado: "Activo",
    verificado: true,
  })

  // Datos quemados de empleados para la tabla
  const [empleados] = useState([
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
    {
      id: 2,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
    {
      id: 3,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
    {
      id: 4,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
    {
      id: 5,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
    {
      id: 6,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
    {
      id: 7,
      nombre: "Carlos",
      apellido: "Galdamez",
      correo: "c.mendoza@autoparts.com",
      salario: "$750",
      estado: "Activo",
      verificado: true,
    },
  ])

  // Resetear el formulario a sus valores iniciales
  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      correo: "",
      contrasena: "",
      salario: "",
      estado: "Activo",
      verificado: true,
    })
  }

  // Cerrar el modal y limpiar el formulario
  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  // Contar empleados activos
  const empleadosActivos = empleados.filter(e => e.estado === "Activo").length
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
                {empleados.map((empleado) => (
                  <tr
                    key={empleado.id}
                    className="hover:bg-white/[0.03] transition-colors duration-200"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-white/90">{empleado.nombre}</td>
                    <td className="px-6 py-5 text-sm text-white/60">{empleado.apellido}</td>
                    <td className="px-6 py-5 text-sm text-white/60">{empleado.correo}</td>
                    <td className="px-6 py-5 text-sm text-white/60">{empleado.salario}</td>
                    <td className="px-6 py-5 text-sm">
                      <span
                        className="px-3 py-1.5 rounded-full text-xs font-medium flex w-fit"
                        style={{
                          background: empleado.estado === "Activo" 
                            ? "rgba(16, 185, 129, 0.2)"
                            : "rgba(107, 114, 128, 0.2)",
                          color: empleado.estado === "Activo" 
                            ? "#10b981"
                            : "#9ca3af",
                        }}
                      >
                        • {empleado.estado}
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
                    <td className="px-6 py-5 text-right">
                      <button
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15 cursor-pointer ml-auto"
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
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
              <h2 className="text-xl font-bold text-gray-900">Agregar Nuevo Empleado</h2>
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
                value={formData.correo}
                onChange={(e) => setFormData(prev => ({ ...prev, correo: e.target.value }))}
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
                  value={formData.contrasena}
                  onChange={(e) => setFormData(prev => ({ ...prev, contrasena: e.target.value }))}
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
                  onClick={() => setFormData(prev => ({ ...prev, estado: prev.estado === "Activo" ? "Inactivo" : "Activo" }))}
                  className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: formData.estado === "Activo"
                      ? "linear-gradient(135deg, #10b981, #34d399)"
                      : "rgba(0,0,0,0.2)",
                  }}
                >
                  <div
                    className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                    style={{
                      left: formData.estado === "Activo" ? "calc(100% - 26px)" : "2px",
                    }}
                  />
                </button>
                <span className={`text-sm font-medium ${formData.estado === "Activo" ? "text-emerald-600" : "text-gray-500"}`}>
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
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                Guardar Empleado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
