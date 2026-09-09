import { useState, useEffect } from 'react';
import api from '../api';

interface Shortcut {
  id: string;
  action: string;
  key: string;
  description: string;
  isCustom: boolean;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: '1', action: 'new_order', key: 'F2', description: 'Start new order', isCustom: false },
  { id: '2', action: 'payment', key: 'F4', description: 'Open payment dialog', isCustom: false },
  { id: '3', action: 'hold_sale', key: 'F5', description: 'Hold current sale', isCustom: false },
  { id: '4', action: 'sales_history', key: 'F8', description: 'View sales history', isCustom: false },
  { id: '5', action: 'close_modal', key: 'Escape', description: 'Close modal/cancel', isCustom: false },
  { id: '6', action: 'search', key: 'Ctrl+F', description: 'Search products', isCustom: false },
  { id: '7', action: 'print', key: 'Ctrl+P', description: 'Print receipt', isCustom: false },
];

export default function KeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newKey, setNewKey] = useState('');

  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/settings/pos-shortcuts');
      setShortcuts(data.data?.length ? data.data : DEFAULT_SHORTCUTS);
    } catch (err) {
      setShortcuts(DEFAULT_SHORTCUTS);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (id: string, key: string) => {
    // Check for conflicts
    const conflict = shortcuts.find(s => s.key === key && s.id !== id);
    if (conflict) {
      alert(`Key "${key}" is already assigned to "${conflict.description}"`);
      return;
    }

    try {
      await api.patch(`/settings/pos-shortcuts/${id}`, { key });
      setEditingId(null);
      setNewKey('');
      loadShortcuts();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to update shortcut');
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all shortcuts to defaults?')) return;
    try {
      await api.post('/settings/pos-shortcuts/reset');
      setShortcuts(DEFAULT_SHORTCUTS);
    } catch (err: any) {
      setShortcuts(DEFAULT_SHORTCUTS);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, color: '#1f2937', marginBottom: 4 }}>Keyboard Shortcuts</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Customize POS keyboard shortcuts</p>
        </div>
        <button onClick={handleReset} style={{ padding: '10px 20px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer' }}>Reset to Defaults</button>
      </div>

      <div style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Action</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Description</th>
              <th style={{ padding: 12, textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Shortcut</th>
              <th style={{ padding: 12, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#6b7280' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map(shortcut => (
              <tr key={shortcut.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: 12, fontSize: 14, fontWeight: 500 }}>{shortcut.action.replace(/_/g, ' ').toUpperCase()}</td>
                <td style={{ padding: 12, fontSize: 14, color: '#6b7280' }}>{shortcut.description}</td>
                <td style={{ padding: 12 }}>
                  {editingId === shortcut.id ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        onKeyDown={(e) => {
                          e.preventDefault();
                          const keys = [];
                          if (e.ctrlKey) keys.push('Ctrl');
                          if (e.altKey) keys.push('Alt');
                          if (e.shiftKey) keys.push('Shift');
                          if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
                            keys.push(e.key.toUpperCase());
                          }
                          setNewKey(keys.join('+'));
                        }}
                        placeholder="Press keys..."
                        style={{ padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, width: 150 }}
                      />
                      <button onClick={() => handleUpdate(shortcut.id, newKey)} disabled={!newKey} style={{ padding: '6px 12px', background: !newKey ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => { setEditingId(null); setNewKey(''); }} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  ) : (
                    <span style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>{shortcut.key}</span>
                  )}
                </td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  {editingId !== shortcut.id && (
                    <button onClick={() => { setEditingId(shortcut.id); setNewKey(shortcut.key); }} style={{ padding: '6px 12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 24, padding: 16, background: '#eff6ff', border: '1px solid #3b82f6', borderRadius: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>💡 Tips</h3>
        <ul style={{ fontSize: 13, color: '#1e40af', margin: 0, paddingLeft: 20 }}>
          <li>Click "Edit" and press the desired key combination</li>
          <li>Use Ctrl, Alt, or Shift modifiers for custom shortcuts</li>
          <li>Conflicts are automatically detected</li>
          <li>Barcode scanners work independently of these shortcuts</li>
        </ul>
      </div>
    </div>
  );
}
