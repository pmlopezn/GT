import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Typography, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function SuppliersPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => api.get('/suppliers/', { params: { search } }).then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/suppliers/', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setOpen(false); form.resetFields(); message.success('Proveedor creado') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/suppliers/${editing.id}/`, values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Proveedor actualizado') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/suppliers/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['suppliers'] }); message.success('Proveedor eliminado') },
  })

  const columns = [
    { title: 'Empresa', dataIndex: 'company_name', key: 'company_name' },
    { title: 'Contacto', dataIndex: 'contact_name', key: 'contact_name' },
    { title: 'Teléfono', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Activo', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag> },
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
        <Typography.Title level={4}>Proveedores</Typography.Title>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nuevo Proveedor</Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={values => editing ? updateMutation.mutate(values) : createMutation.mutate(values)}>
          <Form.Item name="company_name" label="Empresa" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contact_name" label="Contacto">
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
          <Form.Item name="is_active" label="Activo">
            <Select options={[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
