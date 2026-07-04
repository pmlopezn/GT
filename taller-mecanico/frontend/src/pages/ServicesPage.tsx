import { useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, message, Popconfirm, Tag, Tooltip } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

const vehicleTypes = [
  { value: 'automovil', label: 'Automóvil' },
  { value: 'vagoneta', label: 'Vagoneta' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'camion', label: 'Camión' },
  { value: 'trufi', label: 'Trufi' },
  { value: 'micro', label: 'Micro' },
]

export default function ServicesPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.get('/services/', { params: { page_size: 200 } }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => api.get('/services/categories/').then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values }
      payload.vehicle_prices = vehicleTypes.map((vt: any) => ({
        vehicle_type: vt.value,
        price: Number(values[`price_${vt.value}`] || 0),
      }))
      vehicleTypes.forEach((vt: any) => delete payload[`price_${vt.value}`])
      return api.post('/services/', payload)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setOpen(false); form.resetFields(); message.success('Servicio creado') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => {
      const payload = { ...values }
      payload.vehicle_prices = vehicleTypes.map((vt: any) => ({
        vehicle_type: vt.value,
        price: Number(values[`price_${vt.value}`] || 0),
      }))
      vehicleTypes.forEach((vt: any) => delete payload[`price_${vt.value}`])
      return api.patch(`/services/${editing.id}/`, payload)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Servicio actualizado') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/services/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['services'] }); message.success('Servicio eliminado') },
  })

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Categoría', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Tiempo Est.', dataIndex: 'estimated_time_minutes', key: 'estimated_time_minutes', render: (v: number) => `${v} min` },
    {
      title: 'Precios', dataIndex: 'vehicle_prices', key: 'vehicle_prices',
      render: (prices: any[]) => {
        if (!prices?.length) return <Tag>Sin precios</Tag>
        const min = Math.min(...prices.map(p => Number(p.price)))
        const max = Math.max(...prices.map(p => Number(p.price)))
        return (
          <Tooltip
            title={
              <div>
                {prices.map((p: any) => (
                  <div key={p.vehicle_type}>{p.vehicle_type_display}: Bs. {Number(p.price).toFixed(2)}</div>
                ))}
              </div>
            }
          >
            <span style={{ cursor: 'pointer' }}>
              {min === max ? `Bs. ${min.toFixed(2)}` : `Bs. ${min.toFixed(2)} – Bs. ${max.toFixed(2)}`}
            </span>
          </Tooltip>
        )
      },
    },
    { title: 'Activo', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag> },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => {
            setEditing(record)
            const fields: any = { ...record }
            record.vehicle_prices?.forEach((p: any) => { fields[`price_${p.vehicle_type}`] = Number(p.price) })
            form.setFieldsValue(fields)
            setOpen(true)
          }} />
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
        <Typography.Title level={4}>Catálogo de Servicios</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nuevo Servicio</Button>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Servicio' : 'Nuevo Servicio'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={values => editing ? updateMutation.mutate(values) : createMutation.mutate(values)}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Categoría" rules={[{ required: true }]}>
            <Select options={(Array.isArray(categories) ? categories : []).map((c: any) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="estimated_time_minutes" label="Tiempo Estimado (min)">
            <InputNumber min={1} />
          </Form.Item>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Precios por tipo de vehículo</Typography.Text>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            {vehicleTypes.map(vt => (
              <Form.Item
                key={vt.value}
                name={`price_${vt.value}`}
                label={vt.label}
                rules={[{ required: true, message: 'Requerido' }]}
              >
                <InputNumber prefix="Bs." min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            ))}
          </div>
          <Form.Item name="is_active" label="Activo" valuePropName="checked">
            <Select options={[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}