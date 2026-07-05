import { useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, Space, Typography, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { generatePdfReport } from '../utils/pdfReport'

export default function EmployeesPage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => api.get('/employees/').then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (values: any) => api.post('/employees/', { ...values, hire_date: values.hire_date?.format('YYYY-MM-DD') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setOpen(false); form.resetFields(); message.success('Empleado creado') },
  })

  const updateMutation = useMutation({
    mutationFn: (values: any) => api.patch(`/employees/${editing.id}/`, { ...values, hire_date: values.hire_date?.format('YYYY-MM-DD') }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); setOpen(false); setEditing(null); form.resetFields(); message.success('Empleado actualizado') },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/employees/${id}/`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['employees'] }); message.success('Empleado eliminado') },
  })

  const columns = [
    { title: 'Nro', key: 'nro', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'CI', dataIndex: 'ci', key: 'ci', width: 120 },
    { title: 'Nombre', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Usuario', dataIndex: 'username_display', key: 'username_display' },
    { title: 'Cargo', dataIndex: 'position', key: 'position' },
    { title: 'Especialidad', dataIndex: 'specialization', key: 'specialization' },
    { title: 'Teléfono', dataIndex: 'phone', key: 'phone' },
    { title: 'Salario', dataIndex: 'salary', key: 'salary', render: (v: number | string) => Number(v || 0) > 0 ? `Bs. ${Number(v).toFixed(2)}` : '-' },
    { title: 'Comisión', dataIndex: 'commission_percentage', key: 'commission_percentage', render: (v: number | string) => `${Number(v || 0)}%` },
    { title: 'Activo', dataIndex: 'is_active', key: 'is_active', render: (v: boolean) => v ? <Tag color="green">Sí</Tag> : <Tag color="red">No</Tag> },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => { 
            setEditing(record); 
            form.setFieldsValue({ 
              ...record, 
              first_name_input: record.first_name, 
              last_name_input: record.last_name, 
              role_input: record.role, 
              email_input: record.email, 
              username: record.username_display, 
              hire_date: record.hire_date ? dayjs(record.hire_date) : null,
            }); 
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
        <Typography.Title level={4}>Empleados</Typography.Title>
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={() => {
            const rows = data?.results || data || []
            generatePdfReport({
              title: 'Lista de Empleados',
              columns: [
                { header: 'CI', dataKey: 'ci' },
                { header: 'Nombre', dataKey: 'full_name' },
                { header: 'Usuario', dataKey: 'username_display' },
                { header: 'Cargo', dataKey: 'position' },
                { header: 'Teléfono', dataKey: 'phone' },
              ],
              rows,
              userName: user?.username,
            })
          }}>Reporte PDF</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); form.resetFields(); setOpen(true) }}>Nuevo Empleado</Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title={editing ? 'Editar Empleado' : 'Nuevo Empleado'}
        open={open}
        onCancel={() => { setOpen(false); setEditing(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
        width={600}
        maskClosable={false}
      >
        <Form form={form} layout="vertical" onFinish={values => editing ? updateMutation.mutate(values) : createMutation.mutate(values)}>
          <Form.Item name="ci" label="CI" rules={[{ required: true, message: 'Ingresa el CI del empleado' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="first_name_input" label="Nombres" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="last_name_input" label="Apellidos" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="username" label="Usuario" rules={[{ required: true, message: 'Ingresa el nombre de usuario' }]}>
            <Input disabled={!!editing} />
          </Form.Item>
          <Form.Item name="password" label="Contraseña" rules={editing ? [] : [{ required: true, message: 'Ingresa la contraseña' }]}>
            <Input.Password />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="role_input" label="Rol" rules={[{ required: true }]}>
              <Select options={[
                { value: 'admin', label: 'Administrador' },
                { value: 'mechanic', label: 'Mecánico' },
                { value: 'receptionist', label: 'Recepcionista' },
              ]} />
            </Form.Item>
            <Form.Item name="email_input" label="Email">
              <Input type="email" />
            </Form.Item>
          </Space>
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="position" label="Cargo">
              <Input placeholder="Ej: Mecánico Senior" />
            </Form.Item>
            <Form.Item name="specialization" label="Especialidad" style={{ width: 250 }}>
              <Input placeholder="Ej: Motores Diesel" />
            </Form.Item>
          </Space>
          <Form.Item name="phone" label="Teléfono">
            <Input />
          </Form.Item>
          <Space style={{ display: 'flex' }} align="start" size={16}>
            <Form.Item name="salary" label="Salario">
              <InputNumber prefix="Bs." min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="commission_percentage" label="% Comisión">
              <InputNumber min={0} max={100} step={0.1} />
            </Form.Item>
            <Form.Item name="hire_date" label="Fecha de Contratación">
              <DatePicker />
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
