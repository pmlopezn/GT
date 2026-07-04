import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spin } from 'antd'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import CustomersPage from './pages/CustomersPage'
import VehiclesPage from './pages/VehiclesPage'
import WorkOrdersPage from './pages/WorkOrdersPage'
import WorkOrderFormPage from './pages/WorkOrderFormPage'
import AppointmentsPage from './pages/AppointmentsPage'
import ServicesPage from './pages/ServicesPage'
import ProductsPage from './pages/ProductsPage'
import SuppliersPage from './pages/SuppliersPage'
import PurchaseOrdersPage from './pages/PurchaseOrdersPage'
import InvoicesPage from './pages/InvoicesPage'
import EmployeesPage from './pages/EmployeesPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>
  return user ? <>{children}</> : <Navigate to="/login" />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="vehicles" element={<VehiclesPage />} />
        <Route path="work-orders" element={<WorkOrdersPage />} />
        <Route path="work-orders/new" element={<WorkOrderFormPage />} />
        <Route path="work-orders/:id" element={<WorkOrderFormPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="employees" element={<EmployeesPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
