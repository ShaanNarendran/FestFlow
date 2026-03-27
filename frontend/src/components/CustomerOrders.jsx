import { useState, useEffect } from 'react';

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  
  useEffect(() => {
    const fetchOrders = () => {
      const savedOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
      if (savedOrders.length === 0) {
        setOrders([]);
        return;
      }

      
      Promise.all(
        savedOrders.map(async (order) => {
          try {
            const res = await fetch(`/api/orders/${order.id}`);
            if (!res.ok) return order; 
            const data = await res.json();
            return {
              ...order,
              status: data.status,
            };
          } catch (err) {
            return order;
          }
        })
      ).then(updatedOrders => {
        setOrders(updatedOrders);
        localStorage.setItem('customerOrders', JSON.stringify(updatedOrders));
      });
    };

    fetchOrders();
    const intervalId = setInterval(() => {
      const currentOrders = JSON.parse(localStorage.getItem('customerOrders') || '[]');
      if (currentOrders.some(o => o.status !== 'Completed')) {
        fetchOrders();
      }
    }, 10000);

    
    const handleOrderPlaced = () => {
      setIsOpen(true); 
      fetchOrders();
    };
    window.addEventListener('orderPlaced', handleOrderPlaced);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, []);

  const clearCompleted = () => {
    const active = orders.filter(o => o.status !== 'Completed');
    setOrders(active);
    localStorage.setItem('customerOrders', JSON.stringify(active));
  };

  if (orders.length === 0) return null;

  const activeCount = orders.filter(o => o.status !== 'Completed').length;

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '30px',
            padding: '12px 20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontWeight: 'bold',
            cursor: 'pointer',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          🍔 My Orders
          {activeCount > 0 && (
            <span style={{
              background: '#ffc107',
              color: 'black',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px'
            }}>
              {activeCount}
            </span>
          )}
        </button>
      )}

      {/* Slide-Up Panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0, top: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 10000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(2px)'
        }}>
          {/* Click outside to close */}
          <div style={{ flex: 1 }} onClick={() => setIsOpen(false)} />
          
          <div style={{
            background: 'white',
            borderTopLeftRadius: '20px',
            borderTopRightRadius: '20px',
            padding: '20px',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>🧾 My Orders</h2>
              <button 
                onClick={() => setIsOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#888' }}
              >
                ✕
              </button>
            </div>

            {orders.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>No active orders.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {orders.map((order) => {
                  const getStatusColor = () => {
                    if (order.status === 'Ready') return '#28a745';
                    if (order.status === 'Preparing') return '#ffc107';
                    if (order.status === 'Completed') return '#6c757d';
                    return '#007bff';
                  };

                  return (
                    <div key={order.id} style={{
                      border: `2px solid ${getStatusColor()}33`,
                      borderLeft: `6px solid ${getStatusColor()}`,
                      borderRadius: '8px',
                      padding: '15px',
                      background: '#fff'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{order.vendorName}</span>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 'bold', 
                          color: order.status === 'Completed' ? 'white' : getStatusColor(),
                          background: order.status === 'Completed' ? getStatusColor() : `${getStatusColor()}15`,
                          padding: '4px 8px',
                          borderRadius: '12px'
                        }}>
                          {order.status === 'Ready' ? '🎉 Ready!' : order.status}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.9rem', color: '#555', marginBottom: '8px' }}>
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join(', ')}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#888', borderTop: '1px solid #eee', paddingTop: '8px' }}>
                        <span>Order #{order.id.slice(-6).toUpperCase()}</span>
                        <span style={{ fontWeight: 'bold', color: 'green' }}>₹{order.totalAmount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {orders.some(o => o.status === 'Completed') && (
              <button 
                onClick={clearCompleted}
                style={{
                  width: '100%',
                  marginTop: '20px',
                  padding: '12px',
                  background: '#f8f9fa',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  color: '#666',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Clear Completed Orders
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
