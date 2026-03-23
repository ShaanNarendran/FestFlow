import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CashierPOS() {
  const [vendor, setVendor] = useState(null);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [recentOrders, setRecentOrders] = useState([]);
  const [totalCash, setTotalCash] = useState(0);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  const fetchOrders = async () => {
    try {
      const res = await fetch(`/api/orders/staff-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRecentOrders(data.orders || []);
        setTotalCash(data.totalCash || 0);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'staff') {
      navigate('/signup?mode=staff');
      return;
    }

    // Fetch vendor inventory
    fetch(`/api/vendors/${user.vendor.id}`)
      .then(res => res.json())
      .then(data => {
        setVendor(data);
        setItems(data.inventory);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch recent orders
    fetchOrders();
  }, []);

  const addToCart = (item) => {
    setCart(prev => ({
      ...prev,
      [item.name]: {
        ...item,
        quantity: (prev[item.name]?.quantity || 0) + 1
      }
    }));
  };

  const removeFromCart = (itemName) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[itemName].quantity > 1) {
        newCart[itemName] = { ...newCart[itemName], quantity: newCart[itemName].quantity - 1 };
      } else {
        delete newCart[itemName];
      }
      return newCart;
    });
  };

  const total = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleLoggedCash = async () => {
    if (Object.keys(cart).length === 0) return;
    if (!phone) {
      setMessage({ type: 'error', text: 'Customer phone required for records' });
      return;
    }

    setProcessing(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`/api/orders/cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: Object.values(cart),
          totalAmount: total,
          customerPhone: phone
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Cash Payment Logged Successfully!' });
      setCart({});
      setPhone('');
      
      // Refresh inventory
      const vRes = await fetch(`/api/vendors/${user.vendor.id}`);
      const vData = await vRes.json();
      setItems(vData.inventory);

      // Refresh orders list
      fetchOrders();

    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Preparing': return { background: 'rgba(255, 193, 7, 0.15)', color: '#b8860b' };
      case 'Ready': return { background: 'rgba(40, 167, 69, 0.15)', color: '#28a745' };
      case 'Completed': return { background: 'rgba(108, 117, 125, 0.15)', color: '#6c757d' };
      default: return { background: 'rgba(0, 123, 255, 0.15)', color: '#007bff' };
    }
  };

  if (loading) return <div className="loading-screen">Loading Stall...</div>;

  return (
    <div className="page-wide" style={{ paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ color: 'var(--cherry-cola)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
             💵 Cashier POS
          </h1>
          <p className="page-subtitle">{vendor?.name} · {user.username}</p>
        </div>
        <button className="btn btn-outline" onClick={() => { localStorage.clear(); navigate('/signup'); }}>Logout</button>
      </div>

      {message.text && (
        <div className={message.type === 'error' ? 'error-msg' : 'success-msg'} style={{ marginBottom: '1.5rem', fontWeight: 'bold' }}>
          {message.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
        {/* Menu Section */}
        <div className="card" style={{ border: '2px solid var(--cherry-cola)' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--cherry-dark)', fontSize: '1.25rem' }}>Menu Items</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {items.map((item, i) => (
              <button
                key={i}
                disabled={item.stock === 0}
                onClick={() => addToCart(item)}
                style={{
                  padding: '1rem',
                  borderRadius: '12px',
                  border: item.stock === 0 ? '1px dashed #ccc' : '2px solid var(--border)',
                  background: item.stock === 0 ? '#f5f5f5' : 'white',
                  cursor: item.stock === 0 ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontWeight: '800', fontSize: '1.1rem' }}>{item.name}</div>
                <div style={{ color: 'var(--success)', fontWeight: '700' }}>₹{item.price}</div>
                <div style={{ fontSize: '0.8rem', color: item.stock < 10 ? 'var(--danger)' : 'var(--text-muted)' }}>
                  {item.stock} left
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cart/Checkout Section */}
        <div className="card" style={{ background: 'var(--bg-secondary)', border: '2px solid var(--cherry-cola)', alignSelf: 'start', position: 'sticky', top: '20px' }}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--cherry-cola)', fontWeight: '900' }}>Manual Entry</h2>
          
          <div className="form-group">
            <label className="form-label">Phone Number (Required)</label>
            <input 
              className="form-input" 
              type="tel" 
              placeholder="9876543210" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ margin: '1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Object.values(cart).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.75rem', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '700' }}>{item.name}</div>
                  <div style={{ fontSize: '0.8rem' }}>₹{item.price} × {item.quantity}</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   <button onClick={() => removeFromCart(item.name)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--cream-vanilla)' }}>-</button>
                   <button onClick={() => addToCart(item)} style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--cream-vanilla)' }}>+</button>
                </div>
              </div>
            ))}
            {Object.keys(cart).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: '0.9rem'}}>Select items to start</div>
            )}
          </div>

          <div style={{ borderTop: '2px solid var(--cherry-cola)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: '400', fontSize: '1rem' }}>Total Amount</span>
            <span style={{ fontWeight: '900', fontSize: '1.5rem', color: 'var(--cherry-cola)' }}>₹{total}</span>
          </div>

          <button 
            className="btn btn-primary btn-block btn-lg" 
            style={{ marginTop: '1.5rem', borderRadius: '12px' }}
            disabled={processing || Object.keys(cart).length === 0}
            onClick={handleLoggedCash}
          >
            {processing ? 'Logging...' : 'LOG CASH PAYMENT'}
          </button>
        </div>
      </div>

      {/* Recent Cash Orders Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--cherry-cola)', margin: 0 }}>
            📋 Recent Cash Orders
          </h2>
          <div style={{
            padding: '0.5rem 1.25rem', borderRadius: '50px',
            background: 'var(--cherry-cola)', color: 'white', fontWeight: '900', fontSize: '1rem'
          }}>
            Total: ₹{totalCash.toLocaleString()}
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', border: '2px dashed var(--border)' }}>
            No cash orders logged yet today. Start taking orders above!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {recentOrders.map((order) => (
              <div className="card" key={order._id} style={{
                border: '2px solid var(--border)',
                background: 'white',
                padding: '1.25rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--cherry-cola)' }}>
                    #{order._id.slice(-6).toUpperCase()}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '800', padding: '0.2rem 0.5rem', borderRadius: '50px',
                      ...getStatusStyle(order.status)
                    }}>
                      {order.status}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '0.15rem' }}>
                      <span style={{ fontWeight: '600', color: 'var(--cherry-dark)' }}>{item.quantity}× {item.name}</span>
                      <span style={{ fontWeight: '700', color: 'var(--cherry-cola)' }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed var(--border)', paddingTop: '0.5rem' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📱 {order.customerPhone}</span>
                  <span style={{ fontWeight: '900', color: 'var(--cherry-cola)' }}>₹{order.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
