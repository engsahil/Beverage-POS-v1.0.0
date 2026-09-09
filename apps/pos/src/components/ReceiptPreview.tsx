import { useState, useEffect } from 'react';
import api from '../api';

interface ReceiptProps {
  saleId: string;
  onClose: () => void;
}

interface ReceiptData {
  sale: {
    id: string;
    saleNumber: string;
    saleDate: string;
    status: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    amountPaid: number;
    outstandingAmount: number;
    notes: string | null;
  };
  business: {
    name: string;
    address: string | null;
    phone: string | null;
    logo: string | null;
  };
  branch: {
    name: string;
  };
  cashier: {
    fullName: string;
  };
  customer: {
    name: string;
    phone: string | null;
  } | null;
  items: Array<{
    productName: string;
    variantName: string | null;
    quantity: number;
    unitPrice: number;
    discountAmount: number;
    total: number;
  }>;
  payments: Array<{
    method: string;
    amount: number;
    referenceNumber: string | null;
  }>;
}

export default function ReceiptPreview({ saleId, onClose }: ReceiptProps) {
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    loadReceipt();
  }, [saleId]);

  const loadReceipt = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/receipts/${saleId}`);
      setReceipt(data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to load receipt');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      setPrinting(true);
      
      // Try to get PDF first
      const response = await api.get(`/receipts/${saleId}/pdf`, {
        responseType: 'blob',
      });

      // Create blob URL
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 250);
        };
      }
      
      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Print failed:', err);
      // Fallback to browser print
      window.print();
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/receipts/${saleId}/pdf`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receipt?.sale.saleNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download PDF');
    }
  };

  if (loading) {
    return (
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
        zIndex: 2000,
      }}>
        <div style={{
          background: 'white',
          padding: 32,
          borderRadius: 8,
          textAlign: 'center',
        }}>
          Loading receipt...
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
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
        zIndex: 2000,
      }}>
        <div style={{
          background: 'white',
          padding: 32,
          borderRadius: 8,
          maxWidth: 400,
        }}>
          <div style={{ color: '#991b1b', marginBottom: 16 }}>{error || 'Failed to load receipt'}</div>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
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
      zIndex: 2000,
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 8,
        maxWidth: 500,
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Receipt Preview</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: '#6b7280',
            }}
          >
            ×
          </button>
        </div>

        {/* Receipt Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
        }}>
          <div id="receipt-content" style={{
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: 1.5,
            maxWidth: 300,
            margin: '0 auto',
          }}>
            {/* Business Info */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {receipt.business.logo && (
                <img src={receipt.business.logo} alt="Logo" style={{ maxWidth: 100, marginBottom: 8 }} />
              )}
              <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
                {receipt.business.name}
              </div>
              {receipt.business.address && (
                <div style={{ fontSize: 11 }}>{receipt.business.address}</div>
              )}
              {receipt.business.phone && (
                <div style={{ fontSize: 11 }}>Tel: {receipt.business.phone}</div>
              )}
            </div>

            {/* Sale Info */}
            <div style={{ marginBottom: 16 }}>
              <div>Sale #: {receipt.sale.saleNumber}</div>
              <div>Date: {new Date(receipt.sale.saleDate).toLocaleString()}</div>
              <div>Cashier: {receipt.cashier.fullName}</div>
              <div>Branch: {receipt.branch.name}</div>
              {receipt.customer && (
                <div>Customer: {receipt.customer.name}</div>
              )}
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }}></div>

            {/* Items */}
            <div style={{ marginBottom: 16 }}>
              {receipt.items.map((item, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 'bold' }}>{item.productName}</div>
                  {item.variantName && (
                    <div style={{ fontSize: 11, color: '#666' }}>{item.variantName}</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.quantity} × Rs. {item.unitPrice.toFixed(2)}</span>
                    <span>Rs. {item.total.toFixed(2)}</span>
                  </div>
                  {item.discountAmount > 0 && (
                    <div style={{ fontSize: 11, color: '#dc2626' }}>
                      Discount: -Rs. {item.discountAmount.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px dashed #000', marginBottom: 8 }}></div>

            {/* Totals */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Subtotal:</span>
                <span>Rs. {receipt.sale.subtotal.toFixed(2)}</span>
              </div>
              {receipt.sale.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>Discount:</span>
                  <span>-Rs. {receipt.sale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              {receipt.sale.taxAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tax:</span>
                  <span>Rs. {receipt.sale.taxAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 'bold',
                fontSize: 14,
                marginTop: 8,
                paddingTop: 8,
                borderTop: '1px solid #000',
              }}>
                <span>TOTAL:</span>
                <span>Rs. {receipt.sale.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            <div style={{ marginBottom: 16 }}>
              {receipt.payments.map((payment, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{payment.method}:</span>
                  <span>Rs. {payment.amount.toFixed(2)}</span>
                </div>
              ))}
              {receipt.sale.outstandingAmount > 0 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  color: '#dc2626',
                  fontWeight: 'bold',
                }}>
                  <span>Balance Due:</span>
                  <span>Rs. {receipt.sale.outstandingAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', fontSize: 11, marginTop: 16 }}>
              <div>Thank you for your business!</div>
              {receipt.sale.notes && (
                <div style={{ marginTop: 8 }}>{receipt.sale.notes}</div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          padding: 16,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: 8,
        }}>
          <button
            onClick={handlePrint}
            disabled={printing}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: printing ? 'not-allowed' : 'pointer',
            }}
          >
            {printing ? 'Printing...' : 'Print Receipt'}
          </button>
          <button
            onClick={handleDownloadPDF}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#78350f',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Download PDF
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: '#f3f4f6',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
