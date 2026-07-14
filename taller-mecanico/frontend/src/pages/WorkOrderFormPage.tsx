import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card, Form, Select, InputNumber, Button, Space, Typography, message, Spin, Divider,
  Table, Tag,
} from 'antd'
import { PlusOutlined, DeleteOutlined, PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { generateWorkOrderPdf } from '../utils/workOrderPdf'

import { useState } from 'react'

const vehicleTypes = [
  { value: 'automovil', label: 'Automóvil' },
  { value: 'vagoneta', label: 'Vagoneta' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'camion', label: 'Camión' },
  { value: 'trufi', label: 'Trufi' },
  { value: 'micro', label: 'Micro' },
]

const statusLabels: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: 'Pendiente' },
  in_progress: { color: 'blue', label: 'En Progreso' },
  completed: { color: 'green', label: 'Completado' },
  invoiced: { color: 'purple', label: 'Facturado' },
  cancelled: { color: 'red', label: 'Cancelado' },
}

export default function WorkOrderFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const isEdit = Boolean(id)
  const role = user?.role
  const isMechanic = role === 'mechanic'
  const [vehicleType, setVehicleType] = useState<string | null>(null)
  const [servicesRows, setServicesRows] = useState<any[]>([])
  const [productsRows, setProductsRows] = useState<any[]>([])

  useEffect(() => {
    if (!isEdit && isMechanic) {
      message.warning('No tienes permisos para crear órdenes')
      navigate('/work-orders')
    }
  }, [isEdit, isMechanic, navigate])

  const { data: order, isLoading: loadingOrder } = useQuery({
    queryKey: ['work-order', id],
    queryFn: () => api.get(`/work-orders/${id}/`).then(r => r.data),
    enabled: isEdit,
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => api.get('/customers/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
    enabled: !isMechanic,
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-select'],
    queryFn: () => api.get('/vehicles/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
    enabled: !isMechanic,
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-select'],
    queryFn: () => api.get('/employees/', { params: { is_active: true } }).then(r => r.data?.results || r.data),
    enabled: !isMechanic,
  })

  const { data: services } = useQuery({
    queryKey: ['services-select'],
    queryFn: () => api.get('/services/', { params: { is_active: true, page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const { data: products } = useQuery({
    queryKey: ['products-select'],
    queryFn: () => api.get('/products/', { params: { is_active: true, page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const servicesList = Array.isArray(services) ? services : []
  const productsList = Array.isArray(products) ? products : []

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/work-orders/', values),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      message.success('Orden creada')
      navigate(`/work-orders/${res.data.id}`)
    },
    onError: () => message.error('Error al crear la orden'),
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/work-orders/${id}/`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-order', id] })
      message.success('Orden actualizada')
    },
    onError: () => message.error('Error al actualizar'),
  })

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.post(`/work-orders/${id}/change_status/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['work-order', id] })
      message.success('Estado actualizado')
    },
    onError: (err: any) => message.error(err?.response?.data?.error || 'Error al actualizar estado'),
  })

  useEffect(() => {
    if (order) {
      form.setFieldsValue(order)
      if (order.vehicle) {
        const veh = (Array.isArray(vehicles) ? vehicles : []).find((v: any) => v.id === order.vehicle)
        if (veh) setVehicleType(veh.vehicle_type)
      }
      setServicesRows(order.services?.map((s: any) => ({
        service: s.service,
        service_name: s.service_name,
        price: Number(s.price),
        quantity: s.quantity,
        notes: s.notes,
      })) || [])
      setProductsRows(order.products?.map((p: any) => ({
        product: p.product,
        product_name: p.product_name,
        price: Number(p.price),
        quantity: p.quantity,
        notes: p.notes,
      })) || [])
    }
  }, [order, vehicles, form])

  const getVehicleType = (vehicleId: number): string | null => {
    const veh = (Array.isArray(vehicles) ? vehicles : []).find((v: any) => v.id === vehicleId)
    return veh?.vehicle_type || null
  }

  const getServicePrice = (serviceId: number): number => {
    const svc = servicesList.find((s: any) => s.id === serviceId)
    if (!svc) return 0
    if (vehicleType && svc.vehicle_prices?.length) {
      const match = svc.vehicle_prices.find((p: any) => p.vehicle_type === vehicleType)
      if (match) return Number(match.price)
    }
    return Number(svc.price || 0)
  }

  const getProductPrice = (productId: number): number => {
    const prod = productsList.find((p: any) => p.id === productId)
    return Number(prod?.sale_price || 0)
  }

  const updateServiceRow = (index: number, field: string, value: any) => {
    const updated = [...servicesRows]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'service') {
      const svc = servicesList.find((s: any) => s.id === value)
      updated[index].service_name = svc?.name || ''
      updated[index].price = getServicePrice(value)
    }
    setServicesRows(updated)
  }

  const addServiceRow = () => {
    setServicesRows([...servicesRows, { service: undefined, service_name: '', price: 0, quantity: 1, notes: '' }])
  }

  const removeServiceRow = (index: number) => {
    setServicesRows(servicesRows.filter((_, i) => i !== index))
  }

  const updateProductRow = (index: number, field: string, value: any) => {
    const updated = [...productsRows]
    updated[index] = { ...updated[index], [field]: value }
    if (field === 'product') {
      const prod = productsList.find((p: any) => p.id === value)
      updated[index].product_name = prod?.name || ''
      updated[index].price = getProductPrice(value)
    }
    setProductsRows(updated)
  }

  const addProductRow = () => {
    setProductsRows([...productsRows, { product: undefined, product_name: '', price: 0, quantity: 1, notes: '' }])
  }

  const removeProductRow = (index: number) => {
    setProductsRows(productsRows.filter((_, i) => i !== index))
  }

  const calcTotal = () => {
    const svcTotal = servicesRows.reduce((sum, r) => sum + (Number(r.price) || 0) * (Number(r.quantity) || 1), 0)
    const prodTotal = productsRows.reduce((sum, r) => sum + (Number(r.price) || 0) * (Number(r.quantity) || 1), 0)
    return svcTotal + prodTotal
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const payload = {
        ...values,
        total: calcTotal(),
        services_data: servicesRows.map(r => ({
          service: r.service,
          quantity: r.quantity || 1,
          price: r.price || 0,
          notes: r.notes || '',
        })),
        products_data: productsRows.map(r => ({
          product: r.product,
          quantity: r.quantity || 1,
          price: r.price || 0,
          notes: r.notes || '',
        })),
      }
      if (isEdit) {
        updateMutation.mutate(payload)
      } else {
        createMutation.mutate(payload)
      }
    }).catch(() => {})
  }

  const handleComplete = () => {
    statusMutation.mutate('completed')
  }

  const serviceColumns = [
    { title: 'Servicio', dataIndex: 'service', key: 'service', width: 250,
      render: (_: any, __: any, index: number) => (
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          value={servicesRows[index]?.service}
          onChange={(v) => updateServiceRow(index, 'service', v)}
          options={servicesList.map((s: any) => ({ value: s.id, label: s.name }))}
        />
      ),
    },
    { title: 'Precio', dataIndex: 'price', key: 'price', width: 120,
      render: (_: any, __: any, index: number) => (
        <InputNumber
          prefix="Bs."
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={servicesRows[index]?.price}
          onChange={(v) => updateServiceRow(index, 'price', v)}
        />
      ),
    },
    { title: 'Cant.', dataIndex: 'quantity', key: 'quantity', width: 80,
      render: (_: any, __: any, index: number) => (
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          value={servicesRows[index]?.quantity}
          onChange={(v) => updateServiceRow(index, 'quantity', v)}
        />
      ),
    },
    { title: 'Subtotal', key: 'subtotal', width: 100,
      render: (_: any, __: any, index: number) => {
        const row = servicesRows[index]
        return `Bs. ${((Number(row?.price) || 0) * (Number(row?.quantity) || 1)).toFixed(2)}`
      },
    },
    { title: '', key: 'action', width: 50,
      render: (_: any, __: any, index: number) => (
        <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removeServiceRow(index)} />
      ),
    },
  ]

  const productColumns = [
    { title: 'Producto', dataIndex: 'product', key: 'product', width: 250,
      render: (_: any, __: any, index: number) => (
        <Select
          showSearch
          optionFilterProp="label"
          style={{ width: '100%' }}
          value={productsRows[index]?.product}
          onChange={(v) => updateProductRow(index, 'product', v)}
          options={productsList.map((p: any) => ({ value: p.id, label: p.name }))}
        />
      ),
    },
    { title: 'Precio', dataIndex: 'price', key: 'price', width: 120,
      render: (_: any, __: any, index: number) => (
        <InputNumber
          prefix="Bs."
          min={0}
          step={0.01}
          style={{ width: '100%' }}
          value={productsRows[index]?.price}
          onChange={(v) => updateProductRow(index, 'price', v)}
        />
      ),
    },
    { title: 'Cant.', dataIndex: 'quantity', key: 'quantity', width: 80,
      render: (_: any, __: any, index: number) => (
        <InputNumber
          min={1}
          style={{ width: '100%' }}
          value={productsRows[index]?.quantity}
          onChange={(v) => updateProductRow(index, 'quantity', v)}
        />
      ),
    },
    { title: 'Subtotal', key: 'subtotal', width: 100,
      render: (_: any, __: any, index: number) => {
        const row = productsRows[index]
        return `Bs. ${((Number(row?.price) || 0) * (Number(row?.quantity) || 1)).toFixed(2)}`
      },
    },
    { title: '', key: 'action', width: 50,
      render: (_: any, __: any, index: number) => (
        <Button icon={<DeleteOutlined />} size="small" danger onClick={() => removeProductRow(index)} />
      ),
    },
  ]

  const handlePrint = async () => {
    await generateWorkOrderPdf({ workOrder: order, userName: user?.username || user?.first_name || '—' })
  }

  if (!isEdit && isMechanic) return null

  if (isEdit && loadingOrder) return <Spin style={{ display: 'block', margin: '100px auto' }} />

  const currentStatus = order?.status

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Typography.Title level={4}>{isEdit ? 'Orden de Trabajo #' + id : 'Nueva Orden de Trabajo'}</Typography.Title>
      {currentStatus && (
        <Tag color={statusLabels[currentStatus]?.color} style={{ marginBottom: 8 }}>
          {statusLabels[currentStatus]?.label || currentStatus}
        </Tag>
      )}
      <Card
        extra={
          <Space>
            {isEdit && !isMechanic && (
              <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Imprimir</Button>
            )}
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!isMechanic && (
            <Space style={{ display: 'flex' }} align="start" size={16}>
              <Form.Item name="customer" label="Cliente" rules={[{ required: true }]} style={{ width: 250 }}>
                <Select
                  disabled
                  showSearch
                  optionFilterProp="label"
                  options={(Array.isArray(customers) ? customers : []).map((c: any) => ({
                    value: c.id,
                    label: `${c.first_name} ${c.last_name}`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="vehicle" label="Vehículo" rules={[{ required: true }]} style={{ width: 250 }}>
                <Select
                  disabled
                  showSearch
                  optionFilterProp="label"
                  onChange={(val) => setVehicleType(getVehicleType(val))}
                  options={(Array.isArray(vehicles) ? vehicles : []).map((v: any) => ({
                    value: v.id,
                    label: `${v.plate} - ${v.brand} ${v.model}`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="assigned_to" label="Enc. de Recepción" style={{ width: 200 }}>
                <Select
                  disabled
                  options={(Array.isArray(employees) ? employees : []).map((e: any) => ({
                    value: e.id,
                    label: e.full_name,
                  }))}
                />
              </Form.Item>
            </Space>
          )}

          <Divider orientation="left">Servicios</Divider>
          {vehicleType && (
            <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
              Precios basados en tipo: {vehicleTypes.find(t => t.value === vehicleType)?.label || vehicleType}
            </Typography.Text>
          )}
          <Table
            dataSource={servicesRows}
            columns={serviceColumns}
            rowKey={(_, i) => String(i)}
            pagination={false}
            footer={() => (
              <Button type="dashed" icon={<PlusOutlined />} onClick={addServiceRow}>Agregar Servicio</Button>
            )}
            style={{ marginBottom: 16 }}
          />

          <Divider orientation="left">Productos</Divider>
          <Table
            dataSource={productsRows}
            columns={productColumns}
            rowKey={(_, i) => String(i)}
            pagination={false}
            footer={() => (
              <Button type="dashed" icon={<PlusOutlined />} onClick={addProductRow}>Agregar Producto</Button>
            )}
            style={{ marginBottom: 16 }}
          />

          <Typography.Title level={5} style={{ textAlign: 'right' }}>
            Total: Bs. {calcTotal().toFixed(2)}
          </Typography.Title>

          <Divider />
          <Space>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending || updateMutation.isPending}>
              {isEdit ? 'Actualizar' : 'Crear Orden'}
            </Button>
            {isEdit && isMechanic && currentStatus === 'in_progress' && (
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={statusMutation.isPending}
                onClick={handleComplete}
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                Completar Orden
              </Button>
            )}
            <Button onClick={() => navigate('/work-orders')}>Cancelar</Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
