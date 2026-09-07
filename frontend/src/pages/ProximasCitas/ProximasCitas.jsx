import { useState, useEffect } from "react"
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton, AdminStatCard, AdminStatGrid } from "../../components/ui/AdminLayout"
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"
import { CardsLoadingGrid, TableLoadingRows } from "../../components/ui/LoadingSkeleton"

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

  const nativeDateMatch = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (nativeDateMatch) {
    const [, year, month, day] = nativeDateMatch
    return new Date(Number(year), Number(month) - 1, Number(day))
  }

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

const isSameCitaDay = (firstValue, secondValue) => {
  const firstDate = parseCitaDate(firstValue)
  const secondDate = parseCitaDate(secondValue)
  if (!firstDate || !secondDate) return false

  return firstDate.getFullYear() === secondDate.getFullYear()
    && firstDate.getMonth() === secondDate.getMonth()
    && firstDate.getDate() === secondDate.getDate()
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

const getGoogleMapsUrl = (coordinates, mapUrl) => {
  if (coordinates?.latitude !== undefined && coordinates?.longitude !== undefined) {
    return `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`
  }
  return mapUrl || ""
}

const getWazeUrl = (coordinates) => {
  if (coordinates?.latitude === undefined || coordinates?.longitude === undefined) return ""
  return `https://www.waze.com/ul?ll=${coordinates.latitude}%2C${coordinates.longitude}&navigate=yes`
}

const mapCitaFromApi = (cita) => ({
  id: cita._id,
  servicio: cita.idService?.nameService || (typeof cita.idService === 'string' ? cita.idService : "Servicio no asignado"),
  cliente: cita.idCustomer?.nombre || (typeof cita.idCustomer === 'string' ? cita.idCustomer : "Cliente no asignado"),
  idServiceRaw: cita.idService?._id || cita.idService,
  idCustomerRaw: cita.idCustomer?._id || cita.idCustomer,
  idEmpleadoRaw: cita.idEmpleado?._id || cita.idEmpleado,
  empleado: [cita.idEmpleado?.nombre || cita.idEmpleado?.name, cita.idEmpleado?.apellido || cita.idEmpleado?.lastName].filter(Boolean).join(" ") || "Sin asignar",
  fecha: formatCitaRange(cita.dateStart, cita.dateEnd),
  precio: String(cita.finalPrice || "0"),
  estado: cita.isCompleted === true || cita.status === "Finalizado"
    ? "Finalizado"
    : cita.status === "Pendiente"
      ? "Programado"
      : (cita.status || "Programado"),
  isCompleted: cita.isCompleted === true || cita.status === "Finalizado",
  completionNotes: cita.completionNotes || "",
  ubicacion: cita.clientLocation || "No especificada",
  direccion: cita.clientDirection || "No especificada",
  coordinates: cita.clientCoordinates || null,
  mapUrl: cita.clientMapUrl || "",
  telefono: cita.clientPhone || "No especificado",
  descripcion: cita.description || "Sin descripción",
  dateStart: cita.dateStart,
  dateEnd: cita.dateEnd,
})

/**
 * Componente DatePicker personalizado
 */
// Se conserva temporalmente para no alterar el calendario de consulta de esta página.
// eslint-disable-next-line no-unused-vars
function LegacyDatePicker({ value, onChange, label, error }) {
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
          className="absolute top-full left-0 mt-2 p-4 rounded-lg shadow-lg z-50 bg-white border border-slate-200"
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
const toDateInputValue = (value) => {
  const date = parseCitaDate(value)
  if (!date) return ""

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function DatePicker({ value, onChange, label, error }) {
  const [weekendError, setWeekendError] = useState("")

  const handleChange = (event) => {
    const nextValue = event.target.value
    const selectedDate = parseCitaDate(nextValue)

    if (selectedDate && (selectedDate.getDay() === 0 || selectedDate.getDay() === 6)) {
      setWeekendError("No se puede programar trabajo en sábado o domingo.")
      return
    }

    setWeekendError("")
    onChange(nextValue)
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
        </svg>
        {label}
      </label>
      <input
        type="date"
        value={toDateInputValue(value)}
        onChange={handleChange}
        className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
        style={{
          background: "rgba(255,255,255,0.5)",
          border: error || weekendError ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(0,0,0,0.1)",
        }}
      />
      {(error || weekendError) && <p className="text-red-400 text-xs mt-1">{error || weekendError}</p>}
    </div>
  )
}

export default function ProximasCitas() {
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)
  const [filterStatus, setFilterStatus] = useState("Todas")
  const [calendarMonth, setCalendarMonth] = useState(new Date()) // Fecha actual real
  const [selectedDate, setSelectedDate] = useState(new Date()) // Hoy por defecto

  const [citas, setCitas] = useState([])
  const [calendarCitas, setCalendarCitas] = useState([])
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(6)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState({
    activas: 0,
    programadas: 0,
    atrasadas: 0,
    finalizadas: 0,
    ingresosProyectados: 0,
  })
  const [viewMode, setViewMode] = useState("list")
  const { fetchApi } = useAuth()

  useEffect(() => {
    loadEmpleados()
  }, [])

  useEffect(() => {
    loadCitas()
  }, [page, limit, filterStatus])

  async function loadEmpleados() {
    try {
      const data = await fetchApi("/empleados/obtener")
      setEmpleados(data || [])
    } catch (error) {
      console.error("Error al cargar empleados:", error)
    }
  }

  async function loadCitas() {
    try {
      setLoading(true)
      const statusQuery = filterStatus === "Todas" ? "" : `&status=${encodeURIComponent(filterStatus)}`
      const [result, calendarResult] = await Promise.all([
        fetchApi(`/proyects/paginado?page=${page}&limit=${limit}${statusQuery}`),
        fetchApi("/proyects"),
      ])
      const data = result?.data || []
      const mappedCitas = (data || []).map(mapCitaFromApi)
      setCitas(mappedCitas)
      setCalendarCitas((Array.isArray(calendarResult) ? calendarResult : []).map(mapCitaFromApi))
      setTotal(result?.total || 0)
      setTotalPages(result?.totalPages || 1)
      setSummary(result?.summary || {
        activas: 0,
        programadas: 0,
        atrasadas: 0,
        finalizadas: 0,
        ingresosProyectados: 0,
      })
    } catch (error) {
      console.error("Error al cargar citas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (status) => {
    setFilterStatus(status)
    setPage(1)
  }

  // Estado del formulario del modal para editar una cita
  const [formData, setFormData] = useState({
    nombre: "",
    servicio: "",
    descripcion: "",
    inicio: "",
    fin: "",
    originalInicio: "",
    originalFin: "",
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
      const datesChanged = !isSameCitaDay(formData.inicio, formData.originalInicio)
        || !isSameCitaDay(formData.fin, formData.originalFin)
      if (datesChanged && ((fechaInicio && (fechaInicio.getDay() === 0 || fechaInicio.getDay() === 6)) || (fechaFin && (fechaFin.getDay() === 0 || fechaFin.getDay() === 6)))) {
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
      inicio: toDateInputValue(cita.dateStart),
      fin: toDateInputValue(cita.dateEnd),
      originalInicio: toDateInputValue(cita.dateStart),
      originalFin: toDateInputValue(cita.dateEnd),
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
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488",
      })
    }
  }

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
    return calendarCitas.filter((cita) => {
      const citaDate = parseCitaDate(cita.dateStart)
      return citaDate &&
        citaDate.getFullYear() === selectedDate.getFullYear() &&
        citaDate.getMonth() === selectedDate.getMonth() &&
        citaDate.getDate() === selectedDate.getDate()
    })
  }

  const citasDelDiaSeleccionado = getCitasDelDia()
  const periodoLabel = calendarMonth.toLocaleString("es-ES", { month: "long", year: "numeric" })
  const periodoFormatted = periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1)

  return (
    <AdminLayout activeTab="Proximas citas">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Gestión de Citas"
          description="Consulta, reasigna y finaliza las citas programadas."
        />

        <AdminStatGrid columns={4}>
          <AdminStatCard
            label="Total de Citas Activas"
            value={summary.activas}
            iconTone="green"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2-3h2l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>}
          />
          <AdminStatCard
            label="Citas Programadas"
            value={summary.programadas}
            iconTone="blue"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          />
          <AdminStatCard
            label="Ingresos proyectados"
            value={`$${Math.round(summary.ingresosProyectados).toLocaleString()}`}
            iconTone="green"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
          />
          <AdminStatCard
            label="Período"
            value={periodoFormatted}
            valueSize="md"
            iconTone="slate"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>}
          />
        </AdminStatGrid>

        {/* Contenedor principal con tabla y calendario */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1">
          {/* Tabla de citas */}
          <div className="xl:col-span-2">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="admin-tabs flex-wrap">
                {["Todas", "Programado", "Finalizado", "Atrasado"].map((status) => (
                <button key={status} type="button" onClick={() => handleFilterChange(status)} className={`admin-tab ${filterStatus === status ? "admin-tab--active" : ""}`}>{status}</button>
                ))}
              </div>
              <div className="admin-tabs self-start sm:self-auto">
                <button type="button" onClick={() => setViewMode("list")} className={`admin-tab ${viewMode === "list" ? "admin-tab--active" : ""}`}>Lista</button>
                <button type="button" onClick={() => setViewMode("cards")} className={`admin-tab ${viewMode === "cards" ? "admin-tab--active" : ""}`}>Tarjetas</button>
              </div>
            </div>

            {viewMode === "list" ? (
            <div className="admin-card admin-table-wrap">
              <div className="overflow-x-auto w-full">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Servicio & Cliente</th>
                      <th>Fecha</th>
                      <th>Precio/Estatus</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <TableLoadingRows columns={4} />
                    ) : citas.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="admin-empty">No hay citas registradas</td>
                      </tr>
                    ) : (
                      citas.map((cita) => (
                        <tr key={cita.id}>
                          <td>
                            <div>
                              <p className="font-medium text-slate-900">{cita.servicio}</p>
                              <p className="text-xs admin-text-muted">{cita.cliente}</p>
                              <p className="text-xs text-teal-700">Técnico: {cita.empleado}</p>
                            </div>
                          </td>
                          <td className="admin-text-muted">{cita.fecha}</td>
                          <td>
                            <div>
                              <p className="text-slate-900">{cita.precio}</p>
                              <span className="admin-badge mt-1" style={{ color: getStatusColors(cita.estado).color, background: getStatusColors(cita.estado).background }}>{cita.estado}</span>
                            </div>
                          </td>
                          <td>
                            <div className="flex gap-2">
                            <button type="button" onClick={() => handleOpenDetails(cita)} className="admin-btn admin-btn-icon admin-btn-secondary" title="Ver detalles">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            </button>
                            <button type="button" onClick={() => handleOpenEdit(cita)} className="admin-btn admin-btn-icon admin-btn-secondary" title="Editar cita">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            </div>
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
                  <CardsLoadingGrid />
                ) : citas.length === 0 ? (
                  <p className="col-span-full py-8 text-center text-white/50">No hay citas registradas</p>
                ) : (
                  citas.map((cita) => (
                    <article key={cita.id} className="admin-card admin-card-padded">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900">{cita.servicio}</h3>
                          <p className="text-sm admin-text-muted mt-1">{cita.cliente}</p>
                        </div>
                        <span className="admin-badge shrink-0" style={{ background: getStatusColors(cita.estado).background, color: getStatusColors(cita.estado).color }}>{cita.estado}</span>
                      </div>
                      <div className="mt-4 space-y-1.5 text-sm admin-text-muted">
                        <p>Fecha: {cita.fecha}</p>
                        <p>Técnico: {cita.empleado}</p>
                        <p>Precio: {cita.precio}</p>
                      </div>
                      <div className="flex gap-2 mt-5">
                        <AdminSecondaryButton type="button" onClick={() => handleOpenDetails(cita)} className="flex-1 justify-center">Ver</AdminSecondaryButton>
                        <AdminPrimaryButton type="button" onClick={() => handleOpenEdit(cita)} className="flex-1 justify-center">Editar</AdminPrimaryButton>
                      </div>
                    </article>
                  ))
                )}
              </div>
            )}

            <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm admin-text-muted">
              <div className="flex items-center gap-2">
                <span>Mostrar</span>
                <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1) }} className="admin-input w-auto py-1 px-2">
                  <option value={6}>6</option>
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                </select>
                <span>de {total} citas</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} className="admin-btn admin-btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed">Anterior</button>
                <span>Página {page} de {totalPages}</span>
                <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages} className="admin-btn admin-btn-secondary px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed">Siguiente</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="admin-card admin-card-padded">
              <h3 className="text-slate-900 font-semibold mb-6 text-center">Calendario</h3>
              <div className="flex items-center justify-between mb-6">
                <button type="button" onClick={handlePreviousMonth} className="admin-btn admin-btn-icon admin-btn-secondary" title="Mes anterior">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
                <span className="text-slate-900 text-sm font-bold capitalize flex-1 text-center">
                  {calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + calendarMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}
                </span>
                <button type="button" onClick={handleNextMonth} className="admin-btn admin-btn-icon admin-btn-secondary" title="Mes siguiente">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {dayLabels.map((day) => (
                  <div key={day} className="text-center text-xs admin-text-muted font-semibold h-8 flex items-center justify-center">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const isSelected = selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === calendarMonth.getMonth() && selectedDate.getFullYear() === calendarMonth.getFullYear()
                  const today = new Date()
                  const isToday = day && day === today.getDate() && calendarMonth.getMonth() === today.getMonth() && calendarMonth.getFullYear() === today.getFullYear()
                  const hasCitas = day && calendarCitas.some((cita) => {
                    const citaDate = parseCitaDate(cita.dateStart)
                    return citaDate && citaDate.getDate() === day && citaDate.getMonth() === calendarMonth.getMonth() && citaDate.getFullYear() === calendarMonth.getFullYear()
                  })
                  return (
                    <button key={index} type="button" onClick={() => handleSelectDate(day)} disabled={!day}
                      className={`h-10 rounded-lg text-sm font-semibold transition relative ${!day ? "opacity-0 cursor-default" : isSelected ? "bg-teal-600 text-white" : isToday ? "bg-teal-50 text-teal-800 border border-teal-200" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}>
                      {day}
                      {hasCitas && !isSelected && <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-teal-500 rounded-full" />}
                    </button>
                  )
                })}
              </div>
              {selectedDate && (
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <p className="admin-text-muted text-xs mb-2">Fecha seleccionada:</p>
                  <p className="text-slate-900 font-bold text-sm capitalize">
                    {selectedDate.toLocaleString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              )}
            </div>

            <div className="admin-card admin-card-padded flex-1">
              <h3 className="text-slate-900 font-semibold mb-4">
                {selectedDate ? `Citas - ${selectedDate.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}` : "Próximos Eventos"}
              </h3>
              {citasDelDiaSeleccionado.length > 0 ? (
                <div className="space-y-3">
                  {citasDelDiaSeleccionado.map((cita) => (
                    <div key={cita.id} className="admin-list-item flex-col items-stretch cursor-pointer border-l-4" style={{ borderLeftColor: getStatusColors(cita.estado).solid, background: getStatusColors(cita.estado).background }} onClick={() => handleOpenDetails(cita)}>
                      <p className="text-xs font-semibold text-slate-900 mb-1">{cita.servicio}</p>
                      <p className="text-xs admin-text-muted mb-2">{cita.cliente}</p>
                      <p className="text-xs admin-text-subtle mb-3">{cita.fecha}</p>
                      <div className="flex items-center justify-between">
                        <span className="admin-badge" style={{ background: getStatusColors(cita.estado).solid, color: "#ffffff" }}>{cita.estado}</span>
                        <span className="text-xs font-bold text-slate-700">{cita.precio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center admin-empty">No hay citas para este día</div>
              )}
            </div>
          </div>
        </div>

      {showDetailsModal && selectedCita && (
        <div className="admin-modal-overlay" onClick={handleCloseDetails}>
          <div className="admin-modal max-h-[90vh] overflow-y-auto" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
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

            <div className="admin-modal-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
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
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
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
            <div className="p-4 rounded-lg mb-6 bg-emerald-50 border border-emerald-200">
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
                {getGoogleMapsUrl(selectedCita.coordinates, selectedCita.mapUrl) && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <a href={getGoogleMapsUrl(selectedCita.coordinates, selectedCita.mapUrl)} target="_blank" rel="noreferrer" className="admin-btn admin-btn-secondary text-xs px-3 py-2">Abrir en Google Maps</a>
                    {getWazeUrl(selectedCita.coordinates) && <a href={getWazeUrl(selectedCita.coordinates)} target="_blank" rel="noreferrer" className="admin-btn admin-btn-primary text-xs px-3 py-2">Abrir en Waze</a>}
                  </div>
                )}
              </div>
            </div>

            {/* Descripción técnica */}
            <div className="p-4 rounded-lg mb-6 bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-gray-900 mb-2">Descripción Técnica</h3>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedCita.descripcion}</p>
            </div>

            {selectedCita.isCompleted && (
              <div className="p-4 rounded-lg mb-6 bg-emerald-50 border border-emerald-200">
                <h3 className="font-bold text-gray-900 mb-2">Observaciones de finalización</h3>
                <p className="text-sm text-gray-700 leading-relaxed">{selectedCita.completionNotes || "Sin observaciones registradas."}</p>
              </div>
            )}

            </div>
            <div className="admin-modal-footer">
              <AdminSecondaryButton type="button" onClick={handleCloseDetails}>Cerrar</AdminSecondaryButton>
              <AdminPrimaryButton type="button" onClick={() => handleOpenEdit(selectedCita)}>Editar</AdminPrimaryButton>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal max-h-[90vh] overflow-y-auto" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Editar Cita</h2>
              <button type="button" onClick={handleCloseModal} className="admin-btn admin-btn-icon admin-btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
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

            </div>
            <div className="admin-modal-footer flex-col-reverse sm:flex-row">
              <AdminSecondaryButton type="button" onClick={handleCloseModal}>Cancelar</AdminSecondaryButton>
              <AdminPrimaryButton type="button" onClick={handleSaveCita}>Guardar Cita</AdminPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
