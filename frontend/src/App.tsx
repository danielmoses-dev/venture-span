import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import Layout from '@/components/layout/Layout'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import DashboardPage from '@/pages/DashboardPage'
import BrowseStartupsPage from '@/pages/BrowseStartupsPage'
import BrowseInvestorsPage from '@/pages/BrowseInvestorsPage'
import StartupProfilePage from '@/pages/StartupProfilePage'
import InvestorProfilePage from '@/pages/InvestorProfilePage'
import MlInsightsPage from '@/pages/MlInsightsPage'
import ConnectionsPage from '@/pages/ConnectionsPage'
import VerificationPage from '@/pages/VerificationPage'
import LandingPage from '@/pages/LandingPage'
import AdminPage from '@/pages/AdminPage'

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

const PublicOnly = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"  element={<PublicOnly><LoginPage /></PublicOnly>} />
        <Route path="/signup" element={<PublicOnly><SignupPage /></PublicOnly>} />

        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard"        element={<DashboardPage />} />
          <Route path="/browse/startups"  element={<BrowseStartupsPage />} />
          <Route path="/browse/investors" element={<BrowseInvestorsPage />} />
          <Route path="/profile/startup"  element={<StartupProfilePage />} />
          <Route path="/profile/investor" element={<InvestorProfilePage />} />
          <Route path="/insights"         element={<MlInsightsPage />} />
          <Route path="/connections"      element={<ConnectionsPage />} />
          <Route path="/verification"     element={<VerificationPage />} />
        </Route>

        <Route path="/admin/venturespan-admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
