import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface PdfReportOptions {
  title: string
  subheader?: string
  columns: { header: string; dataKey: string }[]
  rows: Record<string, any>[]
  userName?: string
}

const COMPANY = {
  name: 'GT Automotriz',
  address: [
    'Dirección: Av. La Banda s/n a 1 cuadra de la UPDS -  Barrio German Bush',
    'Correo: huguitogareca32@gmail.com / Cel: 72983151',
    'Tarija - Bolivia',
  ],
  footer: `GT Automotriz © ${new Date().getFullYear()} — Todos los derechos reservados`,
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

export async function generatePdfReport(opts: PdfReportOptions) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 14
  const topMargin = 10
  const maxWidth = pageWidth - margin * 2
  let y = topMargin

  const primaryColor: [number, number, number] = [204, 0, 0]
  const grayColor: [number, number, number] = [100, 100, 100]

  doc.setFont('helvetica', 'bold')

  const logo = await loadLogoBase64()

  y = margin

  if (logo) {
    doc.addImage(logo, 'PNG', margin, y, 35, 28)
    y += 33
  } else {
    y += 5
  }

  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setLineWidth(0.8)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.text(opts.title, pageWidth / 2, y, { align: 'center' })
  y += 7

  if (opts.subheader) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(opts.subheader, pageWidth / 2, y, { align: 'center' })
    y += 6
  }

  y += 3

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(80, 80, 80)
  const now = new Date()
  const dateStr = now.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const meta = `Generado por: ${opts.userName || '—'}  |  Fecha: ${dateStr}  |  Hora: ${timeStr}`
  doc.text(meta, margin, y)
  y += 5

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5

  const tableHeaders = opts.columns.map((c) => c.header)
  const tableBody = opts.rows.map((row, i) =>
    opts.columns.map((c) => {
      const val = row[c.dataKey]
      return val != null ? String(val) : ''
    }),
  )

  autoTable(doc, {
    head: [tableHeaders],
    body: tableBody,
    startY: y,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
      textColor: [40, 40, 40],
    },
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250],
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        const footerY = doc.internal.pageSize.getHeight() - 10
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.setLineWidth(0.5)
        doc.line(margin, footerY - 2, pageWidth - margin, footerY - 2)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
        COMPANY.address.forEach((line, idx) => {
          doc.text(line, pageWidth / 2, footerY + 2 + idx * 3.5, { align: 'center' })
        })
        doc.text(COMPANY.footer, pageWidth / 2, footerY + 2 + COMPANY.address.length * 3.5 + 3, { align: 'center' })
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY + 2, { align: 'right' })
      }
    },
  })

  doc.save(`${opts.title}.pdf`)
}
