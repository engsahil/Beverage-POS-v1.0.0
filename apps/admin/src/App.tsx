import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Sales from './pages/Sales';
import Categories from './pages/Categories';
import Units from './pages/Units';
import Customers from './pages/Customers';
import Inventory from './pages/Inventory';
import Vendors from './pages/Vendors';
import Users from './pages/Users';
import Purchases from './pages/Purchases';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Shifts from './pages/Shifts';
import Roles from './pages/Roles';
import AuditLogs from './pages/AuditLogs';
import StockCounts from './pages/StockCounts';
import Transfers from './pages/Transfers';
import Claims from './pages/Claims';
import Targets from './pages/Targets';
import Commissions from './pages/Commissions';
import DailyRecords from './pages/DailyRecords';
import WhatsApp from './pages/WhatsApp';
import Backups from './pages/Backups';
import DataImport from './pages/DataImport';
import ProductVariants from './pages/ProductVariants';
import OpeningStock from './pages/OpeningStock';
import SalesReturns from './pages/SalesReturns';
import QuickKeys from './pages/QuickKeys';
import KeyboardShortcuts from './pages/KeyboardShortcuts';
import POSSettings from './pages/POSSettings';
import CustomerPayments from './pages/CustomerPayments';
import StockCountDetail from './pages/StockCountDetail';
import TransferDetail from './pages/TransferDetail';
import ClaimDetail from './pages/ClaimDetail';
import DailyRecordDetail from './pages/DailyRecordDetail';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navGroups = [
    { label: 'MAIN', items: [
      { path: '/dashboard', label: '📊 Dashboard' },
    ]},
    { label: 'CATALOG', items: [
      { path: '/products', label: '📦 Products' },
      { path: '/variants', label: '🏷️ Variants' },
      { path: '/categories', label: '📁 Categories' },
      { path: '/units', label: '📐 Units' },
    ]},
    { label: 'INVENTORY', items: [
      { path: '/inventory', label: '🏪 Stock' },
      { path: '/opening-stock', label: '📥 Opening Stock' },
      { path: '/stock-counts', label: '📋 Stock Counts' },
      { path: '/transfers', label: '🔄 Transfers' },
      { path: '/purchases', label: '🛒 Purchases' },
    ]},
    { label: 'PEOPLE', items: [
      { path: '/customers', label: '👥 Customers' },
      { path: '/vendors', label: '🏭 Vendors' },
      { path: '/users', label: '👤 Users' },
      { path: '/roles', label: '🔑 Roles' },
    ]},
    { label: 'OPERATIONS', items: [
      { path: '/sales', label: '🧾 Sales' },
      { path: '/sales-returns', label: '↩️ Returns/Voids' },
      { path: '/shifts', label: '⏰ Shifts' },
      { path: '/daily-records', label: '📅 Daily Records' },
      { path: '/expenses', label: '💰 Expenses' },
      { path: '/claims', label: '📝 Claims' },
    ]},
    { label: 'PERFORMANCE', items: [
      { path: '/targets', label: '🎯 Targets' },
      { path: '/commissions', label: '💵 Commissions' },
      { path: '/reports', label: '📈 Reports' },
    ]},
    { label: 'POS CONFIG', items: [
      { path: '/quick-keys', label: '⌨️ Quick Keys' },
      { path: '/shortcuts', label: '🔧 Shortcuts' },
      { path: '/pos-settings', label: '📷 Scanner & Offline' },
      { path: '/customer-payments', label: '💳 Payments' },
    ]},
    { label: 'SYSTEM', items: [
      { path: '/settings', label: '⚙️ Settings' },
      { path: '/whatsapp', label: '📱 WhatsApp' },
      { path: '/backups', label: '☁️ Backups' },
      { path: '/import', label: '📥 Import' },
      { path: '/audit-logs', label: '🔍 Audit Logs' },
    ]},
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ width: 230, background: '#1f2937', color: 'white', padding: '16px 12px', overflowY: 'auto', position: 'fixed', top: 0, bottom: 0 }}>
        <h2 style={{ marginBottom: 20, fontSize: 18, padding: '0 8px' }}>BevPOS Admin</h2>
        <nav>
          {navGroups.map(group => (
            <div key={group.label} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', padding: '4px 8px', letterSpacing: 1, textTransform: 'uppercase' }}>{group.label}</div>
              {group.items.map(item => (
                <Link key={item.path} to={item.path} style={{
                  display: 'block', padding: '8px 12px', marginBottom: 2, borderRadius: 6,
                  color: 'white', textDecoration: 'none', fontSize: 13,
                  background: location.pathname === item.path ? '#dc2626' : 'transparent',
                }}>{item.label}</Link>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ position: 'absolute', bottom: 16, left: 12, right: 12 }}>
          <div style={{ marginBottom: 8, fontSize: 13, color: '#9ca3af', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName}</div>
          <button onClick={logout} style={{ width: '100%', padding: '8px', background: '#374151', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>Logout</button>
        </div>
      </div>
      <div style={{ flex: 1, padding: 28, background: '#f9fafb', marginLeft: 230 }}>
        {children}
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
          <Route path="/products/new" element={<PrivateRoute><ProductForm /></PrivateRoute>} />
          <Route path="/products/:id/edit" element={<PrivateRoute><ProductForm /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
          <Route path="/units" element={<PrivateRoute><Units /></PrivateRoute>} />
          <Route path="/inventory" element={<PrivateRoute><Inventory /></PrivateRoute>} />
          <Route path="/stock-counts" element={<PrivateRoute><StockCounts /></PrivateRoute>} />
          <Route path="/transfers" element={<PrivateRoute><Transfers /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><Users /></PrivateRoute>} />
          <Route path="/roles" element={<PrivateRoute><Roles /></PrivateRoute>} />
          <Route path="/purchases" element={<PrivateRoute><Purchases /></PrivateRoute>} />
          <Route path="/expenses" element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/claims" element={<PrivateRoute><Claims /></PrivateRoute>} />
          <Route path="/sales" element={<PrivateRoute><Sales /></PrivateRoute>} />
          <Route path="/shifts" element={<PrivateRoute><Shifts /></PrivateRoute>} />
          <Route path="/daily-records" element={<PrivateRoute><DailyRecords /></PrivateRoute>} />
          <Route path="/targets" element={<PrivateRoute><Targets /></PrivateRoute>} />
          <Route path="/commissions" element={<PrivateRoute><Commissions /></PrivateRoute>} />
          <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/whatsapp" element={<PrivateRoute><WhatsApp /></PrivateRoute>} />
          <Route path="/backups" element={<PrivateRoute><Backups /></PrivateRoute>} />
          <Route path="/import" element={<PrivateRoute><DataImport /></PrivateRoute>} />
          <Route path="/audit-logs" element={<PrivateRoute><AuditLogs /></PrivateRoute>} />
          <Route path="/variants" element={<PrivateRoute><ProductVariants /></PrivateRoute>} />
          <Route path="/opening-stock" element={<PrivateRoute><OpeningStock /></PrivateRoute>} />
          <Route path="/sales-returns" element={<PrivateRoute><SalesReturns /></PrivateRoute>} />
          <Route path="/quick-keys" element={<PrivateRoute><QuickKeys /></PrivateRoute>} />
          <Route path="/shortcuts" element={<PrivateRoute><KeyboardShortcuts /></PrivateRoute>} />
          <Route path="/pos-settings" element={<PrivateRoute><POSSettings /></PrivateRoute>} />
          <Route path="/customer-payments" element={<PrivateRoute><CustomerPayments /></PrivateRoute>} />
          <Route path="/stock-counts/:id" element={<PrivateRoute><StockCountDetail /></PrivateRoute>} />
          <Route path="/transfers/:id" element={<PrivateRoute><TransferDetail /></PrivateRoute>} />
          <Route path="/claims/:id" element={<PrivateRoute><ClaimDetail /></PrivateRoute>} />
          <Route path="/daily-records/:id" element={<PrivateRoute><DailyRecordDetail /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
