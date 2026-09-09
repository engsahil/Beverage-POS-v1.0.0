import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

interface Shift {
  id: string;
  status: string;
  openingAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  actualAmount?: number;
  difference?: number;
  openedAt: string;
  closedAt?: string;
  notes?: string;
}

interface ShiftManagerProps {
  onShiftChange: (shift: Shift | null) => void;
}

export default function ShiftManager({ onShiftChange }: ShiftManagerProps) {
  const { user } = useAuth();
  const [shift, setShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOpenForm, setShowOpenForm] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadActiveShift();
  }, []);

  const loadActiveShift = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/shifts/active');
      if (data.data) {
        setShift(data.data);
        onShiftChange(data.data);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        console.error('Failed to load shift:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const openShift = async () => {
    if (!openingAmount || parseFloat(openingAmount) < 0) {
      setError('Please enter a valid opening amount');
      return;
    }

    try {
      setError('');
      const { data } = await api.post('/shifts/open', {
        branchId: user?.branchId,
        openingCash: parseFloat(openingAmount),
        openingNotes: notes || undefined,
      });
      setShift(data.data);
      onShiftChange(data.data);
      setShowOpenForm(false);
      setOpeningAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to open shift');
    }
  };

  const closeShift = async () => {
    if (!closingAmount || parseFloat(closingAmount) < 0) {
      setError('Please enter a valid closing amount');
      return;
    }

    try {
      setError('');
      const { data } = await api.post(`/shifts/${shift?.id}/close`, {
        actualCash: parseFloat(closingAmount),
        closingNotes: notes || undefined,
      });
      setShift(null);
      onShiftChange(null);
      setShowCloseForm(false);
      setClosingAmount('');
      setNotes('');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to close shift');
    }
  };

  if (loading) {
    return <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>Loading shift...</div>;
  }

  return (
    <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
      {!shift ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>No Active Shift</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>Open a shift to start selling</div>
            </div>
            <button
              onClick={() => setShowOpenForm(true)}
              style={{
                padding: '8px 16px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Open Shift
            </button>
          </div>

          {showOpenForm && (
            <div style={{ marginTop: 16, padding: 16, background: 'white', borderRadius: 8 }}>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Opening Cash Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>
              {error && (
                <div style={{
                  padding: 8,
                  background: '#fef2f2',
                  border: '1px solid #dc2626',
                  borderRadius: 6,
                  color: '#991b1b',
                  fontSize: 14,
                  marginBottom: 12,
                }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={openShift}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Open Shift
                </button>
                <button
                  onClick={() => {
                    setShowOpenForm(false);
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                ✓ Shift Active
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Opened: {new Date(shift.openedAt).toLocaleTimeString()} | Opening: Rs. {shift.openingAmount.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => setShowCloseForm(true)}
              style={{
                padding: '8px 16px',
                background: '#78350f',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close Shift
            </button>
          </div>

          {showCloseForm && (
            <div style={{ marginTop: 16, padding: 16, background: 'white', borderRadius: 8 }}>
              <div style={{ marginBottom: 12, padding: 12, background: '#fef3c7', borderRadius: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#78350f', marginBottom: 4 }}>
                  Shift Summary
                </div>
                <div style={{ fontSize: 13, color: '#78350f' }}>
                  Opening Amount: Rs. {shift.openingAmount.toFixed(2)}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Closing Cash Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                  }}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    resize: 'vertical',
                  }}
                />
              </div>
              {error && (
                <div style={{
                  padding: 8,
                  background: '#fef2f2',
                  border: '1px solid #dc2626',
                  borderRadius: 6,
                  color: '#991b1b',
                  fontSize: 14,
                  marginBottom: 12,
                }}>
                  {error}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={closeShift}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#78350f',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close Shift
                </button>
                <button
                  onClick={() => {
                    setShowCloseForm(false);
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: '8px 16px',
                    background: '#f3f4f6',
                    color: '#374151',
                    border: '1px solid #d1d5db',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
