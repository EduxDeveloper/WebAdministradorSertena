import { useState, useEffect, useMemo } from "react"
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton, AdminStatCard, AdminStatGrid } from "../../components/ui/AdminLayout"
import useAuth from "../../hooks/useAuth"

/**
 * Pagina del panel principal (Dashboard) - Coincide exactamente con el diseño de Sertena.
 * Cuenta con una barra lateral con efecto cristal, tarjetas superiores con colores e iconos,
 * un grafico de barras interactivo de tendencias, una lista de citas proximas
 * y una tabla de los servicios mas comprados.
 */

const DIAS_SEMANA = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"]
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

// Fuerza cualquier respuesta de la API a un array real, para no romper .map/.filter/.reduce
// si el backend devuelve null, un objeto de error, o cualquier otra cosa inesperada.
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

// Convierte el campo dateStart del proyecto a un Date valido, o null si no existe / es invalido.
const parseProjectDate = (proyecto) => {
  const raw = proyecto?.dateStart
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date
}

// Formatea numeros grandes para las etiquetas del eje Y del grafico (ej. 92000 -> "92k").
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
    <div className="admin-stat-card animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="w-11 h-11 rounded-lg bg-slate-200" />
        <div className="w-16 h-6 rounded-full bg-slate-200" />
      </div>
      <div>
        <div className="w-24 h-3 rounded bg-slate-200 mb-2" />
        <div className="w-32 h-7 rounded bg-slate-200" />
      </div>
    </div>
  )
}

