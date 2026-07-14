import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, Space, Typography, message, Popconfirm, Row, Col } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { generatePdfReport } from '../utils/pdfReport'

const baseVehicleTypes = [
  { value: 'automovil', label: 'Automóvil' },
  { value: 'vagoneta', label: 'Vagoneta' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'camion', label: 'Camión' },
  { value: 'trufi', label: 'Trufi' },
  { value: 'micro', label: 'Micro' },
]

const formatType = (v: string) =>
  baseVehicleTypes.find(t => t.value === v)?.label || v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')

const baseBrands = [
  'Toyota', 'Nissan', 'Suzuki', 'Honda', 'Chevrolet', 'Ford',
  'Volkswagen', 'BMW', 'Mercedes-Benz', 'Hyundai', 'Kia',
  'Mazda', 'Mitsubishi', 'Renault', 'Peugeot', 'Fiat',
  'Jeep', 'Dodge', 'Subaru', 'Volvo', 'Audi', 'Lexus',
  'Jaguar', 'Land Rover', 'Mini', 'Porsche',
  'Acura', 'Alfa Romeo', 'Aston Martin', 'Bentley', 'Buick',
  'Cadillac', 'Chery', 'Chrysler', 'Citroën', 'Dacia',
  'Daewoo', 'Daihatsu', 'Ferrari', 'GAC', 'Geely', 'GMC',
  'Great Wall', 'Haval', 'Hummer', 'Infiniti', 'Isuzu',
  'Iveco', 'JAC', 'Lamborghini', 'Lancia', 'Lincoln',
  'Lotus', 'Maserati', 'McLaren', 'MG', 'Morris', 'Opel',
  'Rolls-Royce', 'Saab', 'SEAT', 'Škoda', 'Smart',
  'SsangYong', 'Tesla', 'Vauxhall',
]

const formatBrand = (v: string) =>
  v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, ' ')

const yearOptions = Array.from({ length: 2026 - 1970 + 1 }, (_, i) => {
  const y = 1970 + i
  return { value: y, label: String(y) }
})

export default function VehiclesPage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['vehicles', search],
    queryFn: () => api.get('/vehicles/', { params: { search } }).then(r => r.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: () => api.get('/customers/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/vehicles/', values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setOpen(false); form.resetFields(); message.success('Vehículo creado') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/vehicles/${editing.id}/`, values),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Vehículo actualizado') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/vehicles/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['vehicles'] }); message.success('Vehículo eliminado') },
  })

  const columns = [
    { title: 'Nro', key: 'nro', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Placa', dataIndex: 'plate', key: 'plate' },
    { title: 'Tipo', dataIndex: 'vehicle_type', key: 'vehicle_type', render: (v: string) => formatType(v) },
    { title: 'Marca', dataIndex: 'brand', key: 'brand', render: (v: string) => formatBrand(v) },
    { title: 'Modelo', dataIndex: 'model', key: 'model' },
    { title: 'Año', dataIndex: 'year', key: 'year' },
    { title: 'Color', dataIndex: 'color', key: 'color' },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name', render: (_: any, r: any) => {
      const c = Array.isArray(customers) ? customers.find((c: any) => c.id === r.customer) : null
      return c ? `${c.first_name} ${c.last_name}` : r.customer
    }},
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => {
            setEditing(record)
            form.setFieldsValue({
              ...record,
              brand: record.brand ? [record.brand] : undefined,
              vehicle_type: record.vehicle_type ? [record.vehicle_type] : undefined,
            })
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
        <Typography.Title level={4}>Vehículos</Typography.Title>
        <Space>
          <Input prefix={<SearchOutlined />} placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
          <Button icon={<FilePdfOutlined />} onClick={() => {
            const rows = vehicles?.results || vehicles || []
            generatePdfReport({
              title: 'Lista de Vehículos',
              columns: [
                { header: 'Placa', dataKey: 'plate' },
                { header: 'Tipo', dataKey: '_type' },
                { header: 'Marca', dataKey: 'brand' },
                { header: 'Modelo', dataKey: 'model' },
                { header: 'Año', dataKey: 'year' },
                { header: 'Color', dataKey: 'color' },
                { header: 'Cliente', dataKey: '_customer' },
              ],
              rows: rows.map((r: any) => ({
                ...r,
                _type: formatType(r.vehicle_type),
                _customer: (Array.isArray(customers) ? customers : []).find((c: any) => c.id === r.customer)
                  ? `${((Array.isArray(customers) ? customers : []).find((c: any) => c.id === r.customer) as any).first_name} ${((Array.isArray(customers) ? customers : []).find((c: any) => c.id === r.customer) as any).last_name}`
                  : r.customer,
              })),
              userName: user?.username,
            })
          }}>Reporte PDF</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nuevo Vehículo</Button>
        </Space>
      </div>
      <Table dataSource={vehicles?.results || vehicles || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Vehículo' : 'Nuevo Vehículo'}
        open={open}
        maskClosable={false}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" onFinish={values => {
          const payload = {
            ...values,
            brand: Array.isArray(values.brand) ? values.brand[0] : values.brand,
            vehicle_type: Array.isArray(values.vehicle_type) ? values.vehicle_type[0] : values.vehicle_type,
          }
          editing ? updateMutation.mutate(payload) : createMutation.mutate(payload)
        }}>
          <Form.Item name="customer" label="Cliente" rules={[{ required: true }]}>
            <Select
              showSearch
              optionFilterProp="label"
              options={(Array.isArray(customers) ? customers : []).map((c: any) => ({
                value: c.id,
                label: `${c.first_name} ${c.last_name}`,
              }))}
            />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="plate" label="Placa" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vehicle_type" label="Tipo" rules={[{ required: true }]}>
                <Select
                  showSearch
                  mode="tags"
                  maxCount={1}
                  optionFilterProp="label"
                  placeholder="Selecciona o escribe un tipo"
                  options={[...new Set([
                    ...baseVehicleTypes.map(t => t.label),
                    ...(Array.isArray(vehicles?.results || vehicles) ? (vehicles?.results || vehicles).map((v: any) => formatType(v.vehicle_type)) : []),
                  ])].map(t => ({ value: t.toLowerCase().replace(/[\s-]/g, '_'), label: t }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="Marca" rules={[{ required: true }]}>
                <Select
                  showSearch
                  mode="tags"
                  maxCount={1}
                  optionFilterProp="label"
                  placeholder="Selecciona o escribe una marca"
                  options={[...new Set([
                    ...baseBrands,
                    ...(Array.isArray(vehicles?.results || vehicles) ? (vehicles?.results || vehicles).map((v: any) => formatBrand(v.brand)) : []),
                  ])].map(b => ({ value: b, label: b }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="model" label="Modelo" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="year" label="Año" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="label" options={yearOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="color" label="Color">
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vin" label="VIN">
                <Input maxLength={17} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Notas">
                <Input.TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}
