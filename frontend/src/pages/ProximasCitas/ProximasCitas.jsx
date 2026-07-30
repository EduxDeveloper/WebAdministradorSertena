import { useState, useEffect } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"

// Nombres cortos de mes (es-ES) generados con la misma API que usa el DatePicker,
// para poder parsear de vuelta el string que produce (ej. "05 oct - 2026")
// sin depender de una lista fija que podria no coincidir segun el ICU del entorno.
const MESES_CORTOS = Array.from({ length: 12 }, (_, i) =>
  new Date(2000, i, 1).toLocaleString('es-ES', { month: 'short' }).toLowerCase()
)

// Convierte tanto fechas ISO (las que vienen del backend) como el formato
// "DD mon - YYYY" que genera el DatePicker personalizado, a un objeto Date real.
const parseCitaDate = (value) => {
  if (!value || !String(value).trim()) return null

  const match = String(value).trim().match(/^(\d{1,2})\s+([a-záéíóúñ.]+)\s*-\s*(\d{4})$/i)
  if (match) {
    const [, dia, mesTexto, anio] = match
    const mesIndex = MESES_CORTOS.indexOf(mesTexto.toLowerCase())
    if (mesIndex !== -1) {
      return new Date(Number(anio), mesIndex, Number(dia))
    }
  }

  const nativo = new Date(value)
  return Number.isNaN(nativo.getTime()) ? null : nativo
}

const formatCitaDate = (value) => {
  const date = parseCitaDate(value)
  if (!date) return ""

  return `${String(date.getDate()).padStart(2, '0')} ${date.toLocaleString('es-ES', { month: 'short' })} - ${date.getFullYear()}`
}

const formatCitaRange = (dateStart, dateEnd) => {
  const start = formatCitaDate(dateStart)
  const end = formatCitaDate(dateEnd)
  if (!start) return "Sin fecha"
  return start === end || !end ? start : `${start} - ${end}`
}

