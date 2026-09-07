import { useState, useEffect, useRef } from "react"
import AdminLayout, { AdminPageHeader, AdminPrimaryButton, AdminSecondaryButton } from "../../components/ui/AdminLayout"
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"
import ViewModeToggle from "../../components/ui/ViewModeToggle"
import { ServiceCardsLoadingGrid, TableLoadingRows } from "../../components/ui/LoadingSkeleton"

/**
 * Pagina del Catalogo de Servicios - Muestra tarjetas de servicios con imagen,
 * nombre, descripcion y tarifa base. Incluye modal para agregar nuevos servicios.
 */
export default function Servicios() {
  const [showModal, setShowModal] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const fileInputRef = useRef(null)
  
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState("cards")
  const { fetchApi } = useAuth()

  // Estado del formulario del modal
  const [formData, setFormData] = useState({
    nameService: "",
    price: "",
    description: "",
    image: null,
    imagenPreview: null,
    activo: true,
  })

  const loadServicios = async () => {
    try {
      setLoading(true)
      const data = await fetchApi("/services")
      setServicios(data || [])
    } catch (error) {
      console.error("Error al cargar servicios:", error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar servicios al montar
  useEffect(() => {
    loadServicios()
  }, [])

  // Manejo de drag and drop para la imagen
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0])
    }
  }

  const handleImageFile = (file) => {
    if (!file) return

    // VALIDACION: solo se permiten imagenes PNG o JPEG
    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      alert("Solo se permiten imagenes en formato PNG o JPG.")
      return
    }

    // VALIDACION: tamaño maximo de 10MB (coincide con el texto mostrado en la UI)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024
    if (file.size > MAX_SIZE_BYTES) {
      alert("La imagen no debe superar los 10MB.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setFormData(prev => ({ ...prev, image: file, imagenPreview: e.target.result }))
    }
    reader.readAsDataURL(file)
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0])
    }
  }

  const resetForm = () => {
    setFormData({ nameService: "", price: "", description: "", image: null, imagenPreview: null, activo: true })
    setEditingId(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    resetForm()
  }

  const handleEditServicio = (servicio) => {
    setFormData({
      nameService: servicio.nameService || "",
      price: servicio.price || "",
      description: servicio.description || "",
      image: servicio.imgUrl, // keep url as indicator it has an image
      imagenPreview: servicio.imgUrl,
      activo: servicio.status !== undefined ? servicio.status : true,
    })
    setEditingId(servicio._id)
    setShowModal(true)
  }

  const handleSaveServicio = async () => {
    if (!formData.nameService || !formData.price || !formData.description) {
      Swal.fire({
        title: "Campos Incompletos",
        text: "Por favor llena todos los campos (Nombre, Tarifa, Descripción).",
        icon: "warning",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488"
      })
      return
    }

    if (!formData.image && !editingId) {
      Swal.fire({
        title: "Imagen Requerida",
        text: "Por favor selecciona una imagen para el servicio.",
        icon: "warning",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488"
      })
      return
    }

    try {
      const form = new FormData()
      form.append("nameService", formData.nameService)
      form.append("price", formData.price)
      form.append("description", formData.description)
      form.append("status", formData.activo)
      // Solo hacer append de la imagen si es un archivo nuevo (objeto File)
      if (formData.image instanceof File) {
        form.append("image", formData.image)
      }

      if (editingId) {
        await fetchApi(`/services/${editingId}`, {
          method: "PUT",
          body: form,
        })
      } else {
        await fetchApi("/services", {
          method: "POST",
          body: form,
        })
      }

      Swal.fire({
        title: "¡Éxito!",
        text: editingId ? "Servicio actualizado correctamente" : "Servicio creado correctamente",
        icon: "success",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488"
      })

      handleCloseModal()
      loadServicios()
    } catch (error) {
      console.error("Error al guardar servicio:", error)
      Swal.fire({
        title: "Error",
        text: "Error al guardar: " + error.message,
        icon: "error",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488"
      })
    }
  }

  const handleDeleteServicio = async (id) => {
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
      await fetchApi(`/services/${id}`, { method: "DELETE" })
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El servicio ha sido eliminado.',
        icon: 'success',
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: '#0d9488'
      })
      loadServicios()
    } catch (error) {
      console.error("Error al eliminar servicio:", error)
      Swal.fire({
        title: "Error",
        text: "Error al eliminar: " + error.message,
        icon: "error",
        background: "#ffffff",
        color: "#0f172a",
        confirmButtonColor: "#0d9488"
      })
    }
  }

  return (
    <AdminLayout activeTab="Servicios">
        <AdminPageHeader
          eyebrow="Bienvenido, Administrador"
          title="Catalogo de Servicios"
          description="Gestione la variedad de servicios que ofrece con su respectivo precio base"
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

        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full ${viewMode === "cards" ? "" : "hidden"}`}>
          {loading ? (
            <ServiceCardsLoadingGrid />
          ) : servicios.length === 0 ? (
            <div className="col-span-full admin-empty">No hay servicios registrados</div>
          ) : (
            servicios.map((servicio) => (
              <div key={servicio._id} className="admin-service-card flex flex-col">
                <div className="w-full h-[200px] overflow-hidden relative shrink-0">
                  <img src={servicio.imgUrl} alt={servicio.nameService} className="w-full h-full object-cover" />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-base font-bold text-slate-900">{servicio.nameService}</h3>
                    <span className={`admin-badge ${servicio.status !== false ? "admin-badge--green" : "admin-badge--red"}`}>
                      {(servicio.status !== false) ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-sm admin-text-muted leading-relaxed mb-4 flex-1">{servicio.description}</p>
                  <div className="border-t border-slate-200 mb-4" />
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs admin-text-muted font-medium">Tarifa Base</div>
                      <div className="text-teal-600 font-bold text-base">${servicio.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEditServicio(servicio)} className="admin-btn admin-btn-icon admin-btn-secondary" title="Editar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button type="button" onClick={() => handleDeleteServicio(servicio._id)} className="admin-btn admin-btn-icon admin-btn-danger" title="Eliminar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          <line x1="10" y1="11" x2="10" y2="17"></line>
                          <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {viewMode === "list" && (
          <div className="admin-card admin-table-wrap">
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Servicio</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? <TableLoadingRows columns={5} /> : servicios.length === 0 ? (
                    <tr><td colSpan="5" className="admin-empty">No hay servicios registrados</td></tr>
                  ) : servicios.map((servicio) => (
                    <tr key={servicio._id}>
                      <td><div className="flex items-center gap-3"><img src={servicio.imgUrl} alt="" className="w-10 h-10 rounded-lg object-cover" /><span className="font-semibold text-slate-900">{servicio.nameService}</span></div></td>
                      <td className="admin-text-muted max-w-xs truncate">{servicio.description}</td>
                      <td className="text-teal-600 font-semibold">${servicio.price}</td>
                      <td><span className={`admin-badge ${servicio.status !== false ? "admin-badge--green" : "admin-badge--red"}`}>{servicio.status !== false ? "Activo" : "Inactivo"}</span></td>
                      <td className="text-right space-x-2">
                        <button type="button" onClick={() => handleEditServicio(servicio)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">Editar</button>
                        <button type="button" onClick={() => handleDeleteServicio(servicio._id)} className="text-sm text-red-600 hover:text-red-700 font-medium">Eliminar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {showModal && (
        <div className="admin-modal-overlay" onClick={handleCloseModal}>
          <div className="admin-modal" style={{ maxWidth: "620px" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{editingId ? "Editar Servicio" : "Agregar Nuevo Servicio"}</h2>
              <button type="button" onClick={handleCloseModal} className="admin-btn admin-btn-icon admin-btn-secondary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="grid grid-cols-2 gap-4 mb-5">
                <label className="admin-label">Nombre
                  <input type="text" value={formData.nameService} onChange={(e) => setFormData(prev => ({ ...prev, nameService: e.target.value }))} className="admin-input" />
                </label>
                <label className="admin-label">Tarifa Base
                  <input type="number" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))} className="admin-input" />
                </label>
              </div>
              <label className="admin-label mb-5 block">Descripción
                <textarea rows={4} value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="admin-input resize-none" />
              </label>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <label className="admin-label mb-2 block">Cargar Imagen del Servicio</label>
                  <div
                    className="rounded-lg flex flex-col items-center justify-center cursor-pointer relative overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50"
                    style={{ minHeight: "150px", borderColor: dragActive ? "#0d9488" : undefined, background: dragActive ? "#ecfdf5" : undefined }}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.imagenPreview ? (
                      <img src={formData.imagenPreview} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                      <>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        <p className="text-xs admin-text-muted text-center px-4">Arrastra y suelta una imagen aquí, o explora</p>
                        <p className="text-[10px] admin-text-subtle mt-1">PNG, JPG hasta 10MB</p>
                      </>
                    )}
                    <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleFileInput} />
                  </div>
                </div>
                <div className="flex flex-col items-start justify-center pl-2">
                  <h3 className="text-base font-bold text-slate-900 mb-1">Estado Del Servicio</h3>
                  <p className="text-xs admin-text-muted mb-4">¿Esta activo este servicio?</p>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))} className="relative w-14 h-7 rounded-full transition-colors cursor-pointer" style={{ background: formData.activo ? "#0d9488" : "#cbd5e1" }}>
                      <div className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300" style={{ left: formData.activo ? "calc(100% - 26px)" : "2px" }} />
                    </button>
                    <span className={`text-sm font-medium ${formData.activo ? "text-emerald-600" : "admin-text-muted"}`}>{formData.activo ? "Estado Activo" : "Inactivo"}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <AdminSecondaryButton onClick={handleCloseModal}>Cancelar</AdminSecondaryButton>
              <AdminPrimaryButton onClick={handleSaveServicio}>{editingId ? "Actualizar Servicio" : "Guardar Servicio"}</AdminPrimaryButton>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
