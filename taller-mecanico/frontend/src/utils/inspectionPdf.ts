import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface InspectionPdfData {
  workOrder: any
  inspection: any
  vehicle: any
  employees: any[]
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

const yesNo = (val: any) => (val ? 'Sí' : 'No')

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

export async function generateInspectionPdf(data: InspectionPdfData) {
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
  doc.text('RECEPCIÓN DE VEHÍCULO', pageWidth / 2, y, { align: 'center' })
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

  const insp = data.inspection || {}
  const veh = data.vehicle
  const empName = insp.inspected_by_name

  const infoRows: [string, string, string, string][] = [
    ['Cliente', data.workOrder?.customer_name || '—', 'Teléfono', data.workOrder?.customer_phone || '—'],
  ]

  if (veh) {
    infoRows.push(['Vehículo', `${veh.brand} ${veh.model} - ${veh.plate}`, 'Año', String(veh.year || '—')])
    infoRows.push(['Tipo', veh.vehicle_type || '—', 'Color', veh.color || '—'])
  } else {
    infoRows.push(['Vehículo', data.workOrder?.vehicle_plate || '—', '', ''])
  }

  infoRows.push(['Kilometraje', insp.mileage_in ? `${insp.mileage_in} ${insp.mileage_unit || 'KM'}` : '—', 'Combustible', insp.fuel_level || '—'])
  infoRows.push(['Enc. Recepción', empName || '—', '', ''])

  const tblCols = (labelPct: number, valPct: number) => ({
    0: { cellWidth: availWidth * labelPct, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number] },
    1: { cellWidth: availWidth * valPct },
    2: { cellWidth: availWidth * labelPct, fontStyle: 'bold' as const, fillColor: [245, 245, 245] as [number, number, number] },
    3: { cellWidth: availWidth * valPct },
  })

  const tableTheme = {
    fontSize: 9,
    cellPadding: 3,
    lineColor: [180, 180, 180] as [number, number, number],
    lineWidth: 0.3,
    textColor: [40, 40, 40] as [number, number, number],
  }

  autoTable(doc, {
    body: infoRows.map(r => [r[0], r[1], r[2], r[3]]),
    startY: y,
    margin: { left: margin, right: margin },
    styles: tableTheme,
    columnStyles: tblCols(0.22, 0.28),
    theme: 'grid',
    didDrawPage: () => drawFooter(doc, pageWidth, margin, primaryColor, grayColor),
  })

  y = (doc as any).lastAutoTable?.finalY + 6 || y + 30

  const inspCols = tblCols(0.22, 0.28)

  const drawSection = (title: string, rows: string[][], noteFields: { label: string; value: string }[]) => {
    if (y + 20 > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage()
      y = margin
    }
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.text(title, margin, y)
    y += 5

    autoTable(doc, {
      body: rows,
      startY: y,
      margin: { left: margin, right: margin },
      styles: { ...tableTheme, cellPadding: 2.5 },
      columnStyles: inspCols,
      theme: 'grid',
      didDrawPage: () => drawFooter(doc, pageWidth, margin, primaryColor, grayColor),
    })

    y = (doc as any).lastAutoTable?.finalY + 10

    noteFields.forEach((nf) => {
      if (y > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage()
        y = margin
      }
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(60, 60, 60)
      doc.text(`${nf.label}: ${nf.value || '—'}`, margin, y)
      y += 5
    })
    y += 2
  }

  // Luces
  drawSection('LUCES', [
    ['Luz media - Izq.', yesNo(insp.light_medium_left_ok), 'Luz media - Der.', yesNo(insp.light_medium_right_ok)],
    ['Luz baja - Izq.', yesNo(insp.light_low_left_ok), 'Luz baja - Der.', yesNo(insp.light_low_right_ok)],
    ['Luz alta - Izq.', yesNo(insp.light_high_left_ok), 'Luz alta - Der.', yesNo(insp.light_high_right_ok)],
    ['Giro - Izq.', yesNo(insp.light_turn_left_ok), 'Giro - Der.', yesNo(insp.light_turn_right_ok)],
    ['Luz placa - Adelante', yesNo(insp.light_plate_front_ok), 'Luz placa - Atrás', yesNo(insp.light_plate_rear_ok)],
  ], [])

  y += 6
  // Vidrios
  drawSection('VIDRIOS', [
    ['Parabrisas del.', yesNo(insp.glass_windshield_ok), 'Trasero', yesNo(insp.glass_rear_ok)],
    ['Pta. del. Izq.', yesNo(insp.glass_left_front_ok), 'Pta. del. Der.', yesNo(insp.glass_right_front_ok)],
    ['Pta. tras. Izq.', yesNo(insp.glass_left_rear_ok), 'Pta. tras. Der.', yesNo(insp.glass_right_rear_ok)],
    ['Ventilete tras. Izq.', yesNo(insp.glass_left_quarter_ok), 'Ventilete tras. Der.', yesNo(insp.glass_right_quarter_ok)],
  ], [])

  y += 6
  // Exterior
  drawSection('EXTERIOR', [
    ['Antena de radio', yesNo(insp.exterior_antenna_ok), 'Tapa gasolina', yesNo(insp.exterior_gas_cap_ok)],
    ['Espejo lat. Izq.', yesNo(insp.exterior_mirror_left_ok), 'Espejo lat. Der.', yesNo(insp.exterior_mirror_right_ok)],
    ['Limp. del. Izq.', yesNo(insp.exterior_wiper_front_left_ok), 'Limp. del. Der.', yesNo(insp.exterior_wiper_front_right_ok)],
    ['Limp. trasero', yesNo(insp.exterior_wiper_rear_ok), '', ''],
    ['Tapón rueda I-D', yesNo(insp.exterior_wheel_cap_left_front_ok), 'Tapón rueda I-T', yesNo(insp.exterior_wheel_cap_left_rear_ok)],
    ['Tapón rueda D-D', yesNo(insp.exterior_wheel_cap_right_front_ok), 'Tapón rueda D-T', yesNo(insp.exterior_wheel_cap_right_rear_ok)],
    ['Placa adelante', yesNo(insp.exterior_plate_front_ok), 'Placa atrás', yesNo(insp.exterior_plate_rear_ok)],
    ['Parachoque del.', yesNo(insp.exterior_bumper_front_ok), 'Parachoque tras.', yesNo(insp.exterior_bumper_rear_ok)],
  ], [
    { label: 'Abolladuras', value: insp.exterior_dents_detail },
    { label: 'Rayones', value: insp.exterior_scratches_detail },
  ])

  y += 6
  // Interior
  drawSection('INTERIOR', [
    ['Radio', yesNo(insp.interior_radio_ok), 'CD/DVD', yesNo(insp.interior_radio_cd_dvd)],
    ['Pantalla', yesNo(insp.interior_radio_screen), 'Cigarrera', yesNo(insp.interior_cigarette_lighter_ok)],
    ['Bocina', yesNo(insp.interior_horn_ok), 'Retrovisor', yesNo(insp.interior_rearview_mirror_ok)],
    ['Manija vidrio I-D', yesNo(insp.interior_window_handle_lf_ok), 'Manija vidrio D-D', yesNo(insp.interior_window_handle_rf_ok)],
    ['Manija vidrio I-T', yesNo(insp.interior_window_handle_lr_ok), 'Manija vidrio D-T', yesNo(insp.interior_window_handle_rr_ok)],
    ['Sujetador I-D', yesNo(insp.interior_grab_handle_lf_ok), 'Sujetador D-D', yesNo(insp.interior_grab_handle_rf_ok)],
    ['Sujetador I-T', yesNo(insp.interior_grab_handle_lr_ok), 'Sujetador D-T', yesNo(insp.interior_grab_handle_rr_ok)],
    ['Jalador I-D', yesNo(insp.interior_door_pull_lf_ok), 'Jalador D-D', yesNo(insp.interior_door_pull_rf_ok)],
    ['Jalador I-T', yesNo(insp.interior_door_pull_lr_ok), 'Jalador D-T', yesNo(insp.interior_door_pull_rr_ok)],
    ['Cinturones', yesNo(insp.interior_seatbelts_ok), 'Pisos', yesNo(insp.interior_floor_ok)],
    ['Tipo piso', insp.interior_floor_type || '—', 'Tapetes', yesNo(insp.interior_floor_mats_ok)],
    ['Fundas del.', yesNo(insp.interior_seat_covers_front_ok), 'Fundas tras.', yesNo(insp.interior_seat_covers_rear_ok)],
    ['Llanta auxilio', yesNo(insp.interior_spare_tire_ok), 'Gata', yesNo(insp.interior_jack_ok)],
    ['Extintor', yesNo(insp.interior_extinguisher_ok), 'Triángulos seg.', yesNo(insp.interior_triangles_ok)],
  ], [])
  if (insp.interior_notes) {
    drawSection('', [
      ['Notas interior', insp.interior_notes, '', ''],
    ], [])
  }

  // Signatures
  y += 20
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)

  const sigCenter = pageWidth / 2
  const leftX = sigCenter - 60
  const rightX = sigCenter + 60

  doc.line(leftX - 40, y, leftX + 40, y)
  doc.text(empName || '__________________________', leftX, y - 2, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Encargado de Recepción', leftX, y + 5, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(40, 40, 40)
  doc.line(rightX - 40, y, rightX + 40, y)
  doc.text(data.workOrder?.customer_name || '__________________________', rightX, y - 2, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text('Cliente', rightX, y + 5, { align: 'center' })

  // Footer on last page
  drawFooter(doc, pageWidth, margin, primaryColor, grayColor)

  doc.save(`Recepcion_${data.workOrder?.id || 'desconocido'}.pdf`)
}
