import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface WorkOrderPdfData {
  workOrder: any
  userName?: string
}

const COMPANY = {
  name: 'GT Automotriz',
  address: [
    'Dirección: Av. La Banda s/n a 1 cuadra de la UPDS -  Barrio German Bush',
    'Correo: huguitogareca32@gmail.com / Cel: 72983151',
    'Tarija - Bolivia',
  ],
}

async function loadLogoBase64(): Promise<string | null> {
  try {
    const resp = await fetch('/gt_logo.png')
    const blob = await resp.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawFooter(doc: jsPDF, pageWidth: number, margin: number, primaryColor: [number, number, number], grayColor: [number, number, number]) {
  const pageHeight = doc.internal.pageSize.getHeight()
  const fy = pageHeight - 5
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setLineWidth(0.5)
  doc.line(margin, fy - 8, pageWidth - margin, fy - 8)
  doc.setFontSize(6.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  COMPANY.address.forEach((line, idx) => {
    doc.text(line, pageWidth / 2, fy - 5 + idx * 3, { align: 'center' })
  })
}

export async function generateWorkOrderPdf(data: WorkOrderPdfData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const availWidth = pageWidth - margin * 2
  let y = margin

  const primaryColor: [number, number, number] = [204, 0, 0]
  const grayColor: [number, number, number] = [120, 120, 120]

  const logo = await loadLogoBase64()

  if (logo) {
    doc.addImage(logo, 'PNG', margin, y, 35, 28)
    y += 30
  } else {
    y += 5
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(`N° ${data.workOrder?.id || ''}`, pageWidth - margin, y, { align: 'right' })

  y += 10
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setLineWidth(0.8)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text('ORDEN DE TRABAJO', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const meta = `Generado por: ${data.userName || '—'}  |  Fecha: ${dateStr}  |  Hora: ${timeStr}`
  doc.text(meta, margin, y)
  y += 5

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5

  const wo = data.workOrder || {}
  const statusLabels: Record<string, string> = {
    pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado',
    invoiced: 'Facturado', cancelled: 'Cancelado',
  }

  const infoRows: [string, string, string, string][] = [
    ['Cliente', wo.customer_name || '—', 'Vehículo', wo.vehicle_plate || '—'],
    ['Mecánico', wo.assigned_to_name || '—', 'Estado', statusLabels[wo.status] || wo.status || '—'],
    ['Creado', wo.created_at ? new Date(wo.created_at).toLocaleDateString('es-BO') : '—', 'Completado', wo.completed_at ? new Date(wo.completed_at).toLocaleDateString('es-BO') : '—'],
  ]

  autoTable(doc, {
    body: infoRows.map(r => [r[0], r[1], r[2], r[3]]),
    startY: y,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [180, 180, 180],
      lineWidth: 0.3,
      textColor: [40, 40, 40],
    },
    columnStyles: {
      0: { cellWidth: availWidth * 0.18, fontStyle: 'bold', fillColor: [245, 245, 245] },
      1: { cellWidth: availWidth * 0.32 },
      2: { cellWidth: availWidth * 0.18, fontStyle: 'bold', fillColor: [245, 245, 245] },
      3: { cellWidth: availWidth * 0.32 },
    },
    theme: 'grid',
    didDrawPage: () => drawFooter(doc, pageWidth, margin, primaryColor, grayColor),
  })

  y = (doc as any).lastAutoTable?.finalY + 8 || y + 30

  // Services
  const services = Array.isArray(wo.services) ? wo.services : []
  if (services.length > 0) {
    if (y + 20 > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage(); y = margin
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('SERVICIOS', margin, y)
    y += 5

    autoTable(doc, {
      head: [['#', 'Servicio', 'Cant.', 'Precio', 'Subtotal']],
      body: services.map((s: any, i: number) => [
        String(i + 1),
        s.service_name || '—',
        String(s.quantity || 1),
        `Bs. ${Number(s.price || 0).toFixed(2)}`,
        `Bs. ${(Number(s.price || 0) * Number(s.quantity || 1)).toFixed(2)}`,
      ]),
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [40, 40, 40] },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: availWidth - 12 - 25 - 30 - 30 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      theme: 'grid',
      didDrawPage: () => drawFooter(doc, pageWidth, margin, primaryColor, grayColor),
    })

    y = (doc as any).lastAutoTable?.finalY + 8
  }

  // Products
  const products = Array.isArray(wo.products) ? wo.products : []
  if (products.length > 0) {
    if (y + 20 > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage(); y = margin
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text('PRODUCTOS', margin, y)
    y += 5

    autoTable(doc, {
      head: [['#', 'Producto', 'Cant.', 'Precio', 'Subtotal']],
      body: products.map((p: any, i: number) => [
        String(i + 1),
        p.product_name || '—',
        String(p.quantity || 1),
        `Bs. ${Number(p.price || 0).toFixed(2)}`,
        `Bs. ${(Number(p.price || 0) * Number(p.quantity || 1)).toFixed(2)}`,
      ]),
      startY: y,
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 2.5, lineColor: [180, 180, 180], lineWidth: 0.3, textColor: [40, 40, 40] },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: availWidth - 12 - 25 - 30 - 30 },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' },
      },
      theme: 'grid',
      didDrawPage: () => drawFooter(doc, pageWidth, margin, primaryColor, grayColor),
    })

    y = (doc as any).lastAutoTable?.finalY + 8
  }

  // Total
  if (y + 15 > doc.internal.pageSize.getHeight() - 30) {
    doc.addPage(); y = margin
  }
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.text(`Total: Bs. ${Number(wo.total || 0).toFixed(2)}`, pageWidth - margin, y, { align: 'right' })
  y += 26

  // Signatures
  if (y + 30 > doc.internal.pageSize.getHeight() - 20) {
    doc.addPage(); y = margin
  }
  const sigCenter = pageWidth / 2

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)

  const leftX = sigCenter - 60
  const rightX = sigCenter + 60

  doc.line(leftX - 40, y, leftX + 40, y)
  doc.text('__________________________', leftX, y - 2, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Mecánico Asignado', leftX, y + 5, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.line(rightX - 40, y, rightX + 40, y)
  doc.text(wo.customer_name || '__________________________', rightX, y - 2, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Cliente', rightX, y + 5, { align: 'center' })

  drawFooter(doc, pageWidth, margin, primaryColor, grayColor)

  doc.save(`Orden_Trabajo_${wo.id || 'desconocido'}.pdf`)
}
