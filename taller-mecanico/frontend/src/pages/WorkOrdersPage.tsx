import { Table, Tag, Button, Select, Space, Typography, message } from 'antd'
import { PlusOutlined, EyeOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { generatePdfReport } from '../utils/pdfReport'

const statusLabels: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: 'Pendiente' },
  in_progress: { color: 'blue', label: 'En Progreso' },
  completed: { color: 'green', label: 'Completado' },
  invoiced: { color: 'purple', label: 'Facturado' },
  cancelled: { color: 'red', label: 'Cancelado' },
}

export default function WorkOrdersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>()
  const [vehicleFilter, setVehicleFilter] = useState<number>()
  const role = user?.role
  const isReceptionistOrAdmin = role === 'admin' || role === 'receptionist'
  const isMechanic = role === 'mechanic'

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-select'],
    queryFn: () => api.get('/vehicles/', { params: { page_size: 500 } }).then(r => r.data?.results || r.data),
    enabled: !isMechanic,
  })

  const { data: mechanics } = useQuery({
    queryKey: ['mechanics-select'],
    queryFn: () => api.get('/employees/', { params: { user__role: 'mechanic', is_active: true, page_size: 200 } }).then(r => r.data?.results || r.data),
    enabled: isReceptionistOrAdmin,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', statusFilter, vehicleFilter],
    queryFn: () => api.get('/work-orders/', { params: { status: statusFilter, vehicle: vehicleFilter || undefined } }).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.post(`/work-orders/${id}/change_status/`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-orders'] }); message.success('Estado actualizado') },
    onError: (err: any) => message.error(err?.response?.data?.error || 'Error al actualizar estado'),
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, mechanic_id }: { id: number; mechanic_id: number }) => api.post(`/work-orders/${id}/assign_mechanic/`, { mechanic_id }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-orders'] }); message.success('Mecánico asignado') },
    onError: (err: any) => message.error(err?.response?.data?.error || 'Error al asignar mecánico'),
  })

  const getStatusOptions = (currentStatus: string) => {
    if (role === 'admin') {
      return Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v.label }))
    }
    if (role === 'receptionist') {
      if (currentStatus === 'completed') return [{ value: 'invoiced', label: 'Facturado' }]
      if (currentStatus === 'pending') return [{ value: 'cancelled', label: 'Cancelado' }]
      if (currentStatus === 'in_progress') return [{ value: 'pending', label: 'Pendiente' }]
      return []
    }
    if (role === 'mechanic') {
      if (currentStatus === 'in_progress') return [{ value: 'completed', label: 'Completado' }]
      return []
    }
    return []
  }

  const columns = [
    { title: 'OT #', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'Vehículo', dataIndex: 'vehicle_info', key: 'vehicle_info' },
    { title: 'Registrado por', dataIndex: 'assigned_to_name', key: 'assigned_to_name' },
    {
      title: 'Mecánico Asignado', key: 'mechanic', width: 200,
      render: (_: any, record: any) => {
        if (isReceptionistOrAdmin && record.status === 'pending') {
          return (
            <Select
              size="small"
              style={{ width: 180 }}
              placeholder="Asignar..."
              value={record.assigned_to || undefined}
              onChange={(val) => assignMutation.mutate({ id: record.id, mechanic_id: val })}
              options={(Array.isArray(mechanics) ? mechanics : []).map((m: any) => ({ value: m.id, label: m.full_name }))}
            />
          )
        }
        return record.assigned_to_name || '—'
      },
    },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (s: string, record: any) => {
        const st = statusLabels[s] || { color: 'default', label: s }
        const opts = getStatusOptions(s)
        if (opts.length === 0) {
          return <Tag color={st.color}>{st.label}</Tag>
        }
        return (
          <Select
            value={s}
            size="small"
            style={{ width: 140 }}
            onChange={(val) => statusMutation.mutate({ id: record.id, status: val })}
            options={opts}
          />
        )
      },
    },
    {
      title: 'Total', dataIndex: 'total', key: 'total',
      render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}`,
    },
    {
      title: 'Creado', dataIndex: 'created_at', key: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: 'Acciones', key: 'actions', width: 80,
      render: (_: any, record: any) => (
        <Button icon={<EyeOutlined />} size="small" onClick={() => navigate(`/work-orders/${record.id}`)} />
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Órdenes de Trabajo</Typography.Title>
        <Space>
          <Select
            placeholder="Filtrar por estado"
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          {!isMechanic && (
            <Select
              placeholder="Filtrar por vehículo"
              allowClear
              showSearch
              optionFilterProp="label"
              style={{ width: 250 }}
              value={vehicleFilter}
              onChange={setVehicleFilter}
              options={(Array.isArray(vehicles) ? vehicles : []).map((v: any) => ({ value: v.id, label: `${v.plate} - ${v.brand} ${v.model}` }))}
            />
          )}
          <Button icon={<FilePdfOutlined />} onClick={() => {
            const rows = data?.results || data || []
            generatePdfReport({
              title: 'Órdenes de Trabajo',
              columns: [
                { header: 'OT #', dataKey: 'id' },
                { header: 'Cliente', dataKey: 'customer_name' },
                { header: 'Vehículo', dataKey: 'vehicle_info' },
                { header: 'Registrado por', dataKey: 'assigned_to_name' },
                { header: 'Estado', dataKey: 'status' },
                { header: 'Total', dataKey: 'total' },
              ],
              rows: rows.map((r: any) => ({ ...r, total: `Bs. ${Number(r.total || 0).toFixed(2)}` })),
              userName: user?.username,
            })
          }}>Reporte PDF</Button>
          {!isMechanic && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/work-orders/new')}>
              Nueva Orden
            </Button>
          )}
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
    </div>
  )
}
