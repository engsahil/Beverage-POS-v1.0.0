import { useState, useEffect, useCallback } from 'react';

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
      const res = await fetch('/api/offline/queue');
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
      const res = await fetch('/api/settings/offline');
      const data = await res.json();
      setAutoSync(data.data.autoSync ?? true);
      setSyncInterval(data.data.syncInterval ?? 30);
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
      const res = await fetch('/api/offline/sync', { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        setLastSync(new Date().toLocaleString());
        loadQueue();
      }
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (!confirm(`Clear all ${queue.length} queued operations? This cannot be undone.`)) return;

    try {
      await fetch('/api/offline/queue/clear', { method: 'POST' });
      loadQueue();
    } catch (err) {
      console.error('Failed to clear queue:', err);
      alert('Failed to clear queue');
    }
  };

  const handleRemoveItem = async (id: string) => {
    if (!confirm('Remove this queued operation?')) return;

    try {
      await fetch(`/api/offline/queue/${id}`, { method: 'DELETE' });
      loadQueue();
    } catch (err) {
      console.error('Failed to remove item:', err);
    }
  };

  const getOperationLabel = (op: string): string => {
    const labels: Record<string, string> = {
      'sale': 'Sale',
      'sale.void': 'Sale Void',
      'shift.close': 'Shift Close',
      'daily.record': 'Daily Record',
      'customer': 'Customer',
      'customer.payment': 'Payment',
    };
    return labels[op] || op;
  };

  const getMethodColor = (method: string): string => {
    switch (method.toUpperCase()) {
      case 'POST': return '#059669';
      case 'PUT': return '#d97706';
      case 'PATCH': return '#7c3aed';
      case 'DELETE': return '#dc2626';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>Offline Queue</h1>
        <p style={{ fontSize: 14, color: '#6b7280' }}>Manage queued operations when offline</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>{isOnline ? '🟢' : '🔴'}</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Connection</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: isOnline ? '#059669' : '#dc2626' }}>
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>📦</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Queued Operations</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>{queue.length}</div>
        </div>

        <div style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 18 }}>🔄</span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Last Sync</span>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1f2937' }}>
            {lastSync || 'Never'}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button
          onClick={handleSync}
          disabled={!isOnline || queue.length === 0 || syncing}
          style={{
            padding: '10px 20px',
            background: !isOnline || queue.length === 0 || syncing ? '#9ca3af' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {syncing ? '⏳ Syncing...' : '🔄 Sync Now'}
        </button>

        {queue.length > 0 && (
          <button
            onClick={handleClearQueue}
            style={{
              padding: '10px 20px',
              background: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #dc2626',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🗑️ Clear Queue
          </button>
        )}

        <button
          onClick={loadQueue}
          style={{
            padding: '10px 20px',
            background: '#f3f4f6',
            color: '#374151',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🔃 Refresh
        </button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>Loading...</div>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1f2937', marginBottom: 4 }}>Queue is Empty</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>No pending operations to sync</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Operation</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Method</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Endpoint</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Created</th>
                <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Retries</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Status</th>
                <th style={{ padding: 12, textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {queue.map(item => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>
                    {getOperationLabel(item.operation)}
                  </td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${getMethodColor(item.method)}20`, color: getMethodColor(item.method) }}>
                      {item.method}
                    </span>
                  </td>
                  <td style={{ padding: 12, fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>
                    {item.endpoint.length > 40 ? item.endpoint.substring(0, 40) + '...' : item.endpoint}
                  </td>
                  <td style={{ padding: 12, fontSize: 13, color: '#6b7280' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: 12, fontSize: 14, textAlign: 'right', color: item.retries > 0 ? '#d97706' : '#6b7280' }}>
                    {item.retries}
                  </td>
                  <td style={{ padding: 12 }}>
                    {item.lastError ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 12 }}>
                        <span>⚠️</span>
                        <span>{item.lastError.length > 30 ? item.lastError.substring(0, 30) + '...' : item.lastError}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#6b7280' }}>Pending</span>
                    )}
                  </td>
                  <td style={{ padding: 12, textAlign: 'right' }}>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      style={{ padding: '4px 8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 4, fontSize: 12, cursor: 'pointer', color: '#dc2626' }}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#f9fafb', borderRadius: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Auto-Sync Settings</div>
        <div style={{ display: 'flex', gap: 24, fontSize: 13, color: '#6b7280' }}>
          <span>Auto-sync: <strong>{autoSync ? 'Enabled' : 'Disabled'}</strong></span>
          <span>Interval: <strong>{syncInterval}s</strong></span>
        </div>
      </div>
    </div>
  );
}