const getStatusColors = (status) => {
  if (status === "Finalizado") return { background: "rgba(34, 197, 94, 0.2)", color: "#22c55e", solid: "#22c55e" }
  if (status === "Atrasado") return { background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", solid: "#ef4444" }
  return { background: "rgba(59, 130, 246, 0.2)", color: "#60a5fa", solid: "#3b82f6" }
}

/**
 * Componente DatePicker personalizado
 */
function DatePicker({ value, onChange, label, error }) {
  const [showPicker, setShowPicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9)) // Octubre 2026

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay()

  const generateCalendarDays = () => {
    const days = []
    const totalDays = daysInMonth(currentMonth)
    const firstDay = firstDayOfMonth(currentMonth)

    // Agregar espacios vacíos
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Agregar días del mes
    for (let i = 1; i <= totalDays; i++) {
      days.push(i)
    }

    return days
  }

  const handleDayClick = (day) => {
    if (day) {
      const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) return
      const formattedDate = `${String(day).padStart(2, '0')} ${currentMonth.toLocaleString('es-ES', { month: 'short' })} - ${selectedDate.getFullYear()}`
      onChange(formattedDate)
      setShowPicker(false)
    }
  }

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const calendarDays = generateCalendarDays()
  const dayLabels = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]
  const monthName = currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
        </svg>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400 text-left"
        style={{
          background: "rgba(255,255,255,0.5)",
          border: error ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0,0,0,0.1)",
        }}
      >
        {value || "Seleccionar fecha"}
      </button>
      {error && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}

      {showPicker && (
        <div
          className="absolute top-full left-0 mt-2 p-4 rounded-lg shadow-lg z-50"
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Header del calendario */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={previousMonth}
              className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-900 capitalize">{monthName}</span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1 hover:bg-gray-200 rounded transition-all duration-200"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {dayLabels.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-gray-600 w-8">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleDayClick(day)}
                disabled={day && (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay() === 0 || new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay() === 6)}
                className={`
                  w-8 h-8 rounded text-xs font-medium transition-all duration-200
                  ${day
                    ? (new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay() === 0 || new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).getDay() === 6
                      ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                      : "hover:bg-emerald-500 hover:text-white text-gray-900 bg-gray-100")
                    : "opacity-0 cursor-default"
                  }
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Pagina de Gestión de Citas - Muestra las citas próximas con detalles,
 * calendario, y permite ver detalles, editar y gestionar citas.
 */
export default function ProximasCitas() {
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)
  const [filterStatus, setFilterStatus] = useState("Todas")
  const [calendarMonth, setCalendarMonth] = useState(new Date()) // Fecha actual real
  const [selectedDate, setSelectedDate] = useState(new Date()) // Hoy por defecto

  const [citas, setCitas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(6)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState("list")
  const { fetchApi } = useAuth()

  useEffect(() => {
    loadCitas()
    loadEmpleados()
  }, [page, limit])

  async function loadEmpleados() {
    try {
      const data = await fetchApi("/empleados")
      setEmpleados(data || [])
    } catch (error) {
      console.error("Error al cargar empleados:", error)
    }
  }

  async function loadCitas() {
    try {
      setLoading(true)
      const result = await fetchApi(`/proyects/paginado?page=${page}&limit=${limit}`)
      const data = result?.data || []
      // Mapear los datos del backend a la estructura que espera la UI
      const mappedCitas = (data || []).map(cita => ({
        id: cita._id,
        servicio: cita.idService?.nameService || (typeof cita.idService === 'string' ? cita.idService : "Servicio no asignado"),
        cliente: cita.idCustomer?.nombre || (typeof cita.idCustomer === 'string' ? cita.idCustomer : "Cliente no asignado"),
        idServiceRaw: cita.idService?._id || cita.idService,
        idCustomerRaw: cita.idCustomer?._id || cita.idCustomer,
        idEmpleadoRaw: cita.idEmpleado?._id || cita.idEmpleado,
        empleado: [cita.idEmpleado?.nombre || cita.idEmpleado?.name, cita.idEmpleado?.apellido || cita.idEmpleado?.lastName].filter(Boolean).join(" ") || "Sin asignar",
        fecha: formatCitaRange(cita.dateStart, cita.dateEnd),
        precio: String(cita.finalPrice || "0"),
        estado: cita.status === "Pendiente" ? "Programado" : (cita.status || "Programado"),
        isCompleted: cita.isCompleted === true || cita.status === "Finalizado",
        completionNotes: cita.completionNotes || "",
        ubicacion: cita.clientLocation || "No especificada",
        direccion: cita.clientDirection || "No especificada",
        telefono: cita.clientPhone || "No especificado",
        descripcion: cita.description || "Sin descripción",
        // Guardamos los originales para editar
        dateStart: cita.dateStart,
        dateEnd: cita.dateEnd,
      }))
      setCitas(mappedCitas)
      setTotal(result?.total || 0)
      setTotalPages(result?.totalPages || 1)
    } catch (error) {
      console.error("Error al cargar citas:", error)
    } finally {
      setLoading(false)
    }
  }

  // Estado del formulario del modal para editar una cita
  const [formData, setFormData] = useState({
    nombre: "",
    servicio: "",
    descripcion: "",
    inicio: "",
    fin: "",
    telefono: "",
    ubicacion: "",
    estado: "",
    precioFinal: "",
    idEmpleadoRaw: "",
    empleadoAsignadoNombre: "",
    isCompleted: false,
    completionNotes: "",
  })

  // Errores de validacion por campo del formulario de edicion
  const [errors, setErrors] = useState({})

  // Actualiza un campo del formulario y limpia su error asociado al modificarlo
  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  // Valida los campos del formulario de edicion. Devuelve true si todo es valido
  // y en caso contrario carga el estado `errors` con los mensajes por campo.
  const validateForm = () => {
    const newErrors = {}

    if (!formData.nombre || !formData.nombre.trim()) {
      newErrors.nombre = "El cliente es obligatorio."
    }

    if (!formData.servicio || !formData.servicio.trim()) {
      newErrors.servicio = "El servicio es obligatorio."
    }

    if (!formData.inicio || !String(formData.inicio).trim()) {
      newErrors.inicio = "La fecha de inicio es obligatoria."
    }

    if (!formData.fin || !String(formData.fin).trim()) {
      newErrors.fin = "La fecha de fin es obligatoria."
    }

    if (!newErrors.inicio && !newErrors.fin) {
      const fechaInicio = parseCitaDate(formData.inicio)
      const fechaFin = parseCitaDate(formData.fin)
      if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
        newErrors.fin = "La fecha de fin no puede ser anterior a la fecha de inicio."
      }
      if ((fechaInicio && (fechaInicio.getDay() === 0 || fechaInicio.getDay() === 6)) || (fechaFin && (fechaFin.getDay() === 0 || fechaFin.getDay() === 6))) {
        newErrors.inicio = "No se puede programar trabajo en sábado o domingo."
      }
    }

    const telefonoLimpio = String(formData.telefono || "").replace(/\D/g, "")
    if (telefonoLimpio.length < 8) {
      newErrors.telefono = "El telefono debe tener al menos 8 digitos."
    }

    const precioTexto = String(formData.precioFinal ?? "").trim()
    // Se conserva el signo "-" al limpiar (solo se descartan simbolos de moneda/separadores)
    // para poder detectar numeros negativos en vez de que el regex se los coma silenciosamente.
    const precio = parseFloat(precioTexto.replace(/[^0-9.-]/g, ""))
    if (precioTexto === "" || !Number.isFinite(precio) || precio < 0) {
      newErrors.precioFinal = "El precio final debe ser un numero valido mayor o igual a 0."
    }

    if (formData.isCompleted && !formData.completionNotes.trim()) {
      newErrors.completionNotes = "Las observaciones son obligatorias al finalizar la cita."
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Datos quemados de citas
  // Contar citas por estado
  const citasActivas = citas.filter(c => c.estado !== "Finalizado").length
  const citasProgramadas = citas.filter(c => c.estado === "Programado").length
  const citasIngresos = citas.reduce((sum, c) => {
    // Manejar casos donde precio no sea string o no tenga formato válido
    const precioStr = typeof c.precio === 'string' ? c.precio : String(c.precio || "")
    const num = parseInt(precioStr.replace(/[^0-9]/g, ""))
    return sum + (isNaN(num) ? 0 : num)
  }, 0)

  // Abrir modal de detalles
  const handleOpenDetails = (cita) => {
    setSelectedCita(cita)
    setShowDetailsModal(true)
  }

  // Abrir modal de editar
  const handleOpenEdit = (cita) => {
    setFormData({
      id: cita.id,
      idCustomerRaw: cita.idCustomerRaw,
      idServiceRaw: cita.idServiceRaw,
      idEmpleadoRaw: cita.idEmpleadoRaw || "",
      empleadoAsignadoNombre: cita.empleado,
      nombre: cita.cliente,
      servicio: cita.servicio,
      descripcion: cita.descripcion,
      inicio: formatCitaDate(cita.dateStart),
      fin: formatCitaDate(cita.dateEnd),
      telefono: cita.telefono,
      ubicacion: cita.ubicacion,
      direccion: cita.direccion,
      estado: cita.isCompleted ? "Programado" : cita.estado,
      precioFinal: cita.precio,
      isCompleted: cita.isCompleted,
      completionNotes: cita.completionNotes,
    })
    setErrors({})
    setSelectedCita(cita)
    setShowDetailsModal(false)
    setShowModal(true)
  }

  // Cerrar modales
  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedCita(null)
    setErrors({})
  }

  const handleCloseDetails = () => {
    setShowDetailsModal(false)
    setSelectedCita(null)
  }

  const handleSaveCita = async () => {
    if (!formData.id) return // No support for create yet based on UI

    if (!validateForm()) return

    try {
      const payload = {
        idCustomer: formData.idCustomerRaw,
        idService: formData.idServiceRaw,
        idEmpleado: formData.idEmpleadoRaw || undefined,
        dateStart: parseCitaDate(formData.inicio)?.toISOString(),
        dateEnd: parseCitaDate(formData.fin)?.toISOString(),
        clientPhone: formData.telefono,
        clientLocation: formData.ubicacion,
        clientDirection: formData.direccion || "",
        finalPrice: formData.precioFinal,
        status: formData.isCompleted ? "Finalizado" : formData.estado,
        isCompleted: formData.isCompleted,
        completionNotes: formData.completionNotes,
        description: formData.descripcion,
      }

      await fetchApi(`/proyects/${formData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      handleCloseModal()
      loadCitas()
    } catch (error) {
      console.error("Error al guardar cita:", error)
      Swal.fire({
        icon: "error",
        title: "Error al guardar",
        text: error.message || "No se pudo guardar la cita. Intenta nuevamente.",
        background: "#15354d",
        color: "#fff",
        confirmButtonColor: "#10b981",
      })
    }
  }

  // Filtrar citas por estado
  const citasFiltradas = filterStatus === "Todas" 
    ? citas 
    : citas.filter(c => c.estado === filterStatus)

  const empleadosElegibles = empleados.filter((empleado) =>
    empleado.status === true && (empleado.services || []).some((service) =>
      (service._id || service) === formData.idServiceRaw
    )
  )
  const tecnicoActualEnLista = empleadosElegibles.some((empleado) => empleado._id === formData.idEmpleadoRaw)

  // Generar calendario dinámico
  const generateCalendar = () => {
    const days = []
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()

    // Agregar espacios vacíos al inicio
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Agregar días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }

    return days
  }

  const calendarDays = generateCalendar()
  const dayLabels = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"]

  // Navegar a mes anterior
  const handlePreviousMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))
  }

  // Navegar a mes siguiente
  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))
  }

  // Seleccionar día del calendario
  const handleSelectDate = (day) => {
    if (day) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
      setSelectedDate(date)
    }
  }

  // Obtener citas del día seleccionado
  const getCitasDelDia = () => {
    if (!selectedDate) return []
    
    // Comparar solo día, mes y año
    return citas.filter((cita) => {
      const citaDate = parseCitaDate(cita.dateStart)
      return citaDate &&
        citaDate.getFullYear() === selectedDate.getFullYear() &&
        citaDate.getMonth() === selectedDate.getMonth() &&
        citaDate.getDate() === selectedDate.getDate()
    })
  }

  const citasDelDiaSeleccionado = getCitasDelDia()

  return (
    <div className="relative w-full min-h-screen flex text-white bg-[#15354d]">

      {/* BARRA LATERAL - Componente reutilizable */}
      <Sidebar activeTab="Proximas citas" />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 min-h-screen p-4 sm:p-6 lg:p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Encabezado */}
        <div>
          <div className="text-emerald-400 font-medium text-[15px] mb-1">
            Bienvenido! Administrador
          </div>
          <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
            Gestión de Citas
          </h1>
          <p className="text-white/40 text-sm">
            Consulta, reasigna y finaliza las citas programadas.
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 gap-4 w-full">
          {/* Tarjeta: Total Citas Activas */}
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
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h2l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Total de Citas Activas</p>
              <p className="text-2xl font-bold text-white">{citasActivas}</p>
            </div>
          </div>

          {/* Tarjeta: Citas Programadas */}
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
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Citas Programadas</p>
              <p className="text-2xl font-bold text-white">{citasProgramadas}</p>
            </div>
          </div>

          {/* Tarjeta: Ingresos proyectados */}
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
                background: "rgba(34, 197, 94, 0.2)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="19" cy="12" r="1" />
                <circle cx="5" cy="12" r="1" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Ingresos proyectados</p>
              <p className="text-2xl font-bold text-white">${citasIngresos.toLocaleString()}</p>
            </div>
          </div>

          {/* Tarjeta: Año */}
          <div
            className="rounded-2xl p-6 flex items-center justify-between"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <p className="text-white/50 text-xs font-medium">Período</p>
              <p className="text-lg font-bold text-white">Octubre 2026</p>
            </div>
          </div>
        </div>

        {/* Contenedor principal con tabla y calendario */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
          {/* Tabla de citas */}
          <div className="xl:col-span-2">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex flex-wrap gap-2">
                {["Todas", "Programado", "Finalizado", "Atrasado"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                    filterStatus === status
                      ? "bg-emerald-500 text-white"
                      : "bg-white/10 text-white/60 hover:bg-white/20"
                  }`}
                >
                  {status}
                </button>
                ))}
              </div>
              <div className="inline-flex rounded-xl overflow-hidden border border-white/10 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-2 text-xs font-semibold ${viewMode === "list" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60"}`}
                >
                  Lista
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`px-3 py-2 text-xs font-semibold ${viewMode === "cards" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/60"}`}
                >
                  Tarjetas
                </button>
              </div>
            </div>

            {viewMode === "list" ? (
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
                      <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Servicio & Cliente</th>
                      <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Fecha</th>
                      <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Precio/Estatus</th>
                      <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-5 text-center text-white/50">Cargando citas...</td>
                      </tr>
                    ) : citasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-5 text-center text-white/50">No hay citas registradas</td>
                      </tr>
                    ) : (
                      citasFiltradas.map((cita) => (
                        <tr
                          key={cita.id}
                          className="hover:bg-white/[0.03] transition-colors duration-200"
                        >
                          <td className="px-6 py-5">
                            <div>
                              <p className="text-sm font-medium text-white/90">{cita.servicio}</p>
                              <p className="text-xs text-white/50">{cita.cliente}</p>
                              <p className="text-xs text-emerald-300">Técnico: {cita.empleado}</p>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-sm text-white/60">{cita.fecha}</td>
                          <td className="px-6 py-5 text-sm">
                            <div>
                              <p className="text-white/90">{cita.precio}</p>
                              <span
                                className="text-xs px-2 py-1 rounded-full inline-block mt-1"
                                style={{
                                  background: getStatusColors(cita.estado).background,
                                  color: getStatusColors(cita.estado).color,
                                }}
                              >
                                {cita.estado}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-5 flex gap-2">
                            <button
                              onClick={() => handleOpenDetails(cita)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15"
                              style={{
                                background: "rgba(255, 255, 255, 0.08)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                              }}
                              title="Ver detalles"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleOpenEdit(cita)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15"
                              style={{
                                background: "rgba(255, 255, 255, 0.08)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                              }}
                              title="Editar cita"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  <p className="col-span-full py-8 text-center text-white/50">Cargando citas...</p>
                ) : citasFiltradas.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-white/50">No hay citas registradas</p>
                ) : (
                  citasFiltradas.map((cita) => (
                    <article key={cita.id} className="rounded-2xl p-5 border border-white/10" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-white">{cita.servicio}</h3>
                          <p className="text-sm text-white/60 mt-1">{cita.cliente}</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-full shrink-0" style={{ background: getStatusColors(cita.estado).background, color: getStatusColors(cita.estado).color }}>{cita.estado}</span>
                      </div>
                      <div className="mt-4 space-y-1.5 text-sm text-white/65">
                        <p>Fecha: {cita.fecha}</p>
                        <p>Técnico: {cita.empleado}</p>
                        <p>Precio: {cita.precio}</p>
                      </div>
                      <div className="flex gap-2 mt-5">
                        <button onClick={() => handleOpenDetails(cita)} className="flex-1 rounded-xl py-2 text-sm font-semibold bg-white/10 hover:bg-white/15">Ver</button>
                        <button onClick={() => handleOpenEdit(cita)} className="flex-1 rounded-xl py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-white">Editar</button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <span>Mostrar</span>
                <select
                  value={limit}
                  onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }}
                  className="rounded-lg bg-white/10 border border-white/20 px-2 py-1 text-white outline-none"
                >
                  <option value={6} className="text-black">6</option>
                  <option value={12} className="text-black">12</option>
                  <option value={24} className="text-black">24</option>
                </select>
                <span>de {total} citas</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="px-3 py-1.5 rounded-lg bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed">Siguiente</button>
              </div>
            </div>
          </div>

          {/* Calendario y próximos eventos */}
          <div className="flex flex-col gap-4">
            {/* Calendario */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <h3 className="text-white font-semibold mb-6 text-center">Calendario</h3>
              
              {/* Header del calendario con navegación */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handlePreviousMonth}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-all duration-200 active:scale-95"
                  title="Mes anterior"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>
                <span className="text-white/90 text-sm font-bold capitalize flex-1 text-center">
                  {calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/20 transition-all duration-200 active:scale-95"
                  title="Mes siguiente"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
              
              {/* Días de la semana */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {dayLabels.map((day) => (
                  <div key={day} className="text-center text-xs text-white/60 font-semibold h-8 flex items-center justify-center">
                    {day}
                  </div>
                ))}
              </div>

              {/* Días del mes */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isSelected = selectedDate && 
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === calendarMonth.getMonth() &&
                    selectedDate.getFullYear() === calendarMonth.getFullYear()
                  
                  const today = new Date()
                  const isToday = day && 
                    day === today.getDate() &&
                    calendarMonth.getMonth() === today.getMonth() &&
                    calendarMonth.getFullYear() === today.getFullYear()
                  
                  const hasCitas = day && [15, 19, 21].includes(day)
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectDate(day)}
                      className={`
                        h-10 rounded-lg text-sm font-semibold transition-all duration-200 relative
                        ${day ? "cursor-pointer" : "cursor-default"}
                        ${isSelected 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/50 scale-105" 
                          : isToday
                          ? "bg-blue-500 text-white font-bold"
                          : day
                          ? "bg-white/8 text-white/90 hover:bg-white/15 border border-white/10"
                          : "opacity-0"
                        }
                      `}
                      disabled={!day}
                    >
                      {day}
                      {hasCitas && !isSelected && (
                        <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Mostrar fecha seleccionada */}
              {selectedDate && (
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-white/50 text-xs mb-2">Fecha seleccionada:</p>
                  <p className="text-white font-bold text-sm capitalize">
                    {selectedDate.toLocaleString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Próximos eventos - Citas del día seleccionado */}
            <div
              className="rounded-2xl p-6 flex-1"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <h3 className="text-white font-semibold mb-4">
                {selectedDate 
                  ? `Citas - ${selectedDate.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : "Próximos Eventos"
                }
              </h3>
              
              {citasDelDiaSeleccionado.length > 0 ? (
                <div className="space-y-3">
                  {citasDelDiaSeleccionado.map((cita) => (
                    <div
                      key={cita.id}
                      className="p-4 rounded-lg border-l-4 transition-all duration-200 hover:scale-105 cursor-pointer"
                      onClick={() => handleOpenDetails(cita)}
                      style={{
                        background: getStatusColors(cita.estado).background,
                        borderColor: getStatusColors(cita.estado).solid,
                      }}
                    >
                      <p className="text-xs text-white/80 font-semibold mb-2">{cita.servicio}</p>
                      <p className="text-xs text-white/60 mb-2">{cita.cliente}</p>
                      <p className="text-xs text-white/50 mb-3">{cita.fecha}</p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs px-2 py-1 rounded font-semibold"
                          style={{
                            background: getStatusColors(cita.estado).solid,
                            color: "white",
                          }}
                        >
                          {cita.estado}
                        </span>
                        <span className="text-xs text-white/70 font-bold">{cita.precio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.3)" 
                    strokeWidth="1.5"
                    className="mx-auto mb-3"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-white/40 text-sm">No hay citas para este día</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL: Ver Detalles de Cita */}
      {showDetailsModal && selectedCita && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 100 }}
        >
          {/* Overlay oscuro */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleCloseDetails}
          />

          {/* Contenido del modal */}
          <div
              className="relative w-full max-w-[600px] rounded-2xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto"
            style={{
              background: "linear-gradient(135deg, rgba(200, 200, 210, 0.85) 0%, rgba(180, 180, 195, 0.80) 100%)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
            }}
          >
            {/* Header del modal */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedCita.servicio}</h2>
                <p className="text-sm text-gray-600">{selectedCita.cliente}</p>
                <p className="text-sm text-gray-600">Técnico: {selectedCita.empleado}</p>
              </div>
              <button
                onClick={handleCloseDetails}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.3)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                  FECHA PROGRAMADA
                </div>
                <p className="text-gray-600 text-sm">{parseCitaDate(selectedCita.dateStart)?.toLocaleDateString('es-ES') || 'Sin fecha'}</p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: "rgba(255, 255, 255, 0.3)",
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                  FINALIZACIÓN
                </div>
                <p className="text-gray-600 text-sm">{parseCitaDate(selectedCita.dateEnd)?.toLocaleDateString('es-ES') || 'Sin fecha'}</p>
              </div>
            </div>

            {/* Ubicación y contacto */}
            <div
              className="p-4 rounded-lg mb-6"
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Ubicación y contacto
              </h3>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="font-medium">{selectedCita.ubicacion}</p>
                <p className="text-gray-600">{selectedCita.direccion}</p>
                <p className="text-gray-600">{selectedCita.telefono}</p>
              </div>
            </div>

            {/* Descripción técnica */}
            <div
              className="p-4 rounded-lg mb-6"
              style={{
                background: "rgba(255, 255, 255, 0.3)",
                border: "1px solid rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3 className="font-bold text-gray-900 mb-2">Descripción Técnica</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedCita.descripcion}</p>
            </div>

            {selectedCita.isCompleted && (
              <div
                className="p-4 rounded-lg mb-6"
                style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)" }}
              >
                <h3 className="font-bold text-gray-900 mb-2">Observaciones de finalización</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedCita.completionNotes || "Sin observaciones registradas."}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleCloseDetails}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-black/10 transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                Cerrar
              </button>
              <button
                onClick={() => handleOpenEdit(selectedCita)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Editar Cita */}
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
              className="relative w-full max-w-[620px] rounded-2xl p-5 sm:p-8 max-h-[90vh] overflow-y-auto"
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
              <h2 className="text-xl font-bold text-gray-900">Editar Cita</h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/10 transition-all duration-200"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Fila: Nombre y Servicio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => handleFieldChange("nombre", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: errors.nombre ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0,0,0,0.1)",
                  }}
                />
                {errors.nombre && (
                  <p className="text-red-400 text-xs mt-1">{errors.nombre}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Servicio</label>
                <input
                  type="text"
                  value={formData.servicio}
                  onChange={(e) => handleFieldChange("servicio", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: errors.servicio ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0,0,0,0.1)",
                  }}
                />
                {errors.servicio && (
                  <p className="text-red-400 text-xs mt-1">{errors.servicio}</p>
                )}
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Técnico asignado</label>
              <select
                value={formData.idEmpleadoRaw}
                onChange={(e) => handleFieldChange("idEmpleadoRaw", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{ background: "rgba(255,255,255,0.5)", border: "1px solid rgba(0,0,0,0.1)" }}
              >
                <option value="">Sin asignar</option>
                {formData.idEmpleadoRaw && !tecnicoActualEnLista && (
                  <option value={formData.idEmpleadoRaw}>{formData.empleadoAsignadoNombre || "Técnico asignado"}</option>
                )}
                {empleadosElegibles.map((empleado) => (
                  <option key={empleado._id} value={empleado._id}>
                    {[empleado.nombre || empleado.name, empleado.apellido || empleado.lastName].filter(Boolean).join(" ")}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Solo se muestran empleados activos que prestan este servicio.</p>
            </div>

            {/* Descripción */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => handleFieldChange("descripcion", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400 resize-none h-24"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
            </div>

            {/* Fechas con DatePicker */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <DatePicker
                value={formData.inicio}
                onChange={(date) => handleFieldChange("inicio", date)}
                label="INICIO"
                error={errors.inicio}
              />
              <DatePicker
                value={formData.fin}
                onChange={(date) => handleFieldChange("fin", date)}
                label="FIN ESTIMADO"
                error={errors.fin}
              />
            </div>

            {/* Teléfono y Ubicación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Teléfono</label>
                <input
                  type="text"
                  value={formData.telefono}
                  onChange={(e) => {
                    let value = e.target.value;
                    let digits = value.replace(/\D/g, '');
                    if (digits.startsWith('503')) digits = digits.slice(3);
                    if (digits.length > 4) {
                      value = '+503 ' + digits.slice(0, 4) + '-' + digits.slice(4, 8);
                    } else if (digits.length > 0) {
                      value = '+503 ' + digits;
                    } else {
                      value = '';
                    }
                    if (value.length <= 14) {
                      handleFieldChange("telefono", value);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: errors.telefono ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0,0,0,0.1)",
                  }}
                />
                {errors.telefono && (
                  <p className="text-red-400 text-xs mt-1">{errors.telefono}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Ubicación</label>
                <input
                  type="text"
                  value={formData.ubicacion}
                  onChange={(e) => handleFieldChange("ubicacion", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            </div>

            {/* Estado y Precio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Estado</label>
                <select
                  value={formData.estado}
                  disabled={formData.isCompleted}
                  onChange={(e) => handleFieldChange("estado", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                >
                  <option value="Programado">Programado</option>
                  <option value="Atrasado">Atrasado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Precio Final</label>
                <input
                  type="text"
                  value={formData.precioFinal}
                  onChange={(e) => handleFieldChange("precioFinal", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: errors.precioFinal ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0,0,0,0.1)",
                  }}
                />
                {errors.precioFinal && (
                  <p className="text-red-400 text-xs mt-1">{errors.precioFinal}</p>
                )}
              </div>
            </div>

            <div className="mb-5 rounded-xl p-4" style={{ background: "rgba(34, 197, 94, 0.10)", border: "1px solid rgba(34, 197, 94, 0.25)" }}>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isCompleted}
                  onChange={(e) => {
                    const isCompleted = e.target.checked
                    setFormData((prev) => ({ ...prev, isCompleted, estado: "Programado" }))
                    setErrors((prev) => ({ ...prev, completionNotes: undefined }))
                  }}
                  className="h-5 w-5 accent-emerald-500"
                />
                <span className="text-sm font-bold text-gray-900">Cita finalizada</span>
              </label>
              <p className="text-xs text-gray-600 mt-1 ml-8">Marca esta opción cuando el servicio se haya realizado.</p>

              {formData.isCompleted && (
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Observaciones de la cita</label>
                  <textarea
                    value={formData.completionNotes}
                    onChange={(e) => handleFieldChange("completionNotes", e.target.value)}
                    placeholder="Describe lo realizado, novedades o recomendaciones para el cliente."
                    className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400 resize-y min-h-24"
                    style={{ background: "rgba(255,255,255,0.65)", border: errors.completionNotes ? "1px solid rgba(239, 68, 68, 0.7)" : "1px solid rgba(0,0,0,0.1)" }}
                  />
                  {errors.completionNotes && <p className="text-red-500 text-xs mt-1">{errors.completionNotes}</p>}
                </div>
              )}
            </div>

            {/* Separador */}
            <div className="border-t border-black/10 mb-6" />

            {/* Botones de accion */}
            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-black/10"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCita}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                Guardar Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
