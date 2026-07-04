import { Table, Tag, Button, Select, Space, Typography, message } from 'antd'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useState } from 'react'

const statusLabels: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: 'Pendiente' },
  in_progress: { color: 'blue', label: 'En Progreso' },
  completed: { color: 'green', label: 'Completado' },
  invoiced: { color: 'purple', label: 'Facturado' },
  cancelled: { color: 'red', label: 'Cancelado' },
}

export default function WorkOrdersPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<string>()

  const { data, isLoading } = useQuery({
    queryKey: ['work-orders', statusFilter],
    queryFn: () => api.get('/work-orders/', { params: { status: statusFilter } }).then(r => r.data),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.post(`/work-orders/${id}/change_status/`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['work-orders'] }); message.success('Estado actualizado') },
  })

  const columns = [
    { title: 'OT #', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'Vehículo', dataIndex: 'vehicle_info', key: 'vehicle_info' },
    { title: 'Mecánico', dataIndex: 'assigned_to_name', key: 'assigned_to_name' },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (s: string, record: any) => {
        const st = statusLabels[s] || { color: 'default', label: s }
        return (
          <Select
            value={s}
            size="small"
            style={{ width: 140 }}
            onChange={(val) => statusMutation.mutate({ id: record.id, status: val })}
            options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v.label }))}
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
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/work-orders/new')}>
            Nueva Orden
          </Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
    </div>
  )
}
