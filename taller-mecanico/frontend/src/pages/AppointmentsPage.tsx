import { useState } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Space, Typography, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { generatePdfReport } from '../utils/pdfReport'

const statusLabels: Record<string, string> = {
  scheduled: 'Programada',
  confirmed: 'Confirmada',
  in_progress: 'En Progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

export default function AppointmentsPage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => api.get('/appointments/').then(r => r.data),
  })

  const { data: customers } = useQuery({
    queryKey: ['customers-app'],
    queryFn: () => api.get('/customers/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-app'],
    queryFn: () => api.get('/vehicles/', { params: { page_size: 200 } }).then(r => r.data?.results || r.data),
  })

  const { data: employees } = useQuery({
    queryKey: ['employees-app'],
    queryFn: () => api.get('/employees/', { params: { is_active: true } }).then(r => r.data?.results || r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/appointments/', { ...values, date: values.date.format('YYYY-MM-DD'), time: values.time.format('HH:mm:ss') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setOpen(false); form.resetFields(); message.success('Cita creada') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/appointments/${editing.id}/`, { ...values, date: values.date.format('YYYY-MM-DD'), time: values.time.format('HH:mm:ss') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Cita actualizada') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/appointments/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['appointments'] }); message.success('Cita eliminada') },
  })

  const columns = [
    { title: 'Nro', key: 'nro', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'Vehículo', dataIndex: 'vehicle_info', key: 'vehicle_info' },
    { title: 'Fecha', dataIndex: 'date', key: 'date', render: (v: string) => dayjs(v).format('DD/MM/YYYY') },
    { title: 'Hora', dataIndex: 'time', key: 'time', render: (v: string) => v?.substring(0, 5) },
    { title: 'Mecánico', dataIndex: 'employee_name', key: 'employee_name' },
    { title: 'Estado', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{statusLabels[v] || v}</Tag> },
    { title: 'Descripción', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { setEditing(record); form.setFieldsValue({ ...record, date: dayjs(record.date), time: dayjs(record.time, 'HH:mm:ss') }); setOpen(true) }} />
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
        <Typography.Title level={4}>Agenda de Citas</Typography.Title>
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={() => {
            const rows = data?.results || data || []
            generatePdfReport({
              title: 'Agenda de Citas',
              columns: [
                { header: 'Cliente', dataKey: 'customer_name' },
                { header: 'Vehículo', dataKey: 'vehicle_info' },
                { header: 'Fecha', dataKey: 'date' },
                { header: 'Hora', dataKey: 'time' },
                { header: 'Mecánico', dataKey: 'employee_name' },
                { header: 'Estado', dataKey: 'status' },
              ],
              rows,
              userName: user?.username,
            })
          }}>Reporte PDF</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nueva Cita</Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Cita' : 'Nueva Cita'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={values => editing ? updateMutation.mutate(values) : createMutation.mutate(values)}>
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="customer" label="Cliente" rules={[{ required: true }]} style={{ width: 250 }}>
              <Select showSearch optionFilterProp="label" options={(Array.isArray(customers) ? customers : []).map((c: any) => ({ value: c.id, label: `${c.first_name} ${c.last_name}` }))} />
            </Form.Item>
            <Form.Item name="vehicle" label="Vehículo" rules={[{ required: true }]} style={{ width: 250 }}>
              <Select showSearch optionFilterProp="label" options={(Array.isArray(vehicles) ? vehicles : []).map((v: any) => ({ value: v.id, label: `${v.plate} - ${v.brand} ${v.model}` }))} />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="date" label="Fecha" rules={[{ required: true }]}>
              <DatePicker />
            </Form.Item>
            <Form.Item name="time" label="Hora" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
            <Form.Item name="employee" label="Mecánico">
              <Select allowClear style={{ width: 200 }} options={(Array.isArray(employees) ? employees : []).map((e: any) => ({ value: e.id, label: e.full_name }))} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Descripción">
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
