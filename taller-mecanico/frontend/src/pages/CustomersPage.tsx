import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Space, Typography, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function CustomersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => api.get('/customers/', { params: { search } }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/customers/', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); form.resetFields(); message.success('Cliente creado') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/customers/${editing.id}/`, values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Cliente actualizado') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/customers/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); message.success('Cliente eliminado') },
  })

  const columns = [
    { title: 'Nro', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Nombre', dataIndex: 'first_name', key: 'first_name', render: (_: any, r: any) => `${r.first_name} ${r.last_name}` },
    { title: 'Teléfono', dataIndex: 'phone', key: 'phone' },
    { title: 'Dirección', dataIndex: 'address', key: 'address', render: (v: string) => v || '-' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
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
        <Typography.Title level={4}>Clientes</Typography.Title>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nuevo Cliente</Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Cliente' : 'Nuevo Cliente'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={values => editing ? updateMutation.mutate(values) : createMutation.mutate(values)}>
          <Form.Item name="ci_nit" label="CI/NIT" rules={[{ required: true, message: 'Ingresa el CI o NIT' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="first_name" label="Nombre" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name" label="Apellido" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Teléfono" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input type="email" />
          </Form.Item>
          <Form.Item name="address" label="Dirección">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notas">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
