import { jsPDF } from "jspdf"
import logoSertena from "../assets/Logo.png"

/**
 * Convierte una URL de imagen (importada en Vite) a Data URL Base64 para jsPDF.
 */
async function getBase64Image(url) {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Formatea una fecha ISO o string a DD/MM/YYYY.
 */
function formatDate(raw) {
  if (!raw) return "N/A"
  try {
    const d = new Date(raw)
    if (Number.isNaN(d.getTime())) return "N/A"
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    })
  } catch {
    return "N/A"
  }
}

/**
 * Genera y descarga el PDF de resumen general y ventas de Sertena.
 *
 * @param {Object} params
 * @param {Array} params.proyectos Lista de proyectos/ventas
 * @param {Object} params.stats Estadísticas calculadas (ventas, citas, reseñas, populares)
 * @param {string} params.userEmail Correo del administrador que genera el reporte
 */
export async function generateDashboardPDF({ proyectos = [], stats = {}, userEmail = "Administrador" }) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentWidth = pageWidth - margin * 2

  // Cargar logotipo de Sertena
  const logoBase64 = await getBase64Image(logoSertena)

  const drawHeader = (pageNum) => {
    // Franja superior decorativa color petróleo/teal oscuro
    doc.setFillColor(13, 148, 136) // #0d9488
    doc.rect(0, 0, pageWidth, 4, "F")

    // Encabezado de página
    let y = 12
    if (logoBase64) {
      try {
        // Logotipo Sertena en la esquina izquierda (ancho ~42mm, alto ~14mm)
        doc.addImage(logoBase64, "PNG", margin, y - 2, 42, 14)
      } catch {
        // Fallback textual si falla la imagen
        doc.setFont("helvetica", "bold")
        doc.setFontSize(16)
        doc.setTextColor(13, 148, 136)
        doc.text("SERTENA", margin, y + 6)
      }
    } else {
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)
      doc.setTextColor(13, 148, 136)
      doc.text("SERTENA", margin, y + 6)
    }

    // Información institucional a la derecha
    doc.setFont("helvetica", "bold")
    doc.setFontSize(11)
    doc.setTextColor(15, 23, 42) // #0f172a
    doc.text("SERTENA TÉCNICOS INDUSTRIALES", pageWidth - margin, y + 3, { align: "right" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text("Reporte Ejecutivo y Resumen de Ventas", pageWidth - margin, y + 7.5, { align: "right" })
    doc.text(`Emisión: ${new Date().toLocaleString("es-ES")} | Generado por: ${userEmail}`, pageWidth - margin, y + 12, { align: "right" })

    // Línea divisoria
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.4)
    doc.line(margin, y + 17, pageWidth - margin, y + 17)

    return y + 23
  }

  const drawFooter = (pageNum, totalPages) => {
    const y = pageHeight - 10
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.3)
    doc.line(margin, y - 3, pageWidth - margin, y - 3)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.text("SERTENA © 2026 - Documento Confidencial de Gestión Operativa", margin, y + 1)
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, y + 1, { align: "right" })
  }

  // --- PÁGINA 1: Portada ejecutiva y KPIs ---
  let currentY = drawHeader(1)

  // Título de sección
  doc.setFont("helvetica", "bold")
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text("Resumen de Métricas Clave", margin, currentY)
  currentY += 6

  // 4 Bloques KPI estilizados (2x2 cuadrícula)
  const cardW = (contentWidth - 6) / 2
  const cardH = 22

  const kpis = [
    {
      title: "Ventas Totales Registradas",
      value: `$${(stats.ventasSemanales || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: "Ingresos acumulados de proyectos",
      color: [13, 148, 136], // Teal
      bg: [240, 253, 250],
      border: [153, 246, 228],
    },
    {
      title: "Citas Programadas Activas",
      value: String(stats.citasProgramadas || 0),
      subtitle: "Operaciones pendientes de atención",
      color: [37, 99, 235], // Blue
      bg: [239, 246, 255],
      border: [191, 219, 254],
    },
    {
      title: "Satisfacción de Clientes",
      value: `${stats.reseniasPromedio || "0.0"} / 5.0 ★`,
      subtitle: `Basado en ${stats.reseniasTotal || 0} reseñas verificadas`,
      color: [217, 119, 6], // Amber
      bg: [255, 251, 235],
      border: [254, 243, 199],
    },
    {
      title: "Volumen Total de Proyectos",
      value: String(proyectos.length),
      subtitle: "Historial completo de solicitudes",
      color: [79, 70, 229], // Indigo
      bg: [238, 242, 255],
      border: [199, 210, 254],
    },
  ]

  kpis.forEach((kpi, idx) => {
    const col = idx % 2
    const row = Math.floor(idx / 2)
    const x = margin + col * (cardW + 6)
    const y = currentY + row * (cardH + 4)

    // Fondo y borde
    doc.setFillColor(...kpi.bg)
    doc.setDrawColor(...kpi.border)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, cardW, cardH, 2, 2, "FD")

    // Título
    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(kpi.title, x + 4, y + 5.5)

    // Valor principal
    doc.setFont("helvetica", "bold")
    doc.setFontSize(13)
    doc.setTextColor(...kpi.color)
    doc.text(kpi.value, x + 4, y + 13)

    // Subtítulo
    doc.setFont("helvetica", "normal")
    doc.setFontSize(6.8)
    doc.setTextColor(148, 163, 184)
    doc.text(kpi.subtitle, x + 4, y + 18)
  })

  currentY += (cardH * 2) + 12

  // --- SECCIÓN: Servicios Más Demandados ---
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text("Servicios Más Demandados y Ventas Generadas", margin, currentY)
  currentY += 5

  const populares = stats.serviciosPopulares || []
  if (populares.length > 0) {
    // Encabezado de tabla pequeña
    const thH = 7
    doc.setFillColor(241, 245, 249)
    doc.rect(margin, currentY, contentWidth, thH, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(51, 65, 85)
    doc.text("SERVICIO", margin + 3, currentY + 4.8)
    doc.text("FRECUENCIA", margin + 85, currentY + 4.8)
    doc.text("ESTADO", margin + 125, currentY + 4.8)
    doc.text("TOTAL RECAUDADO", pageWidth - margin - 3, currentY + 4.8, { align: "right" })
    currentY += thH

    populares.forEach((serv, i) => {
      const rowBg = i % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(...rowBg)
      doc.rect(margin, currentY, contentWidth, 7, "F")

      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text(String(serv.name || "Servicio General").substring(0, 45), margin + 3, currentY + 4.8)

      doc.setTextColor(71, 85, 105)
      doc.text(`${serv.frequency} solicitudes`, margin + 85, currentY + 4.8)
      doc.text(serv.trend === "up" ? "Alta demanda" : "Estable", margin + 125, currentY + 4.8)

      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text(String(serv.revenue || "$0"), pageWidth - margin - 3, currentY + 4.8, { align: "right" })

      currentY += 7
    })
    currentY += 8
  }

  // --- SECCIÓN: Detalle Completo de Ventas y Proyectos ---
  const checkNewPage = (neededHeight) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage()
      currentY = drawHeader(doc.getNumberOfPages())
      drawTableHeader()
    }
  }

  const drawTableHeader = () => {
    const thH = 7.5
    doc.setFillColor(15, 23, 42) // Dark navy
    doc.rect(margin, currentY, contentWidth, thH, "F")

    doc.setFont("helvetica", "bold")
    doc.setFontSize(7.5)
    doc.setTextColor(255, 255, 255)
    doc.text("FECHA", margin + 3, currentY + 5)
    doc.text("SERVICIO", margin + 28, currentY + 5)
    doc.text("UBICACIÓN / CLIENTE", margin + 82, currentY + 5)
    doc.text("ESTADO", margin + 142, currentY + 5)
    doc.text("MONTO ($)", pageWidth - margin - 3, currentY + 5, { align: "right" })
    currentY += thH
  }

  checkNewPage(24)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(15, 23, 42)
  doc.text("Desglose Detallado de Ventas y Proyectos", margin, currentY)
  currentY += 5

  drawTableHeader()

  if (proyectos.length === 0) {
    doc.setFont("helvetica", "italic")
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text("No existen proyectos ni ventas registradas actualmente.", margin + 3, currentY + 6)
    currentY += 10
  } else {
    proyectos.forEach((p, index) => {
      checkNewPage(8)

      const rowBg = index % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
      doc.setFillColor(...rowBg)
      doc.rect(margin, currentY, contentWidth, 7.5, "F")

      // Línea inferior sutil
      doc.setDrawColor(241, 245, 249)
      doc.setLineWidth(0.2)
      doc.line(margin, currentY + 7.5, pageWidth - margin, currentY + 7.5)

      // Fecha
      doc.setFont("helvetica", "normal")
      doc.setFontSize(7.2)
      doc.setTextColor(71, 85, 105)
      doc.text(formatDate(p.dateStart), margin + 3, currentY + 5)

      // Servicio
      const serviceName = p.idService?.nameService || (typeof p.idService === "string" ? p.idService : "Servicio Industrial")
      doc.setFont("helvetica", "bold")
      doc.setTextColor(15, 23, 42)
      doc.text(String(serviceName).substring(0, 28), margin + 28, currentY + 5)

      // Ubicación / Cliente
      const clientLoc = p.clientLocation || "Instalaciones Sertena"
      doc.setFont("helvetica", "normal")
      doc.setTextColor(100, 116, 139)
      doc.text(String(clientLoc).substring(0, 32), margin + 82, currentY + 5)

      // Estado
      const st = String(p.status || "Programado")
      if (st === "Finalizado") {
        doc.setTextColor(16, 185, 129) // Emerald
      } else if (st === "En Progreso" || st === "En proceso") {
        doc.setTextColor(37, 99, 235) // Blue
      } else {
        doc.setTextColor(217, 119, 6) // Amber
      }
      doc.setFont("helvetica", "bold")
      doc.text(st, margin + 142, currentY + 5)

      // Monto
      const priceNum = typeof p.finalPrice === "number" ? p.finalPrice : parseFloat(String(p.finalPrice || "0").replace(/[^0-9.]/g, "")) || 0
      doc.setFont("helvetica", "bold")
      doc.setTextColor(13, 148, 136)
      doc.text(`$${priceNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 3, currentY + 5, { align: "right" })

      currentY += 7.5
    })
  }

  // Resumen final acumulado al final de la tabla
  checkNewPage(14)
  currentY += 3
  doc.setFillColor(240, 253, 250)
  doc.setDrawColor(153, 246, 228)
  doc.setLineWidth(0.4)
  doc.roundedRect(margin, currentY, contentWidth, 10, 1.5, 1.5, "FD")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(8.5)
  doc.setTextColor(15, 23, 42)
  doc.text(`TOTAL REGISTRADO (${proyectos.length} proyectos):`, margin + 4, currentY + 6.5)

  doc.setFontSize(10)
  doc.setTextColor(13, 148, 136)
  doc.text(`$${(stats.ventasSemanales || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - margin - 4, currentY + 6.8, { align: "right" })

  // Numeración de páginas en todas las hojas
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    drawFooter(i, totalPages)
  }

  // Descarga directa del PDF
  const today = new Date().toISOString().slice(0, 10)
  doc.save(`Sertena_Reporte_Ventas_${today}.pdf`)
}
