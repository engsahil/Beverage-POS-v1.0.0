import { useState, useEffect } from 'react';
import api from '../api';

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  creditLimit: number;
  currentBalance: number;
  status: string;
}

interface CustomerSelectorProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
}

export default function CustomerSelector({ selectedCustomer, onSelectCustomer }: CustomerSelectorProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (search.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [search]);

  const searchCustomers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/customers', {
        params: {
          search,
          limit: 10,
          status: 'ACTIVE',
        },
      });
      setCustomers(data.data || []);
      setShowDropdown(true);
    } catch (err) {
      console.error('Failed to search customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    setSearch('');
    setShowDropdown(false);
  };

  const clearCustomer = () => {
    onSelectCustomer(null);
    setSearch('');
  };

  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <label style={{ display: 'block', marginBottom: 4, fontSize: 14, fontWeight: 500, color: '#374151' }}>
        Customer (Optional)
      </label>

      {selectedCustomer ? (
        <div style={{
          padding: 12,
          background: '#f0f9ff',
          border: '1px solid #0284c7',
          borderRadius: 6,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ fontWeight: 600, color: '#0c4a6e', marginBottom: 2 }}>
              {selectedCustomer.name}
            </div>
            <div style={{ fontSize: 12, color: '#0369a1' }}>
              {selectedCustomer.phone || selectedCustomer.email || 'No contact info'}
            </div>
            <div style={{ fontSize: 12, color: '#0369a1', marginTop: 2 }}>
              Balance: Rs. {selectedCustomer.currentBalance.toFixed(2)} | Limit: Rs. {selectedCustomer.creditLimit.toFixed(2)}
            </div>
          </div>
          <button
            onClick={clearCustomer}
            style={{
              padding: '6px 12px',
              background: '#fee2e2',
              color: '#991b1b',
              border: '1px solid #dc2626',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => search.length >= 2 && setShowDropdown(true)}
            placeholder="Search by name or phone..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              fontSize: 14,
            }}
          />

          {showDropdown && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 4,
              background: 'white',
              border: '1px solid #d1d5db',
              borderRadius: 6,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              maxHeight: 300,
              overflowY: 'auto',
              zIndex: 1000,
            }}>
              {loading ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>
                  Searching...
                </div>
              ) : customers.length === 0 ? (
                <div style={{ padding: 16, textAlign: 'center', color: '#6b7280' }}>
                  {search.length < 2 ? 'Type at least 2 characters to search' : 'No customers found'}
                </div>
              ) : (
                customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomer(customer)}
                    style={{
                      width: '100%',
                      padding: 12,
                      background: 'white',
                      border: 'none',
                      borderBottom: '1px solid #f3f4f6',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                  >
                    <div style={{ fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>
                      {customer.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {customer.phone || customer.email || 'No contact info'}
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      Balance: Rs. {customer.currentBalance.toFixed(2)}
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
