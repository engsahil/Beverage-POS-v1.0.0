import { useState, useEffect } from 'react';

export interface HeldSale {
  id: string;
  items: any[];
  customer: any | null;
  orderDiscount: number;
  orderDiscountType: string;
  heldAt: string;
  note: string;
}

const STORAGE_KEY = 'bevpos_held_sales';

function loadHeldSales(): HeldSale[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function saveHeldSales(sales: HeldSale[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

interface HoldSaleProps {
  isOpen: boolean;
  onClose: () => void;
  currentCart: any[];
  currentCustomer: any | null;
  currentOrderDiscount: number;
  currentOrderDiscountType: string;
  onHold: () => void;
  onResume: (sale: HeldSale) => void;
}

export default function HoldSaleModal({ isOpen, onClose, currentCart, currentCustomer, currentOrderDiscount, currentOrderDiscountType, onHold, onResume }: HoldSaleProps) {
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [note, setNote] = useState('');
  const [tab, setTab] = useState<'hold' | 'resume'>('hold');

  useEffect(() => { if (isOpen) setHeldSales(loadHeldSales()); }, [isOpen]);

  const handleHold = () => {
    if (currentCart.length === 0) { alert('Cart is empty'); return; }
    const sale: HeldSale = {
      id: `HOLD-${Date.now()}`,
      items: [...currentCart],
      customer: currentCustomer,
      orderDiscount: currentOrderDiscount,
      orderDiscountType: currentOrderDiscountType,
      heldAt: new Date().toISOString(),
      note: note || `Held at ${new Date().toLocaleTimeString()}`,
    };
    const updated = [sale, ...heldSales];
    saveHeldSales(updated);
    setHeldSales(updated);
    setNote('');
    onHold();
    onClose();
  };

  const handleResume = (sale: HeldSale) => {
    onResume(sale);
    const updated = heldSales.filter(s => s.id !== sale.id);
    saveHeldSales(updated);
    setHeldSales(updated);
    onClose();
  };

  const handleDelete = (id: string) => {
    if (!confirm('Delete this held sale?')) return;
    const updated = heldSales.filter(s => s.id !== id);
    saveHeldSales(updated);
    setHeldSales(updated);
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
      <div style={{ background: 'white', borderRadius: 12, width: '90%', maxWidth: 600, maxHeight: '80vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 20, margin: 0 }}>Hold / Resume Sales</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}>×</button>
        </div>
        <div style={{ display: 'flex', gap: 4, padding: '12px 20px 0' }}>
          <button onClick={() => setTab('hold')} style={{ flex: 1, padding: '8px', background: tab === 'hold' ? '#dc2626' : '#f3f4f6', color: tab === 'hold' ? 'white' : '#374151', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Hold Current ({currentCart.length} items)</button>
          <button onClick={() => setTab('resume')} style={{ flex: 1, padding: '8px', background: tab === 'resume' ? '#dc2626' : '#f3f4f6', color: tab === 'resume' ? 'white' : '#374151', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Resume ({heldSales.length})</button>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {tab === 'hold' ? (
            <div>
              <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>Hold the current order and clear the cart for a new customer.</p>
              {currentCart.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Cart is empty - nothing to hold</div>
              ) : (
                <>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 500 }}>Note (optional)</label>
                    <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g., Customer went to get cash" style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }} />
                  </div>
                  <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
                    <div>{currentCart.length} item{currentCart.length !== 1 ? 's' : ''}</div>
                    {currentCustomer && <div>Customer: {currentCustomer.name}</div>}
                    <div>Total: Rs. {currentCart.reduce((s: number, i: any) => s + i.total, 0).toFixed(2)}</div>
                  </div>
                  <button onClick={handleHold} style={{ width: '100%', padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Hold This Order</button>
                </>
              )}
            </div>
          ) : (
            <div>
              {heldSales.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#9ca3af' }}>No held sales</div>
              ) : (
                heldSales.map(sale => (
                  <div key={sale.id} style={{ padding: 12, background: '#f9fafb', borderRadius: 8, marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{sale.note}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>
                        {sale.items.length} items | Rs. {sale.items.reduce((s: number, i: any) => s + i.total, 0).toFixed(2)} | {new Date(sale.heldAt).toLocaleTimeString()}
                        {sale.customer && ` | ${sale.customer.name}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => handleResume(sale)} style={{ padding: '6px 12px', background: '#059669', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Resume</button>
                      <button onClick={() => handleDelete(sale.id)} style={{ padding: '6px 12px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' }}>×</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
