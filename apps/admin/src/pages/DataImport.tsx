import { useState, useEffect } from 'react';
import api from '../api';

interface ImportOp { id: string; entityType: string; fileName: string; status: string; totalRows: number | null; validRows: number | null; invalidRows: number | null; createdCount: number | null; createdAt: string; }

export default function DataImport() {
  const [imports, setImports] = useState<ImportOp[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState('PRODUCT');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { loadImports(); }, []);

  const loadImports = async () => {
    try { const { data } = await api.get('/data/imports'); setImports(data.data || []); }
    catch (err) {} finally { setLoading(false); }
  };

  const handleUpload = async () => {
    if (!file) { alert('Select a file'); return; }
    try {
      setUploading(true);
      setMessage('');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', entityType);
      const { data } = await api.post('/data/import/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Upload successful: ${data.data?.totalRows || '?'} rows detected, ${data.data?.validRows || '?'} valid, ${data.data?.invalidRows || '?'} invalid`);
      setFile(null);
      loadImports();
    } catch (err: any) { setMessage(err.response?.data?.error?.message || 'Upload failed'); }
    finally { setUploading(false); }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const { data } = await api.get(`/data/templates/${type}`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const a = document.createElement('a'); a.href = url; a.download = `${type}_template.csv`; a.click();
    } catch (err) { alert('Failed to download template'); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40 }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, color: '#1f2937', marginBottom: 24 }}>Data Import</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div style={{ background: 'white', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Upload CSV</h2>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Entity Type</label>
            <select value={entityType} onChange={(e) => setEntityType(e.target.value)} style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}>
              <option value="PRODUCT">Products</option>
              <option value="CUSTOMER">Customers</option>
              <option value="VENDOR">Vendors</option>
              <option value="CATEGORY">Categories</option>
              <option value="UNIT">Units</option>
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>CSV File</label>
            <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] || null)} style={{ width: '100%', padding: '8px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
          </div>
          {message && <div style={{ padding: 10, background: message.includes('failed') ? '#fef2f2' : '#f0fdf4', borderRadius: 6, fontSize: 13, marginBottom: 12, color: message.includes('failed') ? '#dc2626' : '#059669' }}>{message}</div>}
          <button onClick={handleUpload} disabled={uploading || !file} style={{ width: '100%', padding: '10px', background: uploading || !file ? '#9ca3af' : '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{uploading ? 'Uploading...' : 'Upload & Validate'}</button>
        </div>

        <div style={{ background: 'white', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: 18, marginBottom: 16 }}>Download Templates</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>Download CSV templates with correct column format:</p>
          {['PRODUCT', 'CUSTOMER', 'VENDOR', 'CATEGORY', 'UNIT'].map(type => (
            <button key={type} onClick={() => downloadTemplate(type)} style={{ display: 'block', width: '100%', padding: '10px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14, cursor: 'pointer', marginBottom: 8, textAlign: 'left' }}>
              📥 {type.charAt(0) + type.slice(1).toLowerCase()} Template
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <h2 style={{ padding: 16, fontSize: 16, margin: 0, borderBottom: '1px solid #e5e7eb' }}>Import History</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f9fafb' }}>
            <tr>
              <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Date</th>
              <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Type</th>
              <th style={{ padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>File</th>
              <th style={{ padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Rows</th>
              <th style={{ padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {imports.length === 0 ? <tr><td colSpan={5} style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>No imports yet</td></tr> : (
              imports.map(imp => (
                <tr key={imp.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: 10, fontSize: 13, color: '#6b7280' }}>{new Date(imp.createdAt).toLocaleString()}</td>
                  <td style={{ padding: 10, fontSize: 13 }}>{imp.entityType}</td>
                  <td style={{ padding: 10, fontSize: 13 }}>{imp.fileName}</td>
                  <td style={{ padding: 10, fontSize: 13, textAlign: 'center' }}>{imp.totalRows || '-'} ({imp.validRows || 0} valid)</td>
                  <td style={{ padding: 10, textAlign: 'center' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                      background: imp.status === 'COMPLETED' ? '#f0fdf4' : imp.status === 'FAILED' ? '#fef2f2' : '#fef3c7',
                      color: imp.status === 'COMPLETED' ? '#16a34a' : imp.status === 'FAILED' ? '#dc2626' : '#d97706',
                    }}>{imp.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
