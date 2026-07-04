import { useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, message, Tag, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const statusLabels: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: 'Pendiente' },
  sent: { color: 'blue', label: 'Enviada' },
  received: { color: 'green', label: 'Recibida' },
  cancelled: { color: 'red', label: 'Cancelada' },
}

export default function PurchaseOrdersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: () => api.get('/purchase-orders/').then(r => r.data),
  })

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-po'],
    queryFn: () => api.get('/suppliers/', { params: { is_active: true, page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/purchase-orders/', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); setOpen(false); form.resetFields(); message.success('Orden de compra creada') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/purchase-orders/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['purchase-orders'] }); message.success('Orden eliminada') },
  })

  const columns = [
    { title: 'OC #', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Proveedor', dataIndex: 'supplier_name', key: 'supplier_name' },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const st = statusLabels[s] || { color: 'default', label: s }
        return <Tag color={st.color}>{st.label}</Tag>
      },
    },
    { title: 'Fecha', dataIndex: 'order_date', key: 'order_date', render: (v: string) => new Date(v).toLocaleDateString() },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        <Space>
          {record.status === 'sent' && (
            <Button icon={<CheckCircleOutlined />} size="small" type="primary" onClick={async () => {
              await api.post(`/purchase-orders/${record.id}/receive/`, { items: [] })
              queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })
              message.success('Orden recibida')
            }}>Recibir</Button>
          )}
          <Popconfirm title="¿Eliminar?" onConfirm={() => deleteMutation.mutate(record.id)}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Órdenes de Compra</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nueva OC</Button>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title="Nueva Orden de Compra"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={values => createMutation.mutate(values)}>
          <Form.Item name="supplier" label="Proveedor" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={(Array.isArray(suppliers) ? suppliers : []).map((s: any) => ({ value: s.id, label: s.company_name }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notas">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="total" label="Total">
            <InputNumber prefix="Bs." min={0} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
