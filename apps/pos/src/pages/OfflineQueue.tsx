import { useState, useEffect, useCallback } from 'react';
import {
  IconWifi,
  IconWifiOff,
  IconPackage,
  IconRefresh,
  IconTrash,
  IconCheckCircle,
  IconAlertTriangle,
  IconClock,
  IconBarcode,
  IconChevronLeft,
} from '../components/Icons';
import { Link } from 'react-router-dom';

interface QueuedItem {
  id: string;
  operation: string;
  endpoint: string;
  method: string;
  body: string | null;
  createdAt: string;
  retries: number;
  lastError: string | null;
}

export default function OfflineQueue() {
  const [queue, setQueue] = useState<QueuedItem[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(30);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/offline/queue');
      const data = await res.json();
      setQueue(data.data || []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/settings/offline');
      const data = await res.json();
      setAutoSync(data.data?.autoSync ?? true);
      setSyncInterval(data.data?.syncInterval ?? 30);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }, []);

  useEffect(() => {
    loadQueue();
    loadSettings();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadQueue, loadSettings]);

  useEffect(() => {
    if (!autoSync || !isOnline || queue.length === 0) return;

    const interval = setInterval(() => {
      handleSync();
    }, syncInterval * 1000);

    return () => clearInterval(interval);
  }, [autoSync, isOnline, queue.length, syncInterval]);

  const handleSync = async () => {
    if (!isOnline || queue.length === 0 || syncing) return;

    try {
      setSyncing(true);
      const res = await fetch('/api/v1/sync/process', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setLastSync(new Date().toLocaleTimeString());
        loadQueue();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm(`Clear all ${queue.length} queued operations? This will discard un-synced transactions.`)) return;

    try {
      await fetch('/api/v1/offline/queue/clear', { method: 'POST' });
      loadQueue();
    } catch (err) {
      console.error('Failed to clear queue:', err);
      alert('Failed to clear queue');
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!confirm('Remove this queued transaction record?')) return;

    try {
      await fetch(`/api/v1/offline/queue/${id}`, { method: 'DELETE' });
      loadQueue();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const getOperationLabel = (op: string): string => {
    const labels: Record<string, string> = {
      sale: 'Retail Sale',
      'sale.void': 'Sale Void',
      'shift.close': 'Shift Close',
      'daily.record': 'Daily Record',
      customer: 'Customer Record',
      'customer.payment': 'Credit Payment',
    };
    return labels[op] || op;
  };

  const getMethodBadgeStyle = (method: string) => {
    switch (method.toUpperCase()) {
      case 'POST':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' };
      case 'PUT':
      case 'PATCH':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' };
      case 'DELETE':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      default:
        return { bg: '#f1f5f9', text: '#475569', border: '#e2e8f0' };
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column' }}>
      {/* Top POS Header */}
      <header
        style={{
          height: 52,
          background: 'var(--surface-dark)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link
            to="/pos"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#94a3b8',
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              padding: '4px 8px',
              borderRadius: 4,
              background: '#1e293b',
            }}
          >
            <IconChevronLeft size={14} />
            <span>Back to POS</span>
          </Link>
          <span style={{ color: '#334155' }}>|</span>
          <h1 style={{ fontSize: 14, fontWeight: 700, color: '#f8fafc' }}>
            Offline Sync Queue & Diagnostic Inspector
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 9999,
              background: isOnline ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: 11,
              fontWeight: 700,
              color: isOnline ? '#34d399' : '#f87171',
            }}
          >
            {isOnline ? <IconWifi size={13} /> : <IconWifiOff size={13} />}
            <span>{isOnline ? 'Network Connected' : 'Working Offline'}</span>
          </div>
        </div>
      </header>

      {/* Main Body Container */}
      <main style={{ flex: 1, padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        {/* Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 20 }}>
          <div
            style={{
              background: 'var(--surface)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Network Connection</span>
              <div style={{ color: isOnline ? 'var(--success)' : 'var(--danger)' }}>
                {isOnline ? <IconWifi size={18} /> : <IconWifiOff size={18} />}
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: isOnline ? 'var(--success)' : 'var(--danger)' }}>
              {isOnline ? 'Online (Connected)' : 'Disconnected (Offline Mode)'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
              Local storage engine active and ready
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Queued Transactions</span>
              <div style={{ color: 'var(--primary)' }}>
                <IconPackage size={18} />
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-main)' }} className="mono">
              {queue.length} <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-subtle)' }}>records</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
              Awaiting automatic background dispatch
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface)',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Last Sync Dispatch</span>
              <div style={{ color: 'var(--info)' }}>
                <IconClock size={18} />
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-main)' }} className="mono">
              {lastSync || 'No sync since boot'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 4 }}>
              Auto-sync interval: every {syncInterval}s
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <button
            onClick={handleSync}
            disabled={!isOnline || queue.length === 0 || syncing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              background: !isOnline || queue.length === 0 || syncing ? '#cbd5e1' : 'var(--primary)',
              color: '#ffffff',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
              cursor: !isOnline || queue.length === 0 || syncing ? 'not-allowed' : 'pointer',
            }}
          >
            <IconRefresh size={15} />
            <span>{syncing ? 'Processing Server Sync...' : 'Sync Queue Now'}</span>
          </button>

          {queue.length > 0 && (
            <button
              onClick={handleClearQueue}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 16px',
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                border: '1px solid var(--danger-border)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <IconTrash size={15} />
              <span>Clear Pending Queue</span>
            </button>
          )}

          <button
            onClick={loadQueue}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              background: 'var(--surface)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <IconRefresh size={15} />
            <span>Refresh Queue Status</span>
          </button>
        </div>

        {/* Queue Table Card */}
        <div
          style={{
            background: 'var(--surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-subtle)' }}>
              Polling local IndexedDB queue...
            </div>
          ) : queue.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-subtle)' }}>
              <div style={{ color: 'var(--success)', marginBottom: 10 }}>
                <IconCheckCircle size={40} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>
                Offline Queue is Empty
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                All sales and shift records are synchronized with the central PostgreSQL database.
              </div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action Type</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>HTTP Method</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Route</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Captured At</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Retries</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Diagnostic State</th>
                  <th style={{ padding: '12px 18px', fontSize: 11, fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((item) => {
                  const methodStyle = getMethodBadgeStyle(item.method);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                        {getOperationLabel(item.operation)}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            background: methodStyle.bg,
                            color: methodStyle.text,
                            border: `1px solid ${methodStyle.border}`,
                          }}
                          className="mono"
                        >
                          {item.method}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-muted)' }} className="mono">
                        {item.endpoint}
                      </td>
                      <td style={{ padding: '12px 18px', fontSize: 12, color: 'var(--text-subtle)' }} className="mono">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </td>
                      <td style={{ padding: '12px 18px', fontSize: 13, textAlign: 'right', fontWeight: 600, color: item.retries > 0 ? 'var(--warning)' : 'var(--text-muted)' }} className="mono">
                        {item.retries}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        {item.lastError ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontSize: 12 }}>
                            <IconAlertTriangle size={14} />
                            <span>{item.lastError}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-subtle)' }}>Ready for sync</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          style={{
                            padding: '4px 10px',
                            background: 'var(--danger-bg)',
                            color: 'var(--danger)',
                            border: '1px solid var(--danger-border)',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
