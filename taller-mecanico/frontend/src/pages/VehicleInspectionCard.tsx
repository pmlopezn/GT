import { Card, Form, Input, InputNumber, Select, Checkbox, Button, Space, Typography, Spin, message, Row, Col, Divider } from 'antd'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

interface Props {
  workOrderId: number
}

export default function VehicleInspectionCard({ workOrderId }: Props) {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', workOrderId],
    queryFn: () => api.get(`/work-orders/${workOrderId}/inspection/`).then(r => r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-insp'],
    queryFn: () => api.get('/employees/', { params: { is_active: true } }).then(r => r.data?.results || r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/work-orders/${workOrderId}/inspection/`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inspection', workOrderId] })
      queryClient.invalidateQueries({ queryKey: ['work-order', workOrderId] })
      message.success('Inspección guardada')
    },
    onError: () => message.error('Error al guardar inspección'),
  })

  if (isLoading) return <Spin style={{ display: 'block', margin: 24 }} />

  return (
    <Card title="Inspección de Recepción" style={{ marginTop: 16 }}>
      <Form
        form={form}
        layout="vertical"
        initialValues={inspection || {}}
        onFinish={values => saveMutation.mutate(values)}
      >
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Datos Generales</Typography.Text>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="mileage_in" label="Kilometraje">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="km" />
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
            <Form.Item name="inspected_by" label="Inspeccionado por">
              <Select allowClear options={(Array.isArray(employees) ? employees : []).map((e: any) => ({ value: e.id, label: e.full_name }))} />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>Exterior</Typography.Text>
        <Row gutter={16}>
          <Col span={8}><Form.Item name="has_dents" valuePropName="checked"><Checkbox>Abolladuras</Checkbox></Form.Item></Col>
          <Col span={8}><Form.Item name="has_scratches" valuePropName="checked"><Checkbox>Rayones</Checkbox></Form.Item></Col>
          <Col span={8}><Form.Item name="has_rust" valuePropName="checked"><Checkbox>Oxido/Corrosión</Checkbox></Form.Item></Col>
          <Col span={8}><Form.Item name="has_paint_damage" valuePropName="checked"><Checkbox>Daño en Pintura</Checkbox></Form.Item></Col>
          <Col span={8}><Form.Item name="has_cracked_glass" valuePropName="checked"><Checkbox>Vidrios Rotos</Checkbox></Form.Item></Col>
          <Col span={8}><Form.Item name="has_missing_parts" valuePropName="checked"><Checkbox>Faltan Piezas</Checkbox></Form.Item></Col>
        </Row>
        <Form.Item name="missing_parts_detail" label="Detalle de piezas faltantes">
          <Input.TextArea rows={2} placeholder="Describir qué piezas faltan..." />
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
