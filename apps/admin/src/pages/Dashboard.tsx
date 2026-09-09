import { useState, useEffect } from 'react';
import api from '../api';

interface DashboardData {
  todaySales: number;
  todayTransactions: number;
  totalProducts: number;
  totalCustomers: number;
  recentSales: Array<{
    id: string;
    saleNumber: string;
    total: number;
    createdAt: string;
    customer?: { name: string };
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data from multiple endpoints
      const [productsRes, customersRes, salesRes] = await Promise.all([
        api.get('/products', { params: { limit: 1 } }),
        api.get('/customers', { params: { limit: 1 } }),
        api.get('/sales', { params: { limit: 10 } }),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const todaySales = salesRes.data.data?.filter((s: any) => 
        s.createdAt.startsWith(today)
      ) || [];

      setData({
        todaySales: todaySales.reduce((sum: number, s: any) => sum + s.total, 0),
        todayTransactions: todaySales.length,
        totalProducts: productsRes.data.meta?.total || 0,
        totalCustomers: customersRes.data.meta?.total || 0,
        recentSales: salesRes.data.data?.slice(0, 5) || [],
      });
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        <div style={{
          background: '#fef2f2',
          border: '1px solid #dc2626',
          color: '#dc2626',
          padding: 16,
          borderRadius: 8,
        }}>
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Today's Sales", value: `Rs. ${data.todaySales.toFixed(2)}`, color: '#dc2626' },
    { label: "Today's Transactions", value: data.todayTransactions, color: '#059669' },
    { label: 'Total Products', value: data.totalProducts, color: '#2563eb' },
    { label: 'Total Customers', value: data.totalCustomers, color: '#7c3aed' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, marginBottom: 24, color: '#1f2937' }}>Dashboard</h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 20,
        marginBottom: 32,
      }}>
        {stats.map((stat, i) => (
          <div key={i} style={{
            background: 'white',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'white',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <h2 style={{ fontSize: 20, marginBottom: 16, color: '#1f2937' }}>Recent Sales</h2>
        
        {data.recentSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
            No sales yet
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 14, color: '#6b7280' }}>Sale #</th>
                <th style={{ textAlign: 'left', padding: 12, fontSize: 14, color: '#6b7280' }}>Customer</th>
                <th style={{ textAlign: 'right', padding: 12, fontSize: 14, color: '#6b7280' }}>Total</th>
                <th style={{ textAlign: 'right', padding: 12, fontSize: 14, color: '#6b7280' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.map(sale => (
                <tr key={sale.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>{sale.saleNumber}</td>
                  <td style={{ padding: 12, color: '#6b7280' }}>{sale.customer?.name || 'Walk-in'}</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                    Rs. {sale.total.toFixed(2)}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right', color: '#6b7280', fontSize: 14 }}>
                    {new Date(sale.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
