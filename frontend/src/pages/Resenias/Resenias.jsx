import { useState, useEffect } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"
import Swal from 'sweetalert2'

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
  const { fetchApi } = useAuth()

  // Cargar reseñas al montar y cuando cambie pagina/limite
  useEffect(() => {
    loadResenias()
  }, [page, limit])

  const loadResenias = async () => {
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
      await fetchApi(`/reviews/${id}`, { method: "DELETE" })
      Swal.fire({
        title: '¡Eliminado!',
        text: 'La reseña ha sido eliminada.',
        icon: 'success',
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: '#00E9E9'
      })
      loadResenias()
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

  // Calcular el rating promedio
  // Calcular el rating promedio
  const ratingPromedio = resenias.length > 0 
    ? (resenias.reduce((acc, r) => acc + (r.rating || 0), 0) / resenias.length).toFixed(1)
    : "0.0"

  // Contar reseñas por estrellas
  const reseniasTotales = resenias.length
  const reseniasPositivas = resenias.filter(r => r.rating >= 4).length

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
            stroke={i < rating ? "#fbbf24" : "rgba(255,255,255,0.3)"}
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

  return (
    <div className="relative w-full min-h-screen flex text-white bg-[#15354d]">

      {/* BARRA LATERAL - Componente reutilizable */}
      <Sidebar activeTab="Reseñas" />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 min-h-screen p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Encabezado */}
        <div>
          <div className="text-emerald-400 font-medium text-[15px] mb-1">
            Bienvenido! Administrador
          </div>
          <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
            Gestión de Reseñas
          </h1>
          <p className="text-white/40 text-sm">
            Apartado administrativo de Reseñas
          </p>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {/* Tarjeta: Rating Promedio */}
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
                background: "rgba(251, 191, 36, 0.2)",
                border: "1px solid rgba(251, 191, 36, 0.3)",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fbbf24" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Calificación Promedio</p>
              <p className="text-2xl font-bold text-white">{ratingPromedio}</p>
            </div>
          </div>

          {/* Tarjeta: Total Reseñas */}
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Total Reseñas</p>
              <p className="text-2xl font-bold text-white">{reseniasTotales}</p>
            </div>
          </div>

          {/* Tarjeta: Tendencias Mensuales */}
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
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 17" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs font-medium">Tendencias Mensuales</p>
              <p className="text-2xl font-bold text-white">{incrementoMensual}</p>
            </div>
          </div>
        </div>

        {/* Tabla de reseñas */}
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
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Cliente</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Rating</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide">Comentarios</th>
                  <th className="px-6 py-5 text-[13px] text-white/70 font-semibold tracking-wide text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-5 text-center text-white/50">Cargando reseñas...</td>
                  </tr>
                ) : resenias.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-5 text-center text-white/50">No hay reseñas registradas</td>
                  </tr>
                ) : (
                  resenias.map((resenia) => (
                    <tr
                      key={resenia._id}
                      className="hover:bg-white/[0.03] transition-colors duration-200"
                    >
                      <td className="px-6 py-5 text-sm font-medium text-white/90">{resenia.idCustomer || "Cliente Anónimo"}</td>
                      <td className="px-6 py-5 text-sm">
                        {renderStars(resenia.rating)}
                      </td>
                      <td className="px-6 py-5 text-sm text-white/60">
                        {resenia.comment}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <button
                          onClick={() => handleDeleteResenia(resenia._id)}
                          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-red-500/20 cursor-pointer ml-auto"
                          style={{
                            background: "rgba(255, 255, 255, 0.08)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                          }}
                          title="Eliminar reseña"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <option value={4} className="text-black">4</option>
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
    </div>
  )
}
