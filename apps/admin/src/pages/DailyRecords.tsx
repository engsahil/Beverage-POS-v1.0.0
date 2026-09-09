import { useState, useEffect } from 'react';
import api from '../api';

interface DailyRecord {
  id: string;
  businessDate: string;
  status: string;
  openedAt: string;
  closedAt: string | null;
  opener: { fullName: string };
  closer?: { fullName: string } | null;
  notes: string | null;
}

export default function DailyRecords() {
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [current, setCurrent] = useState<DailyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => { loadRecords(); loadCurrent(); }, []);

  const loadRecords = async () => {
    try {
      const { data } = await api.get('/daily-records', { params: { limit: 30 } });
      setRecords(data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadCurrent = async () => {
    try {
      const { data } = await api.get('/daily-records/current');
      setCurrent(data.data || null);
    } catch (err) {}
  };

  const openDay = async () => {
    try {
      await api.post('/daily-records/open', { notes: notes || undefined });
      setShowOpenModal(false);
      setNotes('');
      loadRecords();
      loadCurrent();
    } catch (err: any) { alert(err.response?.data?.error?.message || 'Failed'); }
  };

  const closeDay = async () => {
    if (!current) return;
    if (!confirm('Close the business day?')) return;
    try {
      await api.post(`/daily-records/${current.id}/close`, { notes: notes || undefined });
      setShowCloseModal(false);
      setNotes('');
      loadRecords();
      loadCurrent();
    } catch (err: any) { alert(err.response?.data?.error?.message || 'Failed'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, color: '#1f2937', marginBottom: 4 }}>Daily Records</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Business day open/close management</p>
        </div>
        {current ? (
          <button onClick={() => setShowCloseModal(true)} style={{ padding: '10px 20px', background: '#78350f', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Close Day</button>
        ) : (
          <button onClick={() => setShowOpenModal(true)} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Open Day</button>
        )}
      </div>

      {current && (
        <div style={{ background: '#f0fdf4', border: '1px solid #059669', borderRadius: 8, padding: 16, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#059669', marginBottom: 4 }}>✓ Day Open: {new Date(current.businessDate).toLocaleDateString()}</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>Opened at {new Date(current.openedAt).toLocaleTimeString()} by {current.opener?.fullName}</div>
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Date</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Opened</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Closed</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Opened By</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Closed By</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No daily records</td></tr>
            ) : (
              records.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>{new Date(r.businessDate).toLocaleDateString()}</td>
                  <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>{new Date(r.openedAt).toLocaleTimeString()}</td>
                  <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>{r.closedAt ? new Date(r.closedAt).toLocaleTimeString() : '-'}</td>
                  <td style={{ padding: 12, fontSize: 14 }}>{r.opener?.fullName}</td>
                  <td style={{ padding: 12, fontSize: 14 }}>{r.closer?.fullName || '-'}</td>
                  <td style={{ padding: 12, textAlign: 'center' }}>
                    <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: r.status === 'OPEN' ? '#f0fdf4' : '#f3f4f6', color: r.status === 'OPEN' ? '#16a34a' : '#6b7280' }}>{r.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showOpenModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%' }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Open Business Day</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Notes (Optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowOpenModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={openDay} style={{ padding: '10px 20px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Open Day</button>
            </div>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 400, width: '90%' }}>
            <h2 style={{ fontSize: 20, marginBottom: 16 }}>Close Business Day</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Closing Notes (Optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowCloseModal(false)} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
              <button onClick={closeDay} style={{ padding: '10px 20px', background: '#78350f', color: 'white', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Close Day</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