function ChartSkeleton() {
  const heights = [40, 65, 50, 80, 55, 35, 60]
  return (
    <div className="flex h-56 items-end justify-between gap-3 px-2 animate-pulse">
      {heights.map((h, i) => (
        <div key={i} className="flex-1 rounded-t-md bg-slate-200" style={{ height: `${h}%` }} />
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex gap-4 p-3 rounded-lg border border-slate-100">
          <div className="w-10 h-10 rounded-lg bg-slate-200 flex-shrink-0" />
          <div className="flex-1">
            <div className="w-3/5 h-3 rounded bg-slate-200 mb-2" />
            <div className="w-4/5 h-2.5 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}

function TableSkeleton() {
  return (
    <tbody className="animate-pulse">
      {[...Array(4)].map((_, i) => (
        <tr key={i}>
          {[...Array(5)].map((__, j) => (
            <td key={j} className="py-4">
              <div className="h-3 rounded bg-slate-200" style={{ width: j === 4 ? "60%" : "80%" }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  )
}

function ErrorState({ onRetry }) {
  return (
    <div className="admin-card admin-card-padded flex-1 flex flex-col items-center justify-center gap-4 p-12 text-center border-red-200 bg-red-50">
      <div className="admin-icon-box admin-icon-box--red w-14 h-14">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">No pudimos cargar el panel</h2>
        <p className="text-sm admin-text-muted max-w-md">
          Ocurrio un problema al conectar con el servidor. Verifica tu conexion e intenta nuevamente.
        </p>
      </div>
      <AdminPrimaryButton onClick={onRetry}>Reintentar</AdminPrimaryButton>
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
    citasProgramadas: 0,
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

      const citasProgramadas = validProyects.filter(p => p.status === "Programado").length

      const ventasSemanales = validProyects.reduce((sum, p) => sum + parsePrice(p.finalPrice), 0)

      const reseniasTotal = validReviews.length
      const reseniasPromedio = reseniasTotal > 0
        ? (validReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reseniasTotal).toFixed(1)
        : "0.0"

      const proximasCitas = validProyects
        .filter(p => p.status !== "Finalizado")
        .slice(0, 5)
        .map(p => ({
          title: p.idService?.nameService || (typeof p.idService === 'string' ? p.idService : "Servicio Programado"),
          address: p.clientLocation || "Ubicación no especificada"
        }))

      // Agrupar por idService para populares
      const serviceCounts = {}
      validProyects.forEach(p => {
        const name = p.idService?.nameService || (typeof p.idService === 'string' ? p.idService : "Desconocido")
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
        citasProgramadas,
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
    <AdminLayout activeTab="Inicio">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Resumen General"
          description="Monitoreo de operaciones industriales en tiempo real"
          action={
            <AdminSecondaryButton>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Exportar
            </AdminSecondaryButton>
          }
        />

        {hasError ? (
          <ErrorState onRetry={loadDashboardData} />
        ) : (
          <>
            <AdminStatGrid columns={3}>
              {loading ? (
                <>
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                  <StatCardSkeleton />
                </>
              ) : (
                <>
                  <AdminStatCard
                    label="Ventas totales"
                    value={`$${stats.ventasSemanales.toLocaleString()}`}
                    iconTone="green"
                    badge={<span className="admin-badge admin-badge--green"><span>↗</span> +14.2%</span>}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                    }
                  />
                  <AdminStatCard
                    label="Reseñas nuevas"
                    value={stats.reseniasTotal}
                    iconTone="blue"
                    badge={<span className="admin-badge admin-badge--blue">{stats.reseniasPromedio} promedio</span>}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    }
                  />
                  <AdminStatCard
                    label="Citas programadas"
                    value={stats.citasProgramadas}
                    iconTone="red"
                    badge={<span className="admin-badge admin-badge--amber">Urgente</span>}
                    footer="Total actual"
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    }
                  />
                </>
              )}
            </AdminStatGrid>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 w-full">
              <div className="xl:col-span-2 admin-card admin-card-padded flex flex-col justify-between">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-semibold text-slate-900">Tendencias de ingreso</h3>
                  <div className="admin-tabs">
                    {["Semana", "Mes", "Año"].map((period) => (
                      <button
                        key={period}
                        onClick={() => setChartPeriod(period)}
                        className={`admin-tab ${chartPeriod === period ? "admin-tab--active" : ""}`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  {loading ? (
                    <ChartSkeleton />
                  ) : maxChartValue === 0 ? (
                    <div className="flex h-56 items-center justify-center">
                      <p className="text-sm admin-text-muted">No hay datos disponibles para este periodo</p>
                    </div>
                  ) : (
                    <div className="flex h-56 items-end justify-between relative px-2">
                      <div className="absolute inset-x-0 bottom-[25%] border-b border-slate-100 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-[50%] border-b border-slate-100 pointer-events-none" />
                      <div className="absolute inset-x-0 bottom-[75%] border-b border-slate-100 pointer-events-none" />

                      <div className="absolute left-[-16px] bottom-[25%] translate-y-[50%] text-[10px] text-slate-400 font-medium">{formatCompact(maxChartValue * 0.25)}</div>
                      <div className="absolute left-[-16px] bottom-[50%] translate-y-[50%] text-[10px] text-slate-400 font-medium">{formatCompact(maxChartValue * 0.5)}</div>
                      <div className="absolute left-[-16px] bottom-[75%] translate-y-[50%] text-[10px] text-slate-400 font-medium">{formatCompact(maxChartValue * 0.75)}</div>
                      <div className="absolute left-[-20px] bottom-[98%] translate-y-[50%] text-[10px] text-slate-400 font-medium">{formatCompact(maxChartValue)}</div>

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
                            <div
                              className={`absolute top-0 -translate-y-full mb-2 bg-slate-800 text-white px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-200 pointer-events-none ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                              style={{ zIndex: 5 }}
                            >
                              ${data.value.toLocaleString()}
                            </div>

                            <div className="w-full h-full flex items-end justify-center">
                              <div
                                className={`admin-chart-bar ${isHighlight ? "admin-chart-bar--active" : "admin-chart-bar--inactive"}`}
                                style={{ height: `${percentage}%` }}
                              />
                            </div>

                            <span className="text-[11px] text-slate-500 font-medium mt-3 shrink-0">
                              {data.day}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-card admin-card-padded flex flex-col justify-between">
                <div className="mb-4">
                  <h3 className="text-base font-semibold text-slate-900 mb-4">Proximas citas</h3>

                  {loading ? (
                    <ListSkeleton />
                  ) : (
                    <div className="flex flex-col gap-3">
                      {stats.proximasCitas.length > 0 ? stats.proximasCitas.map((cita, i) => (
                        <div key={i} className="admin-list-item">
                          <div className="admin-icon-box admin-icon-box--slate w-10 h-10 flex-shrink-0">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-slate-800 mb-0.5">{cita.title}</h4>
                            <p className="text-[11px] admin-text-muted leading-normal">{cita.address}</p>
                          </div>
                        </div>
                      )) : (
                        <p className="admin-empty">No hay próximas citas</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="admin-card admin-card-padded w-full mb-4">
              <h3 className="text-base font-semibold text-slate-900 mb-5">Servicios mas comprados</h3>

              <div className="admin-table-wrap">
                <div className="overflow-x-auto w-full">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Servicio</th>
                        <th>Categoria</th>
                        <th>Frecuencia</th>
                        <th>Tendencia</th>
                        <th className="text-right">Ingresos estimados</th>
                      </tr>
                    </thead>
                    {loading ? (
                      <TableSkeleton />
                    ) : (
                      <tbody>
                        {stats.serviciosPopulares.length > 0 ? stats.serviciosPopulares.map((service, index) => (
                          <tr key={index}>
                            <td className="font-medium text-slate-800">{service.name}</td>
                            <td>
                              <span className="admin-badge admin-badge--slate">{service.category}</span>
                            </td>
                            <td>{service.frequency} ordenes</td>
                            <td>
                              {service.trend === "up" ? (
                                <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold">
                                  <span>▲</span> Alza
                                </span>
                              ) : (
                                <span className="text-red-500 flex items-center gap-1 text-xs font-semibold">
                                  <span>▼</span> Baja
                                </span>
                              )}
                            </td>
                            <td className="text-right font-semibold text-slate-900">{service.revenue}</td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan="5" className="admin-empty">No hay servicios registrados</td>
                          </tr>
                        )}
                      </tbody>
                    )}
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
    </AdminLayout>
  )
}
