import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Button, Avatar, Dropdown, Typography, Badge, Space } from 'antd'
import {
  DashboardOutlined,
  UserOutlined,
  CarOutlined,
  ToolOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  FileTextOutlined,
  ContainerOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Header, Sider, Content, Footer } = Layout

const adminMenu = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/customers', icon: <UserOutlined />, label: 'Clientes' },
  { key: '/vehicles', icon: <CarOutlined />, label: 'Vehículos' },
  { key: '/work-orders', icon: <ToolOutlined />, label: 'Órdenes' },
  { key: '/appointments', icon: <CalendarOutlined />, label: 'Agenda' },
  { key: '/services', icon: <SettingOutlined />, label: 'Servicios' },
  { key: '/products', icon: <ContainerOutlined />, label: 'Inventario' },
  { key: '/suppliers', icon: <TeamOutlined />, label: 'Proveedores' },
  { key: '/purchase-orders', icon: <ShoppingCartOutlined />, label: 'Compras' },
  { key: '/invoices', icon: <FileTextOutlined />, label: 'Facturación' },
  { key: '/employees', icon: <TeamOutlined />, label: 'Empleados' },
]

const receptionistMenu = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/customers', icon: <UserOutlined />, label: 'Clientes' },
  { key: '/vehicles', icon: <CarOutlined />, label: 'Vehículos' },
  { key: '/work-orders', icon: <ToolOutlined />, label: 'Órdenes' },
]

const mechanicMenu = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/work-orders', icon: <ToolOutlined />, label: 'Órdenes' },
]

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const roleMenus: Record<string, typeof adminMenu> = {
    admin: adminMenu,
    receptionist: receptionistMenu,
    mechanic: mechanicMenu,
  }
  const menuItems = roleMenus[user?.role || 'admin'] || adminMenu

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: '#1a0000',
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: collapsed ? 16 : 18,
          fontWeight: 'bold',
          borderBottom: '1px solid rgba(255,50,50,0.2)',
          background: '#2d0000',
        }}>
          {collapsed ? 'GT' : 'GT Automotriz'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: '#1a0000' }}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'margin-left 0.2s' }}>
        <Header style={{
          padding: '0 24px',
          background: '#2d0000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ color: '#fff' }}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <UserOutlined />,
                  label: 'Mi Perfil',
                },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Cerrar Sesión',
                  onClick: logout,
                },
              ],
            }}
          >
            <Space style={{ cursor: 'pointer' }}>
              <Badge count={0} size="small">
                <Avatar icon={<UserOutlined />} />
              </Badge>
              <Typography.Text style={{ color: '#fff' }}>{user?.first_name} {user?.last_name}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: '24px 24px 0', minHeight: 280 }}>
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center', background: '#1a0000', color: '#ccc', padding: '12px 24px' }}>
          GT Automotriz © {new Date().getFullYear()} — Todos los derechos reservados
        </Footer>
      </Layout>
    </Layout>
  )
}
