import { useParams, useNavigate } from 'react-router-dom'
import { Button, Space, Typography } from 'antd'
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons'
import VehicleInspectionCard from './VehicleInspectionCard'

export default function ReceptionDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/reception')}>Volver</Button>
      </Space>
      <Typography.Title level={4}><CarOutlined /> Detalle de Recepción #{id}</Typography.Title>
      <VehicleInspectionCard workOrderId={Number(id)} />
    </div>
  )
}
