import { useState } from 'react';
import api from '../api';

interface PriceOverrideModalProps {
  isOpen: boolean;
  productName: string;
  originalPrice: number;
  requestedPrice: number;
  onApprove: (approved: boolean, approvedPrice?: number) => void;
  onClose: () => void;
}

export default function PriceOverrideModal({ isOpen, productName, originalPrice, requestedPrice, onApprove, onClose }: PriceOverrideModalProps) {
  const [mode, setMode] = useState<'request' | 'approve'>('request');
  const [reason, setReason] = useState('');
  const [approverCredentials, setApproverCredentials] = useState({ username: '', password: '' });
  const [approvedPrice, setApprovedPrice] = useState(requestedPrice);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const discount = originalPrice - requestedPrice;
  const discountPercent = ((discount / originalPrice) * 100).toFixed(1);

  const handleRequestApproval = async () => {
    if (!reason) {
      setError('Please provide a reason for the price override');
      return;
    }

    setMode('approve');
    setError('');
  };

  const handleApprove = async () => {
    if (!approverCredentials.username || !approverCredentials.password) {
      setError('Manager credentials required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verify manager credentials
      const { data } = await api.post('/auth/login', approverCredentials);
      const managerUser = data.data.user;

      // Check if user has approval permission
      if (!managerUser.permissions?.includes('price.override.approve')) {
        setError('This user does not have price override approval permission');
        setLoading(false);
        return;
      }

      // Record the approval
      await api.post('/price-overrides', {
        productName,
        originalPrice,
        requestedPrice: approvedPrice,
        reason,
        approvedBy: managerUser.id,
      });

      onApprove(true, approvedPrice);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Invalid manager credentials');
      } else {
        setError(err.response?.data?.error?.message || 'Failed to approve override');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    onApprove(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', borderRadius: 12, padding: 28, maxWidth: 500, width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
        {mode === 'request' ? (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 20, color: '#1f2937' }}>Price Override Request</h2>
            
            <div style={{ padding: 16, background: '#fef3c7', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#78350f', marginBottom: 8 }}>⚠️ Manager Approval Required</div>
              <div style={{ fontSize: 14, color: '#78350f' }}>
                <strong>{productName}</strong>
                <br />
                Original Price: <strong>Rs. {originalPrice.toFixed(2)}</strong>
                <br />
                Requested Price: <strong style={{ color: '#dc2626' }}>Rs. {requestedPrice.toFixed(2)}</strong>
                <br />
                Discount: <strong>Rs. {discount.toFixed(2)} ({discountPercent}%)</strong>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Reason for Override *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain why this price override is needed..."
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, resize: 'vertical' }}
              />
            </div>

            {error && (
              <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 6, color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleRequestApproval} disabled={!reason} style={{ padding: '10px 20px', background: !reason ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Request Approval</button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, marginBottom: 20, color: '#1f2937' }}>Manager Approval</h2>
            
            <div style={{ padding: 16, background: '#f3f4f6', borderRadius: 8, marginBottom: 20 }}>
              <div style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
                <strong>Product:</strong> {productName}
                <br />
                <strong>Original:</strong> Rs. {originalPrice.toFixed(2)}
                <br />
                <strong>Requested:</strong> Rs. {requestedPrice.toFixed(2)}
                <br />
                <strong>Reason:</strong> {reason}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Approved Price</label>
              <input
                type="number"
                step="0.01"
                value={approvedPrice}
                onChange={(e) => setApprovedPrice(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
              <span style={{ fontSize: 11, color: '#6b7280' }}>Manager can adjust the approved price</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Manager Username *</label>
              <input
                type="text"
                value={approverCredentials.username}
                onChange={(e) => setApproverCredentials({ ...approverCredentials, username: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Manager Password *</label>
              <input
                type="password"
                value={approverCredentials.password}
                onChange={(e) => setApproverCredentials({ ...approverCredentials, password: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
              />
            </div>

            {error && (
              <div style={{ padding: 10, background: '#fef2f2', border: '1px solid #dc2626', borderRadius: 6, color: '#991b1b', fontSize: 13, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => { setMode('request'); setApproverCredentials({ username: '', password: '' }); setError(''); }} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>Back</button>
              <button onClick={handleReject} style={{ padding: '10px 20px', background: '#fef2f2', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Reject</button>
              <button onClick={handleApprove} disabled={loading} style={{ padding: '10px 20px', background: loading ? '#9ca3af' : '#059669', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                {loading ? 'Approving...' : 'Approve'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
