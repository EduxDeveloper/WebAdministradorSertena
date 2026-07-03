import { useState, useEffect, useRef } from "react"
import Sidebar from "../../components/ui/Sidebar"
import useAuth from "../../hooks/useAuth"
import Swal from "sweetalert2"

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

  // Cargar servicios al montar
  useEffect(() => {
    loadServicios()
  }, [])

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

    // VALIDACION: nombre del servicio requerido y con longitud razonable
    const nombre = formData.nameService.trim()
    if (!nombre) {
      alert("El nombre del servicio es obligatorio.")
      return
    }
    if (nombre.length < 3 || nombre.length > 50) {
      alert("El nombre del servicio debe tener entre 3 y 50 caracteres.")
      return
    }

    // VALIDACION: descripcion requerida
    const descripcion = formData.description.trim()
    if (!descripcion) {
      alert("La descripcion del servicio es obligatoria.")
      return
    }

    // VALIDACION: tarifa requerida, numerica y mayor a cero
    const precio = Number(formData.price)
    if (formData.price === "" || Number.isNaN(precio)) {
      alert("Ingrese una tarifa base valida.")
      return
    }
    if (precio <= 0) {
      alert("La tarifa base debe ser mayor a cero.")
      return
    }

    // VALIDACION: imagen requerida
    if (!formData.image) {
      alert("Por favor selecciona una imagen para el servicio.")
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
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: "#00E9E9"
      })

      handleCloseModal()
      loadServicios()
    } catch (error) {
      console.error("Error al guardar servicio:", error)
      Swal.fire({
        title: "Error",
        text: "Error al guardar: " + error.message,
        icon: "error",
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: "#00E9E9"
      })
    }
  }

  const handleDeleteServicio = async (id) => {
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
      await fetchApi(`/services/${id}`, { method: "DELETE" })
      Swal.fire({
        title: '¡Eliminado!',
        text: 'El servicio ha sido eliminado.',
        icon: 'success',
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: '#00E9E9'
      })
      loadServicios()
    } catch (error) {
      console.error("Error al eliminar servicio:", error)
      Swal.fire({
        title: "Error",
        text: "Error al eliminar: " + error.message,
        icon: "error",
        background: "#001a1a",
        color: "#fff",
        confirmButtonColor: "#00E9E9"
      })
    }
  }

  return (
    <div className="relative w-full min-h-screen flex text-white bg-[#15354d]">

      {/* BARRA LATERAL - Componente reutilizable */}
      <Sidebar activeTab="Servicios" />

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 min-w-0 min-h-screen p-8 relative flex flex-col gap-6" style={{ zIndex: 10 }}>
        {/* Encabezado */}
        <div className="flex items-start justify-between w-full">
          <div>
            <div className="text-emerald-400 font-medium text-[15px] mb-1">
              Bienvenido! Administrador
            </div>
            <h1 className="text-3xl md:text-[38px] font-bold tracking-tight text-white mb-2 leading-none">
              Catalogo de Servicios
            </h1>
            <p className="text-white/40 text-sm">
              Gestione la variedad de servicios que ofrece con su respectivo precio base
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

        {/* Grid de tarjetas de servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          {loading ? (
            <div className="col-span-full text-center text-white/50">Cargando servicios...</div>
          ) : servicios.length === 0 ? (
            <div className="col-span-full text-center text-white/50">No hay servicios registrados</div>
          ) : (
            servicios.map((servicio) => (
              <div
                key={servicio._id}
                className="rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group flex flex-col"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                {/* Imagen del servicio */}
                <div className="w-full h-[200px] overflow-hidden relative shrink-0">
                  <img
                    src={servicio.imgUrl}
                    alt={servicio.nameService}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6) 100%)",
                    }}
                  />
                </div>

                {/* Info del servicio */}
                <div className="p-5 flex-1 flex flex-col relative">
                  <div className="flex justify-between items-start mb-1.5">
                    <h3 className="text-base font-bold text-white">{servicio.nameService}</h3>
                    <span 
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{
                        background: (servicio.status !== false) ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                        color: (servicio.status !== false) ? "#34d399" : "#f87171",
                        border: `1px solid ${(servicio.status !== false) ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                      }}
                    >
                      {(servicio.status !== false) ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                  <p className="text-[13px] text-white/40 leading-relaxed mb-4 flex-1">
                    {servicio.description}
                  </p>

                  {/* Separador */}
                  <div className="border-t border-white/10 mb-4" />

                  {/* Tarifa y boton editar/eliminar */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] text-white/40 font-medium">Tarifa Base</div>
                      <div className="text-emerald-400 font-bold text-base">${servicio.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditServicio(servicio)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 hover:bg-white/15 cursor-pointer"
                        style={{
                          background: "rgba(59, 130, 246, 0.15)",
                          border: "1px solid rgba(59, 130, 246, 0.3)",
                        }}
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteServicio(servicio._id)}
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
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL: Agregar Nuevo Servicio */}
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
            className="relative w-full max-w-[620px] rounded-2xl p-8 animate-fade-in-up"
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
                {editingId ? "Editar Servicio" : "Agregar Nuevo Servicio"}
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

            {/* Linea separadora */}
            <div className="border-t border-black/10 mb-6" />

            {/* Fila: Nombre y Tarifa Base */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Nombre</label>
                <input
                  type="text"
                  value={formData.nameService}
                  onChange={(e) => setFormData(prev => ({ ...prev, nameService: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Tarifa Base</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg text-sm text-gray-900 outline-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                  style={{
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(0,0,0,0.1)",
                  }}
                />
              </div>
            </div>

            {/* Descripcion */}
            <div className="mb-5">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Descripción</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg text-sm text-gray-900 outline-none resize-none transition-all duration-200 focus:ring-2 focus:ring-emerald-400"
                style={{
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(0,0,0,0.1)",
                }}
              />
            </div>

            {/* Cargar imagen y Estado */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Drop zone para imagen */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Cargar Imagen del Servicio</label>
                <div
                  className="rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200 relative overflow-hidden"
                  style={{
                    background: dragActive ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.4)",
                    border: dragActive ? "2px dashed #10b981" : "2px dashed rgba(0,0,0,0.15)",
                    minHeight: "150px",
                  }}
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
                      {/* Icono de upload */}
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      <p className="text-[12px] text-gray-500 text-center px-4">
                        Arrastra y suelta una imagen aquí, o explora
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1">PNG, JPG hasta 10MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                </div>
              </div>

              {/* Estado del servicio */}
              <div className="flex flex-col items-start justify-center pl-4">
                <h3 className="text-base font-bold text-gray-900 mb-1">Estado Del Servicio</h3>
                <p className="text-[12px] text-gray-500 mb-4">¿Esta activo este servicio?</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                    className="relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer"
                    style={{
                      background: formData.activo
                        ? "linear-gradient(135deg, #10b981, #34d399)"
                        : "rgba(0,0,0,0.2)",
                    }}
                  >
                    <div
                      className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300"
                      style={{
                        left: formData.activo ? "calc(100% - 26px)" : "2px",
                      }}
                    />
                  </button>
                  <span className={`text-sm font-medium ${formData.activo ? "text-emerald-600" : "text-gray-500"}`}>
                    {formData.activo ? "Estado Activo" : "Inactivo"}
                  </span>
                </div>
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
                onClick={handleSaveServicio}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                }}
              >
                {editingId ? "Actualizar Servicio" : "Guardar Servicio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}