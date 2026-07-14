import { useState } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Typography, message, Tag } from 'antd'
import { PlusOutlined, DollarOutlined, FilePdfOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { generatePdfReport } from '../utils/pdfReport'

const statusLabels: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: 'Pendiente' },
  paid: { color: 'green', label: 'Pagada' },
  partial: { color: 'blue', label: 'Parcial' },
  cancelled: { color: 'red', label: 'Cancelada' },
}

export default function InvoicesPage() {
  const { user } = useAuth()
  const [payOpen, setPayOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices/').then(r => r.data),
  })

  const payMutation = useMutation({
    mutationFn: (values: any) => api.post('/payments/', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      setPayOpen(false)
      form.resetFields()
      message.success('Pago registrado')
    },
  })

  const columns = [
    { title: 'Nro', key: 'nro', width: 60, render: (_: any, __: any, i: number) => i + 1 },
    { title: 'Factura #', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Cliente', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'OT #', dataIndex: 'work_order_id', key: 'work_order_id' },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const st = statusLabels[s] || { color: 'default', label: s }
        return <Tag color={st.color}>{st.label}</Tag>
      },
    },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
    { title: 'IVA', dataIndex: 'tax', key: 'tax', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
    { title: 'Total', dataIndex: 'total', key: 'total', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
    { title: 'Pagado', dataIndex: 'paid_amount', key: 'paid_amount', render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}` },
    {
      title: 'Acciones', key: 'actions', width: 120,
      render: (_: any, record: any) => (
        record.status !== 'paid' && record.status !== 'cancelled' ? (
          <Button
            icon={<DollarOutlined />}
            size="small"
            type="primary"
            onClick={() => { setSelectedInvoice(record); setPayOpen(true) }}
          >
            Cobrar
          </Button>
        ) : null
      ),
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4}>Facturación</Typography.Title>
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={() => {
            const rows = data?.results || data || []
            generatePdfReport({
              title: 'Facturación',
              columns: [
                { header: 'Factura #', dataKey: 'id' },
                { header: 'Cliente', dataKey: 'customer_name' },
                { header: 'OT #', dataKey: 'work_order_id' },
                { header: 'Estado', dataKey: 'status' },
                { header: 'Subtotal', dataKey: 'subtotal' },
                { header: 'IVA', dataKey: 'tax' },
                { header: 'Total', dataKey: 'total' },
                { header: 'Pagado', dataKey: 'paid_amount' },
              ],
              rows: rows.map((r: any) => ({
                ...r,
                subtotal: `Bs. ${Number(r.subtotal || 0).toFixed(2)}`,
                tax: `Bs. ${Number(r.tax || 0).toFixed(2)}`,
                total: `Bs. ${Number(r.total || 0).toFixed(2)}`,
                paid_amount: `Bs. ${Number(r.paid_amount || 0).toFixed(2)}`,
              })),
              userName: user?.username,
            })
          }}>Reporte PDF</Button>
        </Space>
      </div>
      <Table dataSource={data?.results || data || []} columns={columns} rowKey="id" loading={isLoading} />
      <Modal
        title="Registrar Pago"
        open={payOpen}
        maskClosable={false}
        onCancel={() => { setPayOpen(false); setSelectedInvoice(null) }}
        onOk={() => form.submit()}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Typography.Text strong>Factura #{selectedInvoice?.id}</Typography.Text>
        <Typography.Text style={{ display: 'block', marginBottom: 16 }}>
          Total: Bs. {Number(selectedInvoice?.total || 0).toFixed(2)} | Restante: Bs. {(Number(selectedInvoice?.total || 0) - Number(selectedInvoice?.paid_amount || 0)).toFixed(2)}
        </Typography.Text>
        <Form form={form} layout="vertical" onFinish={values => payMutation.mutate({ ...values, invoice: selectedInvoice?.id })}>
          <Form.Item name="amount" label="Monto" rules={[{ required: true }]}>
            <InputNumber prefix="Bs." min={0.01} step={0.01} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="method" label="Método de Pago" rules={[{ required: true }]}>
            <Select options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'card', label: 'Tarjeta' },
              { value: 'transfer', label: 'Transferencia' },
              { value: 'other', label: 'Otro' },
            ]} />
          </Form.Item>
          <Form.Item name="reference" label="Referencia">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notas">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
