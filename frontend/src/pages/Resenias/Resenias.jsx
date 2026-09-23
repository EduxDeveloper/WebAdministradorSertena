import { useState, useEffect } from "react"
import AdminLayout, { AdminPageHeader, AdminStatCard, AdminStatGrid } from "../../components/ui/AdminLayout"
import useAuth from "../../hooks/useAuth"
import Swal from 'sweetalert2'
import ViewModeToggle from "../../components/ui/ViewModeToggle"
import { CardsLoadingGrid, TableLoadingRows } from "../../components/ui/LoadingSkeleton"

/**
 * Pagina de Gestión de Reseñas - Muestra las reseñas de clientes sobre servicios
 * con rating, comentarios y estadísticas. Permite eliminar reseñas.
 */
export default function Resenias() {
  const [resenias, setResenias] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(4)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState("list")
  const { fetchApi } = useAuth()

  // Cargar reseñas al montar y cuando cambie pagina/limite
  useEffect(() => {
    loadResenias()
  }, [page, limit])

  async function loadResenias() {
    try {
      setLoading(true)
      const data = await fetchApi(`/reviews/paginado?page=${page}&limit=${limit}`)
      if (data && data.data) {
        setResenias(data.data)
        setTotalPages(data.totalPages)
        setTotal(data.total)
      } else {
        setResenias([])
      }
    } catch (error) {
      console.error("Error al cargar reseñas:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteResenia = async (id) => {
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
      await fetchApi(`/reviews/${id}`, { method: "DELETE" })
      Swal.fire({
        title: '¡Eliminado!',
        text: 'La reseña ha sido eliminada.',
        icon: 'success',
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: '#0d9488'
      })
      loadResenias()
    } catch (error) {
      console.error("Error al eliminar:", error)
      Swal.fire({
        title: "Error",
        text: "Hubo un error al eliminar",
        icon: "error",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#00E9E9"
      })
    }
  }

  // Calcular el rating promedio
  // Calcular el rating promedio
  const ratingPromedio = resenias.length > 0 
    ? (resenias.reduce((acc, r) => acc + (r.rating || 0), 0) / resenias.length).toFixed(1)
    : "0.0"

  // Contar reseñas por estrellas
  const reseniasTotales = resenias.length

  // Calcular porcentaje de incremento (dummy)
  const incrementoMensual = "+12%"

  // Renderizar estrellas
  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={i < rating ? "#fbbf24" : "none"}
            stroke={i < rating ? "#fbbf24" : "#cbd5e1"}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
    )
  }

  const getCustomerName = (customer) => {
    if (!customer || typeof customer === "string") return "Cliente eliminado"
    return customer.nombre || customer.name || "Cliente sin nombre"
  }

  return (
    <AdminLayout activeTab="Reseñas">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Gestión de Reseñas"
          description="Apartado administrativo de Reseñas"
        />

        <AdminStatGrid columns={3}>
          <AdminStatCard
            label="Calificación Promedio"
            value={ratingPromedio}
            iconTone="amber"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
          <AdminStatCard
            label="Total Reseñas"
            value={reseniasTotales}
            iconTone="blue"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
          <AdminStatCard
            label="Tendencias Mensuales"
            value={incrementoMensual}
            iconTone="green"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 17" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            }
          />
        </AdminStatGrid>

        <div className="flex justify-end">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Tabla de reseñas */}
        <div className={`admin-card admin-table-wrap ${viewMode === "list" ? "" : "hidden"}`}>
          <div className="overflow-x-auto w-full">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Rating</th>
                  <th>Comentarios</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <TableLoadingRows columns={4} />
                ) : resenias.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="admin-empty">No hay reseñas registradas</td>
                  </tr>
                ) : (
                  resenias.map((resenia) => (
                    <tr key={resenia._id}>
                      <td className="font-medium text-slate-900">{getCustomerName(resenia.idCustomer)}</td>
                      <td>{renderStars(resenia.rating)}</td>
                      <td className="admin-text-muted">{resenia.comment}</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteResenia(resenia._id)}
                          className="admin-btn admin-btn-icon admin-btn-danger ml-auto"
                          title="Eliminar reseña"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
            {loading ? (
              <CardsLoadingGrid />
            ) : resenias.length === 0 ? (
              <p className="col-span-full admin-empty">No hay reseñas registradas</p>
            ) : resenias.map((resenia) => (
              <article key={resenia._id} className="admin-card admin-card-padded">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{getCustomerName(resenia.idCustomer)}</h3>
                    <div className="mt-2">{renderStars(resenia.rating)}</div>
                  </div>
                  <button type="button" onClick={() => handleDeleteResenia(resenia._id)} className="admin-btn admin-btn-danger text-xs px-3 py-2">Eliminar</button>
                </div>
                <p className="mt-4 text-sm leading-relaxed admin-text-muted">{resenia.comment || "Sin comentario"}</p>
              </article>
            ))}
          </div>
        )}

        <div className="admin-pagination">
          <div className="admin-pagination-size">
            <span>Mostrar</span>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value))
                setPage(1)
              }}
              className="admin-input w-auto py-1 px-2"
            >
              <option value={4}>4</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>registros</span>
          </div>
          <div className="admin-pagination-controls">
            <span className="admin-pagination-status">Página {page} de {totalPages || 1} ({total} en total)</span>
            <div className="admin-pagination-buttons">
              <button
                type="button"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="admin-btn admin-btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || totalPages === 0}
                className="admin-btn admin-btn-secondary px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

    </AdminLayout>
  )
}
