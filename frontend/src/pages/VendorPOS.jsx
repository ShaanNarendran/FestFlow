import { useState, useEffect } from 'react';

export default function VendorPOS() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const token = localStorage.getItem('token');

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders/active`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setOrders(data);
      else throw new Error(data.error);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchOrders();
      else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const awaitingVerification = orders.filter((o) => o.status === 'Awaiting Verification');
  const preparing = orders.filter((o) => o.status === 'Preparing');

  return (
    <div className="page-wide" style={{ padding: '2rem' }}>
      <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--text-primary)' }}>Live POS</h1>
      <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>
        Orders update every 3 seconds · <span style={{ color: 'var(--text-primary)' }}>{orders.length} active orders</span>
      </p>

      {error && <div className="error-msg">{error}</div>}

      <div className="kanban" style={{ marginTop: '2rem' }}>
        {/* Column: Awaiting Verification */}
        <div className="kanban-col" style={{ border: 'none', background: 'white' }}>
          <div className="kanban-col-title" style={{ color: 'var(--text-primary)', fontWeight: '900' }}>
            New ({awaitingVerification.length})
          </div>
          {awaitingVerification.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem 0' }}>No new orders</p>
          )}
          {awaitingVerification.map((order) => (
            <div className="kanban-card" key={order._id} style={{ border: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontSize: '1rem', display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{item.quantity}× {item.name}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              {order.upiTransactionId && (
                <div style={{ marginBottom: '1rem', padding: '0.5rem 0.75rem', background: 'rgba(154, 0, 2, 0.05)', borderRadius: '8px', border: 'none' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>UPI Txn ID</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{order.upiTransactionId}</div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)', fontSize: '1.2rem' }}>₹{order.totalAmount}</span>
                <button className="btn btn-success" style={{ padding: '0.5rem 1rem', borderRadius: '50px' }} onClick={() => updateStatus(order._id, 'Preparing')}>
                   Approve
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Column: Preparing */}
        <div className="kanban-col" style={{ border: 'none', background: 'white' }}>
          <div className="kanban-col-title" style={{ color: 'var(--text-primary)', fontWeight: '900' }}>
             Kitchen ({preparing.length})
          </div>
          {preparing.map((order) => (
            <div className="kanban-card" key={order._id} style={{ border: 'none', background: 'var(--bg-primary)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>
                  #{order._id.slice(-6).toUpperCase()}
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '50px',
                    background: order.paymentMethod === 'Cash' ? 'rgba(240, 192, 64, 0.2)' : 'rgba(154, 0, 2, 0.08)',
                    color: order.paymentMethod === 'Cash' ? '#b8860b' : 'var(--text-primary)'
                  }}>
                    {order.paymentMethod === 'Cash' ? '💵 Cash' : '📱 UPI'}
                  </span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    📱 {order.customerPhone}
                  </span>
                </div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                {order.items.map((item, i) => (
                  <div key={i} style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{item.quantity}× {item.name}</div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--border)', paddingTop: '1rem' }}>
                <span style={{ fontWeight: 900, color: 'var(--text-primary)' }}>₹{order.totalAmount}</span>
                <button className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '50px' }} onClick={() => {
                  updateStatus(order._id, 'Ready');
                  const msg = encodeURIComponent(`Hello! Your order (#${order._id.slice(-6).toUpperCase()}) is ready for pickup! `);
                  const phoneStr = String(order.customerPhone).replace(/\\D/g, '');
                  const phone = phoneStr.length === 10 ? `91${phoneStr}` : phoneStr;
                  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                }}>
                  Order Ready & Notify
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
