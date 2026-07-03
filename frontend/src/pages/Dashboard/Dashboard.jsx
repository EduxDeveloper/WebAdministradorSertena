import { useState, useEffect, useMemo } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"

/**
 * Pagina del panel principal (Dashboard) - Coincide exactamente con el diseño de Sertena.
 * Cuenta con una barra lateral con efecto cristal, tarjetas superiores con colores e iconos,
 * un grafico de barras interactivo de tendencias, una lista de citas proximas
 * y una tabla de los servicios mas comprados.
 */

const DIAS_SEMANA = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

const toArray = (value) => (Array.isArray(value) ? value : [])

// Parseo robusto de precios: acepta numeros nativos, strings con formato ("$1,200.00")
// o valores nulos/indefinidos, y siempre devuelve un numero valido (nunca NaN).
const parsePrice = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0
  }
  if (value === null || value === undefined) return 0
  const digits = String(value).replace(/[^0-9]/g, "")
  if (!digits) return 0
  const parsed = parseInt(digits, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseProjectDate = (proyecto) => {
  const raw = proyecto?.dateStart
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

const formatCompact = (value) => {
  if (!Number.isFinite(value)) return "0"
  if (value >= 1000) return `${Math.round(value / 1000)}k`
  return `${Math.round(value)}`
}

// Agrupa los proyectos reales del backend en los baldes del grafico segun el periodo
// seleccionado (Semana: por dia, Mes: por semana del mes, Año: por mes).
const buildChartData = (proyectos, period, now) => {
  const validos = toArray(proyectos).filter(p => p && typeof p === "object")

  if (period === "Mes") {
    const buckets = [1, 2, 3, 4, 5].map(n => ({ day: `Sem ${n}`, value: 0 }))
    validos.forEach(p => {
      const fecha = parseProjectDate(p)
      if (!fecha || fecha.getMonth() !== now.getMonth() || fecha.getFullYear() !== now.getFullYear()) return
      const semana = Math.min(4, Math.floor((fecha.getDate() - 1) / 7))
      buckets[semana].value += parsePrice(p.finalPrice)
    })
    return buckets
  }

  if (period === "Año") {
    const buckets = MESES.map(mes => ({ day: mes, value: 0 }))
    validos.forEach(p => {
      const fecha = parseProjectDate(p)
      if (!fecha || fecha.getFullYear() !== now.getFullYear()) return
      buckets[fecha.getMonth()].value += parsePrice(p.finalPrice)
    })
    return buckets
  }

  // Semana (por defecto)
  const startOfWeek = new Date(now)
  const offset = (startOfWeek.getDay() + 6) % 7 // 0 = Lunes
  startOfWeek.setDate(startOfWeek.getDate() - offset)
  startOfWeek.setHours(0, 0, 0, 0)

  const buckets = DIAS_SEMANA.map(day => ({ day, value: 0 }))
  validos.forEach(p => {
    const fecha = parseProjectDate(p)
    if (!fecha) return
    const diffDias = Math.floor((fecha - startOfWeek) / (1000 * 60 * 60 * 24))
    if (diffDias >= 0 && diffDias < 7) {
      buckets[diffDias].value += parsePrice(p.finalPrice)
    }
  })
  return buckets
}

// --- Skeletons de carga ---

function StatCardSkeleton() {
  return (
    <div
      className="rounded-3xl p-8 flex flex-col justify-between min-h-[170px] animate-pulse"
      style={{
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/10" />
        <div className="w-16 h-6 rounded-full bg-white/10" />
      </div>
      <div>
        <div className="w-24 h-3 rounded bg-white/10 mb-2" />
        <div className="w-32 h-7 rounded bg-white/10" />
      </div>
    </div>
  )
}

function ChartSkeleton() {
  const heights = [40, 65, 50, 80, 55, 35, 60]
  return (
    <div className="flex h-56 items-end justify-between gap-3 px-2 animate-pulse">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-lg bg-white/10" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)" }}>
          <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
          <div className="flex-1">
            <div className="w-3/5 h-3 rounded bg-white/10 mb-2" />
            <div className="w-4/5 h-2.5 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <tbody className="divide-y divide-white/5 text-sm animate-pulse">
      {[...Array(4)].map((_, i) => (
        <tr key={i}>
          {[...Array(5)].map((__, j) => (
            <td key={j} className="py-4">
              <div className="h-3 rounded bg-white/10" style={{ width: j === 4 ? "60%" : "80%" }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center gap-4 rounded-3xl p-12 text-center"
      style={{
        background: "rgba(239, 68, 68, 0.08)",
        border: "1px solid rgba(239, 68, 68, 0.25)",
      }}
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "rgba(239, 68, 68, 0.18)", border: "1px solid rgba(239, 68, 68, 0.3)" }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-white mb-1">No pudimos cargar el panel</h2>
        <p className="text-sm text-white/50 max-w-md">
          Ocurrio un problema al conectar con el servidor. Verifica tu conexion e intenta nuevamente.
        </p>
      </div>
      <button
        onClick={onRetry}
        className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] cursor-pointer"
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
          boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
        }}
      >
        Reintentar
      </button>
    </div>
  )
}

export default function Dashboard() {
  const [chartPeriod, setChartPeriod] = useState("Semana")
  const [hoveredBar, setHoveredBar] = useState(null)
  const [selectedBar, setSelectedBar] = useState(null)

  const { fetchApi } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [proyectos, setProyectos] = useState([])
  const [stats, setStats] = useState({
    ventasSemanales: 0,
    reseniasPromedio: "0.0",
    reseniasTotal: 0,
    citasPendientes: 0,
    proximasCitas: [],
    serviciosPopulares: []
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    setHasError(false)
    try {
      const [proyectsResult, reviewsResult] = await Promise.allSettled([
        fetchApi("/proyects"),
        fetchApi("/reviews"),
      ])

      // Si ambas peticiones fallan no hay nada real que mostrar: se marca el error
      // general en vez de dejar el dashboard vacio o con datos inconsistentes.
      if (proyectsResult.status === "rejected" && reviewsResult.status === "rejected") {
        setHasError(true)
        return
      }

      const validProyects = toArray(
        proyectsResult.status === "fulfilled" ? proyectsResult.value : []
      ).filter(p => p && typeof p === "object")

      const validReviews = toArray(
        reviewsResult.status === "fulfilled" ? reviewsResult.value : []
      ).filter(r => r && typeof r === "object")

      const citasPendientes = validProyects.filter(p => p.status === "Pendiente").length

      const ventasSemanales = validProyects.reduce((sum, p) => sum + parsePrice(p.finalPrice), 0)

      const reseniasTotal = validReviews.length
      const reseniasPromedio = reseniasTotal > 0
        ? (validReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reseniasTotal).toFixed(1)
        : "0.0"

      const proximasCitas = validProyects
        .filter(p => p.status !== "Completado")
        .slice(0, 5)
        .map(p => ({
          title: p.idService || "Servicio Programado",
          address: p.clientLocation || "Ubicación no especificada"
        }))

      // Agrupar por idService para populares
      const serviceCounts = {}
      validProyects.forEach(p => {
        const name = p.idService || "Desconocido"
        if (!serviceCounts[name]) {
          serviceCounts[name] = { count: 0, revenue: 0 }
        }
        serviceCounts[name].count++
        serviceCounts[name].revenue += parsePrice(p.finalPrice)
      })

      const serviciosPopulares = Object.keys(serviceCounts)
        .map(name => ({
          name,
          category: "General",
          frequency: serviceCounts[name].count,
          trend: serviceCounts[name].count > 5 ? "up" : "down",
          revenue: "$" + serviceCounts[name].revenue.toLocaleString()
        }))
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 4)

      setProyectos(validProyects)
      setStats({
        ventasSemanales,
        reseniasPromedio,
        reseniasTotal,
        citasPendientes,
        proximasCitas,
        serviciosPopulares
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      setHasError(true)
    } finally {
      setLoading(false)
    }
  }

  // Datos del grafico de barras derivados de los proyectos reales, segun el periodo elegido
  const chartData = useMemo(
    () => buildChartData(proyectos, chartPeriod, new Date()),
    [proyectos, chartPeriod]
  )

  const maxChartValue = useMemo(
    () => chartData.reduce((max, d) => Math.max(max, d.value), 0),
    [chartData]
  )

  // Resalta automaticamente la barra con mayor valor cada vez que cambian los datos o el periodo
  useEffect(() => {
    if (chartData.length === 0 || maxChartValue === 0) {
      setSelectedBar(null)
      return
    }
    const topIndex = chartData.reduce(
      (best, d, i) => (d.value > chartData[best].value ? i : best),
      0
    )
    setSelectedBar(topIndex)
  }, [chartData, maxChartValue])

  return (
    <div className="relative w-full min-h-screen flex text-white bg-[#15354d]">

      {/* BARRA LATERAL - Componente reutilizable */}
      <Sidebar activeTab="Inicio" />

      {/* AREA DE CONTENIDO PRINCIPAL (Derecha) */}
      <main className="flex-1 min-w-0 min-h-screen p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Barra de encabezado */}
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="text-emerald-400 font-medium text-[15px] mb-1">
              Bienvenido! Administrador
            </div>
            <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
              Resumen General
            </h1>
            <p className="text-white/40 text-sm">
              Monitoreo de operaciones industriales en tiempo real
            </p>
          </div>

          {/* Boton de exportacion */}
          <button
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-medium transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "rgba(133, 130, 82, 0.35)",
              border: "1px solid rgba(133, 130, 82, 0.45)",
              color: "#f5f3e4",
              boxShadow: "0 4px 20px rgba(133, 130, 82, 0.1)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Exportar
          </button>
        </div>

        {hasError ? (
          <ErrorState onRetry={loadDashboardData} />
        ) : (
          <>
            {/* FILA SUPERIOR: 3 Tarjetas de estadisticas */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
              {loading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  {/* Tarjeta 1: Ventas Semanales */}
                  <div
                    className="rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[170px]"
                    style={{
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(6, 95, 70, 0.08) 100%)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: "rgba(16, 185, 129, 0.2)",
                          border: "1px solid rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <span>↗</span> +14.2%
                      </span>
                    </div>
                    <div>
                      <div className="text-white/40 text-[12px] font-semibold tracking-wider uppercase mb-1">
                        VENTAS TOTALES
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-white">${stats.ventasSemanales.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Tarjeta 2: Reseñas Nuevas */}
                  <div
                    className="rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[170px]"
                    style={{
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(30, 58, 138, 0.08) 100%)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: "rgba(59, 130, 246, 0.2)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full">
                        {stats.reseniasPromedio} promedio
                      </span>
                    </div>
                    <div>
                      <div className="text-white/40 text-[12px] font-semibold tracking-wider uppercase mb-1">
                        RESEÑAS NUEVAS
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="text-3xl font-bold tracking-tight text-white">{stats.reseniasTotal}</div>
                        {/* Diseño de calificacion de 5 estrellas */}
                        <div className="flex gap-0.5 text-blue-400 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tarjeta 3: Citas Pendientes */}
                  <div
                    className="rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:scale-[1.01] min-h-[170px]"
                    style={{
                      background: "linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(127, 29, 29, 0.08) 100%)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(239, 68, 68, 0.18)",
                    }}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{
                          background: "rgba(239, 68, 68, 0.18)",
                          border: "1px solid rgba(239, 68, 68, 0.28)",
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                      </div>
                      <span className="text-[12px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 rounded-full flex items-center gap-1">
                        ⚠️ Urgente
                      </span>
                    </div>
                    <div>
                      <div className="text-white/40 text-[12px] font-semibold tracking-wider uppercase mb-1">
                        CITAS PENDIENTES
                      </div>
                      <div className="text-3xl font-bold tracking-tight text-white mb-0.5">{stats.citasPendientes}</div>
                      <div className="text-[12px] text-white/30">Total actual</div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* FILA INTERMEDIA: Grafico de barras y Lista */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
              {/* Contenedor del grafico de barras (Ocupa 2 columnas) */}
              <div
                className="xl:col-span-2 rounded-3xl p-8 flex flex-col justify-between"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* Titulo y encabezado del grafico */}
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-0.5">Tendencias de ingreso</h3>
                  </div>
                  {/* Pestañas del selector de periodo */}
                  <div
                    className="flex p-1 rounded-xl"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    {["Semana", "Mes", "Año"].map((period) => (
                      <button
                        key={period}
                        onClick={() => setChartPeriod(period)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${chartPeriod === period
                          ? "bg-white/10 text-white shadow-sm"
                          : "text-white/40 hover:text-white/80"
                          }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Diseño grafico del grafico de barras */}
                <div className="flex flex-col">
                  {loading ? (
                    <ChartSkeleton />
                  ) : maxChartValue === 0 ? (
                    <div className="flex h-56 items-center justify-center">
                      <p className="text-sm text-white/40">No hay datos disponibles para este periodo</p>
                    </div>
                  ) : (
                    <div className="flex h-56 items-end justify-between relative px-2">
                      {/* Lineas horizontales de cuadricula de referencia */}
                      <div className="absolute inset-x-0 bottom-[25%] border-b border-white/5 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-[50%] border-b border-white/5 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-[75%] border-b border-white/5 pointer-events-none" />

                      {/* Etiquetas de referencia del eje Y (Lado izquierdo) */}
                      <div className="absolute left-[-16px] bottom-[25%] translate-y-[50%] text-[10px] text-white/30 font-semibold">{formatCompact(maxChartValue * 0.25)}</div>
                      <div className="absolute left-[-16px] bottom-[50%] translate-y-[50%] text-[10px] text-white/30 font-semibold">{formatCompact(maxChartValue * 0.5)}</div>
                      <div className="absolute left-[-16px] bottom-[75%] translate-y-[50%] text-[10px] text-white/30 font-semibold">{formatCompact(maxChartValue * 0.75)}</div>
                      <div className="absolute left-[-20px] bottom-[98%] translate-y-[50%] text-[10px] text-white/30 font-semibold">{formatCompact(maxChartValue)}</div>

                      {/* Columnas del grafico de barras */}
                      {chartData.map((data, index) => {
                        const percentage = (data.value / maxChartValue) * 100
                        const isHovered = hoveredBar === index
                        const isHighlight = selectedBar === index

                        return (
                          <div
                            key={data.day}
                            className="flex-1 h-full flex flex-col items-center justify-end group relative cursor-pointer"
                            onMouseEnter={() => setHoveredBar(index)}
                            onMouseLeave={() => setHoveredBar(null)}
                            onClick={() => setSelectedBar(index)}
                          >
                            {/* Informacion emergente al pasar el cursor */}
                            <div
                              className={`absolute top-0 -translate-y-full mb-2 bg-black/90 border border-white/15 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-200 pointer-events-none ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"
                                }`}
                              style={{ zIndex: 5 }}
                            >
                              ${data.value.toLocaleString()}
                            </div>

                            {/* Contenedor de la columna para asegurar que la altura se calcule correctamente */}
                            <div className="w-full h-full flex items-end justify-center">
                              <div
                                className="w-12 rounded-t-lg transition-all duration-300 relative"
                                style={{
                                  height: `${percentage}%`,
                                  background: isHighlight
                                    ? "linear-gradient(180deg, #10b981 0%, rgba(16, 185, 129, 0.4) 100%)"
                                    : "rgba(255, 255, 255, 0.08)",
                                  border: isHighlight
                                    ? "1px solid rgba(16, 185, 129, 0.4)"
                                    : "1px solid rgba(255, 255, 255, 0.05)",
                                  boxShadow: isHighlight
                                    ? "0 4px 20px rgba(16, 185, 129, 0.25)"
                                    : "none",
                                }}
                              />
                            </div>

                            {/* Etiqueta del eje X de la barra */}
                            <span className="text-[11px] text-white/40 font-semibold mt-3 shrink-0">
                              {data.day}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Tarjeta derecha: Proximas Citas */}
              <div
                className="rounded-3xl p-8 flex flex-col justify-between"
                style={{
                  background: "rgba(255, 255, 255, 0.03)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-4">Proximas citas</h3>

                  {/* Listas de citas */}
                  {loading ? (
                    <ListSkeleton />
                  ) : (
                    <div className="flex flex-col gap-4">
                      {stats.proximasCitas.length > 0 ? stats.proximasCitas.map((cita, i) => (
                        <div
                          key={i}
                          className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-300"
                          style={{
                            background: "rgba(255,255,255,0.01)",
                            border: "1px solid rgba(255,255,255,0.03)",
                          }}
                        >
                          {/* Circulo con icono de reloj/calendario */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                            }}
                          >
                            {/* Icono de reloj con dos puntos arriba */}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </div>

                          {/* Texto de los detalles de la cita */}
                          <div>
                            <h4 className="text-sm font-semibold text-white/95 mb-0.5">{cita.title}</h4>
                            <p className="text-[11px] text-white/35 leading-normal">{cita.address}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="text-sm text-white/50 text-center py-4">No hay próximas citas</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FILA INFERIOR: Servicios Mas Comprados */}
            <div
              className="rounded-3xl p-8 w-full mb-4"
              style={{
                background: "rgba(255, 255, 255, 0.03)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              <h3 className="text-lg font-bold text-white mb-5">Servicios mas comprados</h3>

              {/* Contenedor de la tabla */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[12px] text-white/40 tracking-wider uppercase font-semibold">
                      <th className="pb-4 font-semibold">Servicio</th>
                      <th className="pb-4 font-semibold">Categoria</th>
                      <th className="pb-4 font-semibold">Frecuencia</th>
                      <th className="pb-4 font-semibold">Tendencia</th>
                      <th className="pb-4 font-semibold text-right">Ingresos estimados</th>
                    </tr>
                  </thead>
                  {loading ? (
                    <TableSkeleton />
                  ) : (
                    <tbody className="divide-y divide-white/5 text-sm">
                      {stats.serviciosPopulares.length > 0 ? stats.serviciosPopulares.map((service, index) => (
                        <tr key={index} className="hover:bg-white/[0.02] transition-colors duration-200">
                          <td className="py-4 font-medium text-white/90">{service.name}</td>
                          <td className="py-4">
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-medium"
                              style={{
                                background: "rgba(255,255,255,0.05)",
                                border: "1px solid rgba(255,255,255,0.05)",
                              }}
                            >
                              {service.category}
                            </span>
                          </td>
                          <td className="py-4 text-white/70">{service.frequency} ordenes</td>
                          <td className="py-4">
                            {service.trend === "up" ? (
                              <span className="text-emerald-400 flex items-center gap-1 text-xs font-bold">
                                <span>▲</span> Alza
                              </span>
                            ) : (
                              <span className="text-rose-400 flex items-center gap-1 text-xs font-bold">
                                <span>▼</span> Baja
                              </span>
                            )}
                          </td>
                          <td className="py-4 text-right font-bold text-white/95">{service.revenue}</td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="py-4 text-center text-white/50">No hay servicios registrados</td>
                        </tr>
                      )}
                    </tbody>
                  )}
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
