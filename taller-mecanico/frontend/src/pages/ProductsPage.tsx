import { useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function ProductsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: () => api.get('/products/', { params: { search, page_size: 200 } }).then(r => r.data),
  })

  const { data: categories } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => api.get('/products/categories/').then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/products/', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setOpen(false); form.resetFields(); message.success('Producto creado') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/products/${editing.id}/`, values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Producto actualizado') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/products/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); message.success('Producto eliminado') },
  })

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: 'Categoría', dataIndex: 'category_name', key: 'category_name' },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', render: (v: number, r: any) => <Tag color={v <= r.min_stock ? 'red' : 'green'}>{v}</Tag> },
    { title: 'Stock Mín.', dataIndex: 'min_stock', key: 'min_stock' },
    { title: 'Precio Venta', dataIndex: 'sale_price', key: 'sale_price', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
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
        <Typography.Title level={4}>Inventario / Productos</Typography.Title>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nuevo Producto</Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Producto' : 'Nuevo Producto'}
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
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="sku" label="SKU">
              <Input />
            </Form.Item>
            <Form.Item name="category" label="Categoría" style={{ width: 250 }}>
              <Select allowClear options={(Array.isArray(categories) ? categories : []).map((c: any) => ({ value: c.id, label: c.name }))} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Descripción">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="stock" label="Stock">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="min_stock" label="Stock Mínimo">
              <InputNumber min={0} />
            </Form.Item>
            <Form.Item name="purchase_price" label="Precio Compra">
              <InputNumber prefix="Bs." min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="sale_price" label="Precio Venta">
              <InputNumber prefix="Bs." min={0} step={0.01} />
            </Form.Item>
          </Space>
          <Form.Item name="is_active" label="Activo">
            <Select options={[{ value: true, label: 'Sí' }, { value: false, label: 'No' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
