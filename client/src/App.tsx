import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Opportunities from './pages/Opportunities';
import BusinessPlanNew from './pages/BusinessPlanNew';
import MyPlans from './pages/MyPlans';
import BusinessPlanDetail from './pages/BusinessPlanDetail';
import Advisors from './pages/Advisors';
import AdvisorDetail from './pages/AdvisorDetail';
import AdvisorMe from './pages/AdvisorMe';
import Bookings from './pages/Bookings';
import Applications from './pages/Applications';
import ApplicationDetail from './pages/ApplicationDetail';
import Storefront from './pages/Storefront';
import Marketplace from './pages/Marketplace';
import AdminDashboard from './pages/AdminDashboard';
import AdminApplications from './pages/AdminApplications';
import AdminAdvisors from './pages/AdminAdvisors';
import AdminOpportunities from './pages/AdminOpportunities';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/advisors" element={<Advisors />} />
            <Route path="/advisors/:id" element={<AdvisorDetail />} />

            <Route
              path="/advisors/me"
              element={
                <ProtectedRoute roles={['ADVISOR']}>
                  <AdvisorMe />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute roles={['APPLICANT', 'ADVISOR']}>
                  <Bookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans/new"
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <BusinessPlanNew />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans"
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <MyPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/plans/:id"
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <BusinessPlanDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications"
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <Applications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/applications/:id"
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <ApplicationDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/storefront"
              element={
                <ProtectedRoute roles={['APPLICANT']}>
                  <Storefront />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['ADMIN']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="applications" element={<AdminApplications />} />
              <Route path="advisors" element={<AdminAdvisors />} />
              <Route path="opportunities" element={<AdminOpportunities />} />
            </Route>

            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}