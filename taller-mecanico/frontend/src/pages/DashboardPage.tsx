import { Card, Row, Col, Statistic, Table, Tag, Typography, Spin, Space, Button } from 'antd'
import {
  ToolOutlined,
  CalendarOutlined,
  DollarOutlined,
  WarningOutlined,
  FileTextOutlined,
  FilePdfOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import api from '../services/api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import { generatePdfReport } from '../utils/pdfReport'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard/').then(r => r.data),
    refetchInterval: 30000,
  })

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />

  const statusLabels: Record<string, { color: string; label: string }> = {
    pending: { color: 'orange', label: 'Pendiente' },
    in_progress: { color: 'blue', label: 'En Progreso' },
    completed: { color: 'green', label: 'Completado' },
    invoiced: { color: 'purple', label: 'Facturado' },
    cancelled: { color: 'red', label: 'Cancelado' },
  }

  const columns = [
    { title: 'OT #', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'Cliente', dataIndex: 'customer', key: 'customer' },
    { title: 'Vehículo', dataIndex: 'vehicle', key: 'vehicle' },
    {
      title: 'Estado', dataIndex: 'status', key: 'status',
      render: (s: string) => {
        const st = statusLabels[s] || { color: 'default', label: s }
        return <Tag color={st.color}>{st.label}</Tag>
      },
    },
    {
      title: 'Total', dataIndex: 'total', key: 'total',
      render: (v: number | string) => `Bs. ${Number(v || 0).toFixed(2)}`,
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Dashboard</Typography.Title>
        <Button icon={<FilePdfOutlined />} onClick={async () => {
          const statusLabels: Record<string, string> = { pending: 'Pendiente', in_progress: 'En Progreso', completed: 'Completado', invoiced: 'Facturado', cancelled: 'Cancelado' }
          const d = data || {}
          const summary = [
            { metric: 'Órdenes Activas', value: String(d.active_orders || 0) },
            { metric: 'Citas Hoy', value: String(d.today_appointments || 0) },
            { metric: 'Ingresos del Mes', value: `Bs. ${Number(d.monthly_income || 0).toFixed(2)}` },
            { metric: 'Stock Bajo', value: String(d.low_stock || 0) },
          ]
          await generatePdfReport({
            title: 'Panel de Control - Resumen',
            subheader: 'Indicadores generales del taller',
            columns: [
              { header: 'Indicador', dataKey: 'metric' },
              { header: 'Valor', dataKey: 'value' },
            ],
            rows: summary,
            userName: user?.username,
          })
        }}>Reporte PDF</Button>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Órdenes Activas"
              value={data?.active_orders || 0}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Citas Hoy"
              value={data?.today_appointments || 0}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Ingresos del Mes"
              value={data?.monthly_income || 0}
              prefix={<DollarOutlined />}
              precision={2}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Stock Bajo"
              value={data?.low_stock || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Órdenes por Estado">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data?.orders_by_status || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tickFormatter={(v: string) => statusLabels[v]?.label || v} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1677ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Órdenes Recientes">
            <Table
              dataSource={data?.recent_orders || []}
              columns={columns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>

      {data?.top_services?.length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card title="Servicios Más Realizados">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={data.top_services} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} />
                <Tooltip formatter={(value: number, name: string, props: any) => [value, `Órdenes ${statusLabels[props.payload?.status]?.label || props.payload?.status}`]} />
                  <Bar dataKey="count" fill="#52c41a" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  )
}
