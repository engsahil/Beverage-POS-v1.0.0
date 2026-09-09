import { useState, useEffect } from 'react';
import api from '../api';

interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  status: string;
  total: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  cashier: { fullName: string };
  customer?: { name: string } | null;
  payments: Array<{ paymentMethod: string; amount: number }>;
  _count?: { items: number };
}

interface SalesHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  onReprint: (saleId: string) => void;
}

export default function SalesHistory({ isOpen, onClose, onReprint }: SalesHistoryProps) {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('today');

  useEffect(() => {
    if (isOpen) loadSales();
  }, [isOpen, dateFilter]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 50 };
      if (dateFilter === 'today') {
        params.startDate = new Date().toISOString().split('T')[0];
        params.endDate = new Date().toISOString().split('T')[0];
      } else if (dateFilter === 'week') {
        const d = new Date(); d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString().split('T')[0];
      }
      if (search) params.search = search;
      const { data } = await api.get('/sales', { params });
      setSales(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '90%', maxWidth: 800, maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Sales History</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb', display: 'flex', gap: 12 }}>
          <input type="text" placeholder="Search by sale # or customer..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && loadSales()} style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          {loading ? <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Sale #</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Time</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Cashier</th>
                  <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Payment</th>
                  <th style={{ padding: 10, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Total</th>
                  <th style={{ padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Status</th>
                  <th style={{ padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No sales found</td></tr> : (
                  sales.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: 10, fontSize: 13, fontWeight: 500 }}>{s.saleNumber}</td>
                      <td style={{ padding: 10, fontSize: 13, color: '#6b7280' }}>{new Date(s.saleDate).toLocaleTimeString()}</td>
                      <td style={{ padding: 10, fontSize: 13 }}>{s.cashier?.fullName}</td>
                      <td style={{ padding: 10, fontSize: 12 }}>{s.payments?.map(p => p.paymentMethod).join(', ') || '-'}</td>
                      <td style={{ padding: 10, fontSize: 13, textAlign: 'right', fontWeight: 600 }}>Rs. {Number(s.total).toFixed(2)}</td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          background: s.status === 'COMPLETED' ? '#f0fdf4' : '#fef2f2',
                          color: s.status === 'COMPLETED' ? '#16a34a' : '#dc2626',
                        }}>{s.status}</span>
                      </td>
                      <td style={{ padding: 10, textAlign: 'center' }}>
                        <button onClick={() => onReprint(s.id)} style={{ padding: '4px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Reprint</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: 12, borderTop: '1px solid #e5e7eb', background: '#f9fafb', fontSize: 13, color: '#6b7280' }}>
          Showing {sales.length} sale{sales.length !== 1 ? 's' : ''} | Total: Rs. {sales.reduce((sum, s) => sum + Number(s.total), 0).toFixed(2)}
        </div>
      </div>
    </div>
  );
}
