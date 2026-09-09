import { useState, useEffect } from 'react';
import api from '../api';

interface StockCount {
  id: string;
  countNumber: string;
  countDate: string;
  status: string;
  notes: string | null;
  creator: { fullName: string };
  confirmer?: { fullName: string } | null;
  confirmedAt: string | null;
  items?: any[];
  _count?: { items: number };
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
}

export default function StockCounts() {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [countItems, setCountItems] = useState([{ productId: '', systemQty: 0, physicalQty: 0, notes: '' }]);
  const [form, setForm] = useState({ countDate: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCounts(); loadProducts(); }, []);

  const loadCounts = async () => {
    try {
      const { data } = await api.get('/stock-counts', { params: { limit: 50 } });
      setCounts(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products', { params: { limit: 200 } });
      setProducts(data.data || []);
    } catch (err) {}
  };

  const addItem = () => setCountItems([...countItems, { productId: '', systemQty: 0, physicalQty: 0, notes: '' }]);
  const removeItem = (i: number) => { if (countItems.length > 1) setCountItems(countItems.filter((_, idx) => idx !== i)); };
  const updateItem = (i: number, field: string, value: any) => setCountItems(countItems.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleCreate = async () => {
    const validItems = countItems.filter(i => i.productId);
    if (validItems.length === 0) { alert('Add at least one product'); return; }
    try {
      setSaving(true);
      await api.post('/stock-counts', {
        countDate: form.countDate,
        notes: form.notes,
        items: validItems.map(i => ({
          productId: i.productId,
          systemQuantity: i.systemQty,
          physicalQuantity: i.physicalQty,
          notes: i.notes || null,
        })),
      });
      setShowCreateModal(false);
      setCountItems([{ productId: '', systemQty: 0, physicalQty: 0, notes: '' }]);
      loadCounts();
    } catch (err: any) { alert(err.response?.data?.error?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const confirmCount = async (id: string) => {
    if (!confirm('Confirm this stock count? This will create inventory adjustments for any differences.')) return;
    try {
      await api.post(`/stock-counts/${id}/confirm`);
      loadCounts();
    } catch (err: any) { alert(err.response?.data?.error?.message || 'Failed'); }
  };

  const cancelCount = async (id: string) => {
    if (!confirm('Cancel this stock count?')) return;
    try {
      await api.post(`/stock-counts/${id}/cancel`);
      loadCounts();
    } catch (err: any) { alert(err.response?.data?.error?.message || 'Failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, color: '#1f2937', marginBottom: 4 }}>Stock Counts</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>{counts.length} stock count{counts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
          + New Stock Count
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Count #</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Date</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Created By</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Items</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Status</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {counts.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No stock counts yet</td></tr>
            ) : (
              counts.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>{c.countNumber}</td>
                  <td style={{ padding: 12, fontSize: 14, color: '#6b7280' }}>{new Date(c.countDate).toLocaleDateString()}</td>
                  <td style={{ padding: 12, fontSize: 14 }}>{c.creator?.fullName}</td>
                  <td style={{ padding: 12, fontSize: 14, textAlign: 'center' }}>{c._count?.items || c.items?.length || 0}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600,
                      background: c.status === 'CONFIRMED' ? '#f0fdf4' : c.status === 'DRAFT' ? '#fef3c7' : '#fef2f2',
                      color: c.status === 'CONFIRMED' ? '#16a34a' : c.status === 'DRAFT' ? '#d97706' : '#dc2626',
                    }}>{c.status}</span>
                  </td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    {c.status === 'DRAFT' && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button onClick={() => confirmCount(c.id)} style={{ padding: '4px 10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Confirm</button>
                        <button onClick={() => cancelCount(c.id)} style={{ padding: '4px 10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 700, width: '90%', maxHeight: '85vh', overflow: 'auto' }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>New Stock Count</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Date</label>
                <input type="date" value={form.countDate} onChange={(e) => setForm({ ...form, countDate: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Notes</label>
                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
              </div>
            </div>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Items</h3>
            {countItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <select value={item.productId} onChange={(e) => updateItem(i, 'productId', e.target.value)} style={{ flex: 2, padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}>
                  <option value="">Select Product</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku || 'No SKU'})</option>)}
                </select>
                <input type="number" step="0.01" value={item.systemQty} onChange={(e) => updateItem(i, 'systemQty', parseFloat(e.target.value) || 0)} placeholder="System" style={{ width: 80, padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }} />
                <input type="number" step="0.01" value={item.physicalQty} onChange={(e) => updateItem(i, 'physicalQty', parseFloat(e.target.value) || 0)} placeholder="Physical" style={{ width: 80, padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: (item.physicalQty - item.systemQty) !== 0 ? '#dc2626' : '#059669', minWidth: 50, textAlign: 'right' }}>
                  {(item.physicalQty - item.systemQty) !== 0 ? `${item.physicalQty - item.systemQty > 0 ? '+' : ''}${(item.physicalQty - item.systemQty).toFixed(2)}` : '✓'}
                </span>
                {countItems.length > 1 && <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}>×</button>}
              </div>
            ))}
            <button onClick={addItem} style={{ width: '100%', padding: '8px', background: '#f3f4f6', border: '1px dashed #d1d5db', borderRadius: 6, fontSize: 13, cursor: 'pointer', marginBottom: 16 }}>+ Add Item</button>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{ padding: '10px 20px', background: saving ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Creating...' : 'Create Count'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
