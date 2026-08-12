import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Typography, message, Popconfirm, Tabs, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

function VehicleBrandsTab() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-brands'],
    queryFn: () => api.get('/vehicles/brands/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicle-brands'] })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/vehicles/brands/', values),
    onSuccess: () => { invalidate(); setOpen(false); form.resetFields(); message.success('Marca creada') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/vehicles/brands/${editing.id}/`, values),
    onSuccess: () => { invalidate(); setOpen(false); setEditing(null); form.resetFields(); message.success('Marca actualizada') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vehicles/brands/${id}/`),
    onSuccess: () => { invalidate(); message.success('Marca eliminada') },
  })

  const columns = [
    { title: 'Nro', key: 'nro', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'Estado', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag> },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditing(record); form.setFieldsValue(record); setOpen(true) }} />
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
        <Typography.Text type="secondary">Marca disponibles en el formulario de vehículos.</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nueva Marca</Button>
      </div>
      <Table dataSource={Array.isArray(data) ? data : []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Marca' : 'Nueva Marca'}
        open={open}
        maskClosable={false}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={values => {
          const payload = { ...values, name: String(values.name || '').trim() }
          editing ? updateMutation.mutate(payload) : createMutation.mutate(payload)
        }}>
          <Form.Item name="name" label="Nombre" rules={[{ required: true, message: 'Ingresa el nombre de la marca' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="Activo">
            <Select options={[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default function MaintenancePage() {
  return (
    <div>
      <Typography.Title level={4}>Mantenimiento / Parámetros</Typography.Title>
      <Tabs
        items={[
          { key: 'vehicle-brands', label: 'Marcas de Vehículos', children: <VehicleBrandsTab /> },
        ]}
      />
    </div>
  )
}
