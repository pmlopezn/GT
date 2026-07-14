import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card, Form, Input, InputNumber, Select, Checkbox, Radio, Button, Space, Typography,
  message, Spin, Row, Col, Divider, Table, Tag, Descriptions, Empty, Tooltip,
} from 'antd'
import { CarOutlined, HistoryOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

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

export default function ReceptionPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [form] = Form.useForm()
  const [selectedVehicle, setSelectedVehicle] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-select'],
    queryFn: () => api.get('/vehicles/', { params: { page_size: 500 } }).then(r => r.data?.results || r.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-select'],
    queryFn: () => api.get('/customers/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-insp'],
    queryFn: () => api.get('/employees/', { params: { is_active: true } }).then(r => r.data?.results || r.data),
  })

  const currentEmployee = (Array.isArray(employees) ? employees : []).find((e: any) => e.user === user?.id)

  useEffect(() => {
    if (currentEmployee) {
      form.setFieldsValue({ inspected_by: currentEmployee.id })
    }
  }, [currentEmployee, form])

  const { data: vehicleHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ['vehicle-history', selectedVehicle],
    queryFn: () => api.get('/work-orders/', { params: { vehicle: selectedVehicle, page_size: 100 } }).then(r => r.data?.results || r.data),
    enabled: !!selectedVehicle,
  })

  const vehicle = (Array.isArray(vehicles) ? vehicles : []).find((v: any) => v.id === selectedVehicle)
  const customer = vehicle ? (Array.isArray(customers) ? customers : []).find((c: any) => c.id === vehicle.customer) : null

  const createInspectionMutation = useMutation({
    mutationFn: async (values: any) => {
      const workOrderPayload = {
        customer: vehicle?.customer,
        vehicle: selectedVehicle,
        assigned_to: values.inspected_by || null,
        total: 0,
        services_data: [],
        products_data: [],
      }
      const woRes = await api.post('/work-orders/', workOrderPayload)
      const woId = woRes.data.id
      const inspPayload = { ...values }
      delete inspPayload.inspected_by
      await api.patch(`/work-orders/${woId}/inspection/`, { ...inspPayload, inspected_by: values.inspected_by || null })
      return woId
    },
    onSuccess: (woId) => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-history', selectedVehicle] })
      queryClient.invalidateQueries({ queryKey: ['work-orders'] })
      queryClient.invalidateQueries({ queryKey: ['receptions-list'] })
      message.success('Recepción creada. Ahora agrega los servicios y productos.')
      navigate(`/work-orders/${woId}`)
    },
    onError: () => {
      message.error('Error al crear la recepción')
      setCreating(false)
    },
  })

  const handleSubmit = (values: any) => {
    if (!selectedVehicle) return message.warning('Selecciona un vehículo')
    setCreating(true)
    createInspectionMutation.mutate(values)
  }

  const { data: allReceptions, isLoading: loadingReceptions } = useQuery({
    queryKey: ['receptions-list'],
    queryFn: () => api.get('/work-orders/', { params: { page_size: 100 } }).then(r => r.data?.results || r.data),
  })

  const historyColumns = [
    { title: 'OT #', dataIndex: 'id', key: 'id', width: 70 },
    { title: 'Mecánico', dataIndex: 'assigned_to_name', key: 'assigned_to_name' },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const st = statusLabels[s] || { color: 'default', label: s }
        return <Tag color={st.color}>{st.label}</Tag>
      },
    },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
    {
      title: 'Creado', dataIndex: 'created_at', key: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
  ]

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Typography.Title level={4}><CarOutlined /> Recepción de Vehículo</Typography.Title>

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Form.Item label="Seleccionar Vehículo" style={{ marginBottom: 0 }}>
            <Select
              showSearch
              optionFilterProp="label"
              style={{ width: 400 }}
              placeholder="Buscar vehículo por placa, marca o modelo..."
              value={selectedVehicle}
              onChange={setSelectedVehicle}
              options={(Array.isArray(vehicles) ? vehicles : []).map((v: any) => {
                const c = (Array.isArray(customers) ? customers : []).find((cx: any) => cx.id === v.customer)
                return {
                  value: v.id,
                  label: `${v.plate} - ${v.brand} ${v.model} (${c?.first_name || ''} ${c?.last_name || ''})`,
                }
              })}
            />
          </Form.Item>

          {vehicle && (
            <Descriptions size="small" column={3} bordered>
              <Descriptions.Item label={<strong>Placa</strong>}>{vehicle.plate}</Descriptions.Item>
              <Descriptions.Item label={<strong>Marca</strong>}>{vehicle.brand}</Descriptions.Item>
              <Descriptions.Item label={<strong>Modelo</strong>}>{vehicle.model}</Descriptions.Item>
              <Descriptions.Item label={<strong>Año</strong>}>{vehicle.year}</Descriptions.Item>
              <Descriptions.Item label={<strong>Color</strong>}>{vehicle.color}</Descriptions.Item>
              <Descriptions.Item label={<strong>Tipo</strong>}>{vehicleTypes.find(t => t.value === vehicle.vehicle_type)?.label || vehicle.vehicle_type}</Descriptions.Item>
              <Descriptions.Item label={<strong>Cliente</strong>} span={2}>
                {customer ? `${customer.first_name} ${customer.last_name} - ${customer.phone}` : '—'}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      </Card>

      {selectedVehicle && (
        <>
          <Card
            title={<><HistoryOutlined /> Historial de Órdenes</>}
            style={{ marginBottom: 16 }}
          >
            {loadingHistory ? <Spin /> : (
              Array.isArray(vehicleHistory) && vehicleHistory.length > 0 ? (
                <Table
                  dataSource={vehicleHistory}
                  columns={historyColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <Empty description="Sin órdenes previas para este vehículo" />
              )
            )}
          </Card>

          <Card title="Inspección de Recepción">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{}}
            >
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Datos Generales</Typography.Text>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="Kilometraje" style={{ marginBottom: 0 }}>
                    <Space.Compact style={{ width: '100%' }}>
                      <Form.Item name="mileage_in" rules={[{ required: true, message: 'Ingresa el kilometraje' }]} style={{ marginBottom: 0, width: '70%' }}>
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                      </Form.Item>
                      <Form.Item name="mileage_unit" style={{ marginBottom: 0, width: '30%' }} initialValue="KM">
                        <Select options={[
                          { value: 'KM', label: 'KM' },
                          { value: 'Millas', label: 'Millas' },
                        ]} />
                      </Form.Item>
                    </Space.Compact>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="fuel_level" label="Nivel Combustible">
                    <Select allowClear options={[
                      { value: '1/4', label: '1/4' },
                      { value: '1/2', label: '1/2' },
                      { value: '3/4', label: '3/4' },
                      { value: 'Full', label: 'Full' },
                    ]} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="inspected_by" label="Recepcionó">
                    <Select
                      disabled
                      placeholder="Seleccionar empleado"
                      options={(Array.isArray(employees) ? employees : []).map((e: any) => ({ value: e.id, label: e.full_name }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Luces</Typography.Text>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={5} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Izquierdo</Typography.Text></Col>
                <Col span={10}><Typography.Text strong style={{ fontSize: 12 }}>Derecho</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Luz media</Typography.Text></Col>
                <Col span={9}><Form.Item name="light_medium_left_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="light_medium_right_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Luz baja</Typography.Text></Col>
                <Col span={9}><Form.Item name="light_low_left_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="light_low_right_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Luz alta</Typography.Text></Col>
                <Col span={9}><Form.Item name="light_high_left_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="light_high_right_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Luces de giro</Typography.Text></Col>
                <Col span={9}><Form.Item name="light_turn_left_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="light_turn_right_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={5} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Adelante</Typography.Text></Col>
                <Col span={10}><Typography.Text strong style={{ fontSize: 12 }}>Atrás</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Luces de placa</Typography.Text></Col>
                <Col span={9}><Form.Item name="light_plate_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="light_plate_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Funciona</Radio><Radio value={false}>No funciona</Radio></Radio.Group></Form.Item></Col>
              </Row>

              <Divider />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Vidrios</Typography.Text>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Delantero</Typography.Text></Col>
                <Col span={19}><Form.Item name="glass_windshield_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Trasero</Typography.Text></Col>
                <Col span={19}><Form.Item name="glass_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={5} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Izquierdo</Typography.Text></Col>
                <Col span={10}><Typography.Text strong style={{ fontSize: 12 }}>Derecho</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Puerta delantera</Typography.Text></Col>
                <Col span={9}><Form.Item name="glass_left_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="glass_right_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Puerta trasera</Typography.Text></Col>
                <Col span={9}><Form.Item name="glass_left_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="glass_right_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={5}><Typography.Text>Ventilete trasero</Typography.Text></Col>
                <Col span={9}><Form.Item name="glass_left_quarter_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
                <Col span={10}><Form.Item name="glass_right_quarter_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Dañado</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Form.Item name="glass_notes" label="Notas de vidrios">
                <Input.TextArea rows={2} placeholder="Observaciones..." />
              </Form.Item>

              <Divider />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Exterior</Typography.Text>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Antena de radio</Typography.Text></Col>
                <Col span={18}><Form.Item name="exterior_antenna_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={6} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Izquierdo</Typography.Text></Col>
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Derecho</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Espejos laterales</Typography.Text></Col>
                <Col span={9}><Form.Item name="exterior_mirror_left_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
                <Col span={9}><Form.Item name="exterior_mirror_right_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Typography.Text strong style={{ display: 'block', margin: '8px 0 4px' }}>Limpiaparabrisas</Typography.Text>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={6} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Izquierdo</Typography.Text></Col>
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Derecho</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Delanteros</Typography.Text></Col>
                <Col span={9}><Form.Item name="exterior_wiper_front_left_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
                <Col span={9}><Form.Item name="exterior_wiper_front_right_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Trasero</Typography.Text></Col>
                <Col span={18}><Form.Item name="exterior_wiper_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Typography.Text strong style={{ display: 'block', margin: '8px 0 4px' }}>Tapón de rueda</Typography.Text>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={6} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Delantera</Typography.Text></Col>
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Trasera</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Izquierda</Typography.Text></Col>
                <Col span={9}><Form.Item name="exterior_wheel_cap_left_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
                <Col span={9}><Form.Item name="exterior_wheel_cap_left_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Derecha</Typography.Text></Col>
                <Col span={9}><Form.Item name="exterior_wheel_cap_right_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
                <Col span={9}><Form.Item name="exterior_wheel_cap_right_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Tapa de gasolina</Typography.Text></Col>
                <Col span={18}><Form.Item name="exterior_gas_cap_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={6} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Adelante</Typography.Text></Col>
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Atrás</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Placas</Typography.Text></Col>
                <Col span={9}><Form.Item name="exterior_plate_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
                <Col span={9}><Form.Item name="exterior_plate_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 4 }}>
                <Col span={6} />
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Delantero</Typography.Text></Col>
                <Col span={9}><Typography.Text strong style={{ fontSize: 12 }}>Trasero</Typography.Text></Col>
              </Row>
              <Row gutter={16} style={{ marginBottom: 6, alignItems: 'center' }}>
                <Col span={6}><Typography.Text>Parachoque</Typography.Text></Col>
                <Col span={9}><Form.Item name="exterior_bumper_front_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
                <Col span={9}><Form.Item name="exterior_bumper_rear_ok" style={{ marginBottom: 0 }}><Radio.Group size="small"><Radio value={true}>Bueno</Radio><Radio value={false}>Malo</Radio></Radio.Group></Form.Item></Col>
              </Row>
              <Form.Item name="exterior_dents_detail" label="Abolladuras">
                <Input.TextArea rows={2} placeholder="Describir abolladuras..." />
              </Form.Item>
              <Form.Item name="exterior_scratches_detail" label="Rayones">
                <Input.TextArea rows={2} placeholder="Describir rayones..." />
              </Form.Item>
              <Form.Item name="exterior_notes" label="Notas del exterior">
                <Input.TextArea rows={2} placeholder="Observaciones adicionales..." />
              </Form.Item>

              <Divider />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Interior</Typography.Text>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="has_damaged_seats" valuePropName="checked"><Checkbox>Asientos Dañados</Checkbox></Form.Item></Col>
                <Col span={8}><Form.Item name="has_bad_odor" valuePropName="checked"><Checkbox>Mal Olor</Checkbox></Form.Item></Col>
                <Col span={8}><Form.Item name="has_dashboard_warning" valuePropName="checked"><Checkbox>Luces Tablero</Checkbox></Form.Item></Col>
              </Row>
              <Form.Item name="dashboard_warning_detail" label="Detalle de advertencias en tablero">
                <Input.TextArea rows={2} placeholder="Qué luces están encendidas..." />
              </Form.Item>
              <Form.Item name="interior_notes" label="Notas del interior">
                <Input.TextArea rows={2} placeholder="Observaciones adicionales..." />
              </Form.Item>

              <Divider />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Llantas y Herramientas</Typography.Text>
              <Row gutter={16}>
                <Col span={8}><Form.Item name="spare_tire_present" valuePropName="checked"><Checkbox>Llanta de Repuesto</Checkbox></Form.Item></Col>
                <Col span={8}><Form.Item name="jack_present" valuePropName="checked"><Checkbox>Gato</Checkbox></Form.Item></Col>
              </Row>
              <Form.Item name="tire_condition" label="Estado de llantas">
                <Input.TextArea rows={2} placeholder="Desgaste, presión, etc..." />
              </Form.Item>

              <Divider />
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Documentos</Typography.Text>
              <Form.Item name="documents_ok" valuePropName="checked">
                <Checkbox>Documentos en regla (tarjeta circulación, seguro)</Checkbox>
              </Form.Item>
              <Form.Item name="documents_notes" label="Notas de documentos">
                <Input.TextArea rows={2} placeholder="Observaciones..." />
              </Form.Item>

              <Divider />
              <Form.Item name="customer_acknowledged" valuePropName="checked">
                <Checkbox>El cliente reconoce el estado del vehículo descrito</Checkbox>
              </Form.Item>

              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={creating}
                  icon={<CarOutlined />}
                  size="large"
                >
                  Iniciar Recepción y Crear Orden
                </Button>
                <Button onClick={() => form.resetFields()}>Restablecer</Button>
              </Space>
            </Form>
          </Card>
        </>
      )}

      <Card
        title={<><HistoryOutlined /> Recepciones Registradas</>}
        style={{ marginTop: 16 }}
      >
        {loadingReceptions ? <Spin /> : (
          <Table
            dataSource={Array.isArray(allReceptions) ? allReceptions : []}
            columns={[
              { title: 'Nro', key: 'nro', render: (_: any, __: any, i: number) => i + 1, width: 60 },
              { title: 'Vehículo', dataIndex: 'vehicle_info', key: 'vehicle_info' },
              { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
              { title: 'Enc. de Recepción', dataIndex: 'assigned_to_name', key: 'assigned_to_name' },
              {
                title: 'Creado', dataIndex: 'created_at', key: 'created_at',
                render: (v: string) => new Date(v).toLocaleDateString(),
              },
              {
                title: 'Acción', key: 'action',
                render: (_: any, r: any) => (
                  <Tooltip title="Ver detalle">
                    <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/reception/${r.id}`)} />
                  </Tooltip>
                ),
              },
            ]}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
          />
        )}
      </Card>
    </div>
  )
}
