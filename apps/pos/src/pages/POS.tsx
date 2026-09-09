import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import ShiftManager from '../components/ShiftManager';
import CustomerSelector from '../components/CustomerSelector';
import ReceiptPreview from '../components/ReceiptPreview';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  sellingPrice: number;
  taxEnabled: boolean;
  taxRate: number;
  discountAllowed: boolean;
  maxDiscountPercent: number;
  category?: { name: string };
  variants?: Array<{
    id: string;
    name: string;
    sellingPrice: number;
  }>;
}

interface CartItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  creditLimit: number;
  currentBalance: number;
  status: string;
}

interface Shift {
  id: string;
  status: string;
  openingAmount: number;
}

interface Payment {
  method: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER';
  amount: number;
  referenceNumber?: string;
  cashReceived?: number;
}

export default function POS() {
  const { user, logout } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showReceipt, setShowReceipt] = useState<string | null>(null);
  const [orderDiscount, setOrderDiscount] = useState(0);
  const [orderDiscountType, setOrderDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Payment state
  const [payments, setPayments] = useState<Payment[]>([{ method: 'CASH', amount: 0 }]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    loadProducts();
    
    // Online/offline detection
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProducts = async () => {
    try {
      const { data } = await api.get('/products', { params: { limit: 200, isActive: true } });
      setProducts(data.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode?.includes(search)
  );

  const addToCart = (product: Product) => {
    if (!activeShift) {
      setError('Please open a shift before making sales');
      return;
    }

    const existing = cart.find(item => item.productId === product.id);
    
    if (existing) {
      setCart(cart.map(item => {
        if (item.productId === product.id) {
          const newQty = item.quantity + 1;
          const subtotal = newQty * item.unitPrice;
          const discountAmount = subtotal * (item.discountPercent / 100);
          const taxableAmount = subtotal - discountAmount;
          const taxAmount = taxableAmount * (item.taxRate / 100);
          const total = taxableAmount + taxAmount;
          return { ...item, quantity: newQty, discountAmount, taxAmount, total };
        }
        return item;
      }));
    } else {
      const taxRate = product.taxEnabled ? (product.taxRate || 0) : 0;
      const taxAmount = product.sellingPrice * (taxRate / 100);
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        discountPercent: 0,
        discountAmount: 0,
        taxRate,
        taxAmount,
        total: product.sellingPrice + taxAmount,
      }]);
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        const subtotal = newQty * item.unitPrice;
        const discountAmount = subtotal * (item.discountPercent / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (item.taxRate / 100);
        const total = taxableAmount + taxAmount;
        return { ...item, quantity: newQty, discountAmount, taxAmount, total };
      }
      return item;
    }));
  };

  const updateItemDiscount = (productId: string, percent: number) => {
    setCart(cart.map(item => {
      if (item.productId === productId) {
        const subtotal = item.quantity * item.unitPrice;
        const discountAmount = subtotal * (percent / 100);
        const taxableAmount = subtotal - discountAmount;
        const taxAmount = taxableAmount * (item.taxRate / 100);
        const total = taxableAmount + taxAmount;
        return { ...item, discountPercent: percent, discountAmount, taxAmount, total };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const orderDiscountAmount = orderDiscountType === 'PERCENTAGE' 
    ? (subtotal - itemDiscounts) * (orderDiscount / 100)
    : orderDiscount;
  const totalDiscount = itemDiscounts + orderDiscountAmount;
  const taxableAmount = subtotal - totalDiscount;
  const totalTax = cart.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemAfterDiscount = itemSubtotal - item.discountAmount - (orderDiscountAmount * (itemSubtotal / subtotal || 0));
    return sum + (itemAfterDiscount * (item.taxRate / 100));
  }, 0);
  const total = taxableAmount + totalTax;

  const handleProceedToPayment = () => {
    if (!activeShift) {
      setError('Please open a shift before making sales');
      return;
    }
    if (cart.length === 0) {
      setError('Cart is empty');
      return;
    }
    setPayments([{ method: 'CASH', amount: total, cashReceived: 0 }]);
    setShowPaymentModal(true);
    setError('');
  };

  const addPaymentLine = () => {
    const paidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);
    const remaining = Math.max(0, total - paidSoFar);
    setPayments([...payments, { method: 'CASH', amount: remaining, cashReceived: 0 }]);
  };

  const removePaymentLine = (index: number) => {
    if (payments.length > 1) {
      setPayments(payments.filter((_, i) => i !== index));
    }
  };

  const updatePayment = (index: number, field: keyof Payment, value: any) => {
    setPayments(payments.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError('');

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    if (totalPaid < total) {
      setError(`Payment amount (Rs. ${totalPaid.toFixed(2)}) is less than total (Rs. ${total.toFixed(2)})`);
      setLoading(false);
      return;
    }

    try {
      const paymentData = payments.map(p => ({
        paymentMethod: p.method,
        amount: p.amount,
        referenceNumber: p.referenceNumber || null,
        cashReceived: p.method === 'CASH' ? (p.cashReceived || p.amount) : null,
        cashChange: p.method === 'CASH' ? Math.max(0, (p.cashReceived || p.amount) - p.amount) : null,
      }));

      const { data } = await api.post('/sales/checkout', {
        items: cart.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountAmount: item.discountAmount,
        })),
        discountAmount: orderDiscountAmount,
        discountType: orderDiscount > 0 ? orderDiscountType : null,
        discountValue: orderDiscount > 0 ? orderDiscount : null,
        payments: paymentData,
        customerId: selectedCustomer?.id || null,
        shiftId: activeShift?.id,
      });

      setShowReceipt(data.data.id);
      setCart([]);
      setSearch('');
      setSelectedCustomer(null);
      setOrderDiscount(0);
      setPayments([{ method: 'CASH', amount: 0 }]);
      setShowPaymentModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (activeShift) {
      if (!confirm('You have an active shift. Please close it before logging out.')) {
        return;
      }
    }
    logout();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Status Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 20px',
        background: '#1f2937',
        color: 'white',
        fontSize: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 600 }}>BevPOS</span>
          <span style={{ color: '#9ca3af' }}>|</span>
          <span>{user?.fullName}</span>
          <span style={{ color: '#9ca3af' }}>|</span>
          <span>Shift: {activeShift ? `OPEN (Rs. ${activeShift.openingAmount?.toFixed(2)})` : 'CLOSED'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 12,
            background: isOnline ? '#065f46' : '#991b1b',
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: isOnline ? '#10b981' : '#ef4444',
            }} />
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '4px 12px',
              background: '#374151',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Shift Manager */}
      <ShiftManager onShiftChange={setActiveShift} />

      {/* Main POS Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Panel - Products */}
        <div style={{ flex: 2, padding: 20, overflow: 'auto', background: '#f9fafb' }}>
          <input
            type="text"
            placeholder="Search products or scan barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: 14,
              border: '2px solid #d1d5db',
              borderRadius: 8,
              fontSize: 16,
              marginBottom: 16,
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={!activeShift}
                style={{
                  padding: 14,
                  background: activeShift ? 'white' : '#f3f4f6',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  textAlign: 'left',
                  cursor: activeShift ? 'pointer' : 'not-allowed',
                  opacity: activeShift ? 1 : 0.5,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: '#1f2937' }}>{product.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                  {product.sku || 'No SKU'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>
                  Rs. {product.sellingPrice.toFixed(2)}
                </div>
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
              No products found
            </div>
          )}
        </div>

        {/* Right Panel - Cart */}
        <div style={{ flex: 1, background: 'white', borderLeft: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', minWidth: 380 }}>
          <div style={{ padding: 16, borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: 18, color: '#1f2937', margin: 0 }}>Cart ({cart.length})</h2>
          </div>

          {/* Customer Selector */}
          <div style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}>
            <CustomerSelector
              selectedCustomer={selectedCustomer}
              onSelectCustomer={setSelectedCustomer}
            />
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                Cart is empty
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} style={{
                  padding: 10,
                  background: '#f9fafb',
                  borderRadius: 6,
                  marginBottom: 6,
                  fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, color: '#1f2937', flex: 1 }}>{item.productName}</div>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}
                    >
                      ×
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => updateQuantity(item.productId, -1)} style={{ width: 24, height: 24, background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer' }}>-</button>
                      <span style={{ fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, 1)} style={{ width: 24, height: 24, background: '#e5e7eb', border: 'none', borderRadius: 4, cursor: 'pointer' }}>+</button>
                    </div>
                    <div style={{ fontWeight: 700, color: '#dc2626' }}>
                      Rs. {item.total.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#6b7280' }}>Rs. {item.unitPrice.toFixed(2)} × {item.quantity}</span>
                    {item.taxRate > 0 && <span style={{ fontSize: 10, color: '#059669' }}>+{item.taxRate}% tax</span>}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={item.discountPercent}
                      onChange={(e) => updateItemDiscount(item.productId, parseFloat(e.target.value) || 0)}
                      style={{
                        width: 50,
                        padding: '2px 4px',
                        border: '1px solid #d1d5db',
                        borderRadius: 4,
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                      placeholder="0"
                    />
                    <span style={{ fontSize: 10, color: '#6b7280' }}>% off</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: 16, borderTop: '1px solid #e5e7eb', background: '#f9fafb' }}>
            {/* Order Discount */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: '#374151' }}>Order Discount:</span>
              <input
                type="number"
                min="0"
                step="0.5"
                value={orderDiscount}
                onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                style={{ width: 70, padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
              />
              <select
                value={orderDiscountType}
                onChange={(e) => setOrderDiscountType(e.target.value as any)}
                style={{ padding: '4px 8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
              >
                <option value="FIXED">Rs.</option>
                <option value="PERCENTAGE">%</option>
              </select>
            </div>

            <div style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>Subtotal:</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Discount:</span>
                <span>-Rs. {totalDiscount.toFixed(2)}</span>
              </div>
            )}
            {totalTax > 0 && (
              <div style={{ fontSize: 13, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                <span>Tax:</span>
                <span>Rs. {totalTax.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: 18, fontWeight: 700, paddingTop: 8, borderTop: '1px solid #e5e7eb' }}>
              <span>Total:</span>
              <span style={{ color: '#dc2626' }}>Rs. {total.toFixed(2)}</span>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #dc2626', color: '#dc2626', padding: 10, borderRadius: 6, marginBottom: 10, fontSize: 12 }}>
                {error}
              </div>
            )}

            {!activeShift && (
              <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', color: '#78350f', padding: 10, borderRadius: 6, marginBottom: 10, fontSize: 12 }}>
                Please open a shift to start selling
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={cart.length === 0 || loading || !activeShift}
              style={{
                width: '100%',
                padding: 14,
                background: cart.length === 0 || loading || !activeShift ? '#9ca3af' : '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 600,
                cursor: cart.length === 0 || loading || !activeShift ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Processing...' : `Pay Rs. ${total.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: 28,
            maxWidth: 500,
            width: '90%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ fontSize: 20, marginBottom: 4, color: '#1f2937' }}>Payment</h2>
            <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 20 }}>
              Total: <strong style={{ color: '#dc2626' }}>Rs. {total.toFixed(2)}</strong>
              {selectedCustomer && <span> | Customer: {selectedCustomer.name}</span>}
            </p>

            {payments.map((payment, index) => (
              <div key={index} style={{
                display: 'flex',
                gap: 8,
                marginBottom: 10,
                alignItems: 'center',
                padding: 10,
                background: '#f9fafb',
                borderRadius: 6,
              }}>
                <select
                  value={payment.method}
                  onChange={(e) => updatePayment(index, 'method', e.target.value)}
                  style={{ padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  value={payment.amount}
                  onChange={(e) => updatePayment(index, 'amount', parseFloat(e.target.value) || 0)}
                  style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
                  placeholder="Amount"
                />
                {payment.method === 'CASH' && (
                  <input
                    type="number"
                    step="0.01"
                    value={payment.cashReceived || 0}
                    onChange={(e) => updatePayment(index, 'cashReceived', parseFloat(e.target.value) || 0)}
                    style={{ width: 80, padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
                    placeholder="Received"
                  />
                )}
                {payment.method !== 'CASH' && (
                  <input
                    type="text"
                    value={payment.referenceNumber || ''}
                    onChange={(e) => updatePayment(index, 'referenceNumber', e.target.value)}
                    style={{ width: 100, padding: '8px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: 13 }}
                    placeholder="Ref #"
                  />
                )}
                {payments.length > 1 && (
                  <button
                    onClick={() => removePaymentLine(index)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18 }}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            <button
              onClick={addPaymentLine}
              style={{
                width: '100%',
                padding: '8px',
                background: '#f3f4f6',
                border: '1px dashed #d1d5db',
                borderRadius: 6,
                fontSize: 13,
                cursor: 'pointer',
                marginBottom: 16,
                color: '#374151',
              }}
            >
              + Add Split Payment
            </button>

            {(() => {
              const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
              const change = totalPaid - total;
              return (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                    <span>Total Paid:</span>
                    <span style={{ fontWeight: 600 }}>Rs. {totalPaid.toFixed(2)}</span>
                  </div>
                  {change >= 0 && payments.some(p => p.method === 'CASH') && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#059669' }}>
                      <span>Change:</span>
                      <span>Rs. {change.toFixed(2)}</span>
                    </div>
                  )}
                  {change < 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#dc2626' }}>
                      <span>Remaining:</span>
                      <span>Rs. {Math.abs(change).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
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
              <button
                onClick={handleCheckout}
                disabled={loading || payments.reduce((s, p) => s + p.amount, 0) < total}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: loading || payments.reduce((s, p) => s + p.amount, 0) < total ? '#9ca3af' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: loading || payments.reduce((s, p) => s + p.amount, 0) < total ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Processing...' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Preview Modal */}
      {showReceipt && (
        <ReceiptPreview
          saleId={showReceipt}
          onClose={() => setShowReceipt(null)}
        />
      )}
    </div>
  );
}
