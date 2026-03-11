import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LoginPage           from './pages/LoginPage';
import DashboardPage       from './pages/DashboardPage';
import BookingsPage        from './pages/BookingsPage';
import WorkersPage         from './pages/WorkersPage';
import ApprovalsPage       from './pages/ApprovalsPage';
import SettlementPage      from './pages/SettlementPage';
import ReviewsPage         from './pages/ReviewsPage';
import CustomersPage       from './pages/CustomersPage';
import AdminListPage       from './pages/AdminListPage';
import ServiceCategoryPage from './pages/ServiceCategoryPage';
import ServicesPage        from './pages/ServicesPage';

// Layout wrapper
import AdminLayout from './components/AdminLayout';

// Protected route — redirects to /login if not logged in
function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', background:'#080B0F', color:'#FF4D4D', fontFamily:'Syne',
      fontSize:'18px', fontWeight:700 }}>
      ⚡ Loading FixIt...
    </div>
  );
  return admin ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — all inside AdminLayout (sidebar + topbar) */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index                element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"     element={<DashboardPage />} />
        <Route path="bookings"      element={<BookingsPage />} />
        <Route path="workers"       element={<WorkersPage />} />
        <Route path="approvals"     element={<ApprovalsPage />} />
        <Route path="settlement"    element={<SettlementPage />} />
        <Route path="reviews"       element={<ReviewsPage />} />
        <Route path="customers"     element={<CustomersPage />} />
        <Route path="admins"        element={<AdminListPage />} />
        <Route path="categories"    element={<ServiceCategoryPage />} />
        <Route path="services"      element={<ServicesPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
