import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Rules from './pages/Rules';
import GoogleCallback from './pages/GoogleCallback';
import Dashboard from './pages/Dashboard';
import EventDetails from './pages/EventDetails';
import AllEvents from './pages/AllEvents';
import Wallet from './pages/Wallet';
import Profile from './pages/Profile';
import Children from './pages/Children';
import Support from './pages/Support';
import Deposit from './pages/Deposit';
import AdminDashboard from './pages/AdminDashboard';
import AdminGroups from './pages/AdminGroups';
import AdminEvents from './pages/AdminEvents';
import AdminEventEdit from './pages/AdminEventEdit';
import AdminUsers from './pages/AdminUsers';
import AdminUserEdit from './pages/AdminUserEdit';
import AdminWallet from './pages/AdminWallet';
import AdminTopups from './pages/AdminTopups';
import AdminRent from './pages/AdminRent';
import AdminDonations from './pages/AdminDonations';
import AdminDeposits from './pages/AdminDeposits';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />

            {/* Protected User Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute>
                  <AllEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/event/:id"
              element={
                <ProtectedRoute>
                  <EventDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/wallet"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/children"
              element={
                <ProtectedRoute>
                  <Children />
                </ProtectedRoute>
              }
            />
            <Route
              path="/support"
              element={
                <ProtectedRoute>
                  <Support />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users/edit/:id"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminUserEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/groups"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminGroups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminEvents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/events/edit/:id"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminEventEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/wallet"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminWallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/topups"
              element={
                <ProtectedRoute roles={['super_admin', 'group_admin']}>
                  <AdminTopups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/rent"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <AdminRent />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/donations"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <AdminDonations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/deposits"
              element={
                <ProtectedRoute roles={['super_admin']}>
                  <AdminDeposits />
                </ProtectedRoute>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;

