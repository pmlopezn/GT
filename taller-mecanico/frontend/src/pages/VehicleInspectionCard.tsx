import { Card, Form, Input, InputNumber, Select, Checkbox, Radio, Button, Space, Typography, Spin, message, Row, Col, Divider } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { generateInspectionPdf } from '../utils/inspectionPdf'

interface Props {
  workOrderId: number
}

export default function VehicleInspectionCard({ workOrderId }: Props) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', workOrderId],
    queryFn: () => api.get(`/work-orders/${workOrderId}/inspection/`).then(r => r.data),
  })

  const { data: workOrder } = useQuery({
    queryKey: ['work-order-detail', workOrderId],
    queryFn: () => api.get(`/work-orders/${workOrderId}/`).then(r => r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-insp'],
    queryFn: () => api.get('/employees/', { params: { is_active: true } }).then(r => r.data?.results || r.data),
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicle-print'],
    queryFn: () => api.get('/vehicles/', { params: { page_size: 500 } }).then(r => r.data?.results || r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/work-orders/${workOrderId}/inspection/`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] })
      queryClient.invalidateQueries({ queryKey: ['work-order-detail', workOrderId] })
      message.success('Inspección guardada')
    },
    onError: () => message.error('Error al guardar inspección'),
  })

  const vehicle = workOrder?.vehicle_id
    ? (Array.isArray(vehicles) ? vehicles : []).find((v: any) => v.id === workOrder.vehicle_id)
    : null

  const handlePrint = async () => {
    await generateInspectionPdf({
      workOrder,
      inspection,
      vehicle,
      employees: Array.isArray(employees) ? employees : [],
      userName: user?.username || user?.first_name || '—',
    })
  }

  if (isLoading) return <Spin style={{ display: 'block', margin: 24 }} />

  return (
    <Card
      title="Inspección de Recepción"
      style={{ marginTop: 16 }}
      extra={<Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Imprimir</Button>}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={inspection || {}}
        onFinish={values => saveMutation.mutate(values)}
      >
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Datos Generales</Typography.Text>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Kilometraje" style={{ marginBottom: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="mileage_in" style={{ marginBottom: 0, width: '70%' }}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>
                <Form.Item name="mileage_unit" style={{ marginBottom: 0, width: '30%' }}>
                  <Select options={[
                    { value: 'KM', label: 'KM' },
                    { value: 'Millas', label: 'Millas' },
                  ]} />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="fuel_level" label="Nivel Combustible">
              <Select allowClear options={[
                { value: '1/4', label: '1/4' },
                { value: '1/2', label: '1/2' },
                { value: '3/4', label: '3/4' },
                { value: 'Full', label: 'Full' },
              ]} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="inspected_by" label="Enc. de Recepción">
              <Select
                disabled
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
          <Button type="primary" htmlType="submit" loading={saveMutation.isPending}>
            Guardar Inspección
          </Button>
          <Button onClick={() => form.resetFields()}>Restablecer</Button>
        </Space>
      </Form>
    </Card>
  )
}
