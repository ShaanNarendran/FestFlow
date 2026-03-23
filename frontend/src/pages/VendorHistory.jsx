import { useState, useEffect } from 'react';

export default function VendorHistory() {
  const [data, setData] = useState({ orders: [], totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetch(`/api/orders/history`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(resData => {
        if (resData.orders) setData(resData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner" style={{ borderTopColor: 'var(--cherry-cola)' }}></div>
      <p style={{ marginTop: '1rem', fontWeight: '700', color: 'var(--cherry-cola)' }}>Crunching your numbers...</p>
    </div>
  );

  // Derive insights from orders
  const itemSales = {};
  data.orders.forEach(order => {
    order.items.forEach(item => {
      if (!itemSales[item.name]) itemSales[item.name] = { quantity: 0, revenue: 0 };
      itemSales[item.name].quantity += item.quantity;
      itemSales[item.name].revenue += item.price * item.quantity;
    });
  });

  const sortedItems = Object.entries(itemSales).sort((a, b) => b[1].quantity - a[1].quantity);
  const topItem = sortedItems[0] || ["None", { quantity: 0, revenue: 0 }];
  const chartMax = Math.max(...sortedItems.map(i => i[1].quantity), 1);

  // Hourly data from backend
  const hourlyData = data.hourlyDistribution || {};
  const maxHourlyOrders = Math.max(...Object.values(hourlyData).map(h => h.orders), 1);
  const peakHourEntry = Object.entries(hourlyData).sort((a, b) => b[1].orders - a[1].orders)[0];
  const peakHour = peakHourEntry ? parseInt(peakHourEntry[0]) : null;
  const peakTimeStr = peakHour !== null ? `${peakHour}:00 - ${peakHour + 1}:00` : "N/A";

  // Daily trend from backend
  const dailyTrend = data.dailyTrend || {};
  const dailyEntries = Object.entries(dailyTrend).sort((a, b) => a[0].localeCompare(b[0]));
  const maxDailyRevenue = Math.max(...dailyEntries.map(d => d[1].revenue), 1);

  // Payment breakdown from backend
  const paymentBreakdown = data.paymentBreakdown || { UPI: 0, Cash: 0 };
  const paymentCounts = data.paymentCounts || { UPI: 0, Cash: 0 };
  const totalPaymentRevenue = paymentBreakdown.UPI + paymentBreakdown.Cash;

  // Status breakdown from backend
  const statusBreakdown = data.statusBreakdown || {};
  const statusColors = {
    'Awaiting Verification': '#007bff',
    'Confirmed': '#17a2b8',
    'Preparing': '#ffc107',
    'Ready': '#28a745',
    'Completed': '#6c757d',
  };

  const avgOrderValue = data.avgOrderValue || 0;

  const tabStyle = (tab) => ({
    padding: '0.75rem 1.5rem',
    border: 'none',
    background: activeTab === tab ? 'var(--cherry-cola)' : 'transparent',
    color: activeTab === tab ? 'white' : 'var(--cherry-dark)',
    fontWeight: '800',
    fontSize: '0.9rem',
    borderRadius: '50px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  return (
    <div className="page-wide" style={{ padding: '2.5rem' }}>
      <h1 className="page-title" style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--cherry-cola)' }}>📊 Analytics</h1>
      <p className="page-subtitle" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Your complete order history and revenue insights</p>

      {/* KPI Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div className="card" style={{ background: 'var(--cherry-cola)', border: 'none', color: 'white', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4.5rem', opacity: 0.1 }}>💰</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', opacity: 0.8 }}>Total Revenue</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900 }}>₹{data.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4.5rem', opacity: 0.05 }}>📦</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Total Orders</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--cherry-dark)' }}>{data.orders.length}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4.5rem', opacity: 0.05 }}>📈</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Avg Order Value</div>
          <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'var(--cherry-dark)' }}>₹{avgOrderValue}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4.5rem', opacity: 0.05 }}>🔥</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Top Seller</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--cherry-dark)', marginTop: '0.25rem' }}>{topItem[0]}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>{topItem[1].quantity} units · ₹{topItem[1].revenue}</div>
        </div>
        <div className="card" style={{ border: '2px solid var(--cherry-cola)', background: 'white', padding: '1.75rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '4.5rem', opacity: 0.05 }}>⏰</div>
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '900', color: 'var(--cherry-cola)' }}>Peak Hours</div>
          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--cherry-dark)', marginTop: '0.25rem' }}>{peakTimeStr}</div>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', opacity: 0.7 }}>Most active time</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '0.5rem', borderRadius: '50px', border: '2px solid var(--border)' }}>
        <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>📊 Overview</button>
        <button style={tabStyle('hourly')} onClick={() => setActiveTab('hourly')}>⏰ Hourly</button>
        <button style={tabStyle('daily')} onClick={() => setActiveTab('daily')}>📅 Daily Trend</button>
        <button style={tabStyle('orders')} onClick={() => setActiveTab('orders')}>📋 Orders</button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
          {/* Payment Method Breakdown */}
          <div className="card" style={{ border: '2px solid var(--cherry-cola)' }}>
            <h3 style={{ fontWeight: 900, color: 'var(--cherry-cola)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💳 Payment Methods
            </h3>
            {totalPaymentRevenue > 0 ? (
              <>
                {/* Stacked bar */}
                <div style={{ height: '28px', borderRadius: '14px', overflow: 'hidden', display: 'flex', marginBottom: '1.5rem', border: '2px solid var(--border)' }}>
                  <div style={{
                    width: `${(paymentBreakdown.UPI / totalPaymentRevenue) * 100}%`,
                    background: 'var(--cherry-cola)',
                    transition: 'width 1s ease-out',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: '0.75rem', fontWeight: '800'
                  }}>
                    {Math.round((paymentBreakdown.UPI / totalPaymentRevenue) * 100)}%
                  </div>
                  <div style={{
                    width: `${(paymentBreakdown.Cash / totalPaymentRevenue) * 100}%`,
                    background: '#f0c040',
                    transition: 'width 1s ease-out',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#333', fontSize: '0.75rem', fontWeight: '800'
                  }}>
                    {Math.round((paymentBreakdown.Cash / totalPaymentRevenue) * 100)}%
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div style={{ flex: 1, padding: '1rem', background: 'rgba(154, 0, 2, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--cherry-cola)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>UPI</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>₹{paymentBreakdown.UPI.toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{paymentCounts.UPI} orders</div>
                  </div>
                  <div style={{ flex: 1, padding: '1rem', background: 'rgba(240, 192, 64, 0.1)', borderRadius: '12px', borderLeft: '4px solid #f0c040' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cash</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>₹{paymentBreakdown.Cash.toLocaleString()}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{paymentCounts.Cash} orders</div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No payment data yet</div>
            )}
          </div>

          {/* Order Status Breakdown */}
          <div className="card" style={{ border: '2px solid var(--cherry-cola)' }}>
            <h3 style={{ fontWeight: 900, color: 'var(--cherry-cola)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Order Status
            </h3>
            {Object.keys(statusBreakdown).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {Object.entries(statusBreakdown).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                  const totalOrders = data.orders.length;
                  const pct = Math.round((count / totalOrders) * 100);
                  return (
                    <div key={status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>
                          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: statusColors[status] || '#999', marginRight: '0.5rem' }}></span>
                          {status}
                        </span>
                        <span style={{ fontWeight: '800', color: 'var(--cherry-cola)', fontSize: '0.9rem' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: statusColors[status] || '#999',
                          borderRadius: '4px',
                          transition: 'width 1s ease-out'
                        }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No orders yet</div>
            )}
          </div>

          {/* Item Sales Distribution */}
          {sortedItems.length > 0 && (
            <div className="card" style={{ border: '2px solid var(--cherry-cola)', gridColumn: 'span 1' }}>
              <h3 style={{ fontWeight: 900, color: 'var(--cherry-cola)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🍔 Item Performance
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {sortedItems.map(([name, stats], i) => (
                  <div key={i} style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                      <span style={{ fontWeight: '700' }}>
                        {i === 0 && '🥇 '}{i === 1 && '🥈 '}{i === 2 && '🥉 '}{name}
                      </span>
                      <span style={{ color: 'var(--cherry-cola)', fontWeight: '800', fontSize: '0.9rem' }}>
                        {stats.quantity} sold · ₹{stats.revenue.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: '10px', background: 'var(--bg-secondary)', borderRadius: '5px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(stats.quantity / chartMax) * 100}%`,
                        background: i === 0 ? 'var(--cherry-cola)' : i === 1 ? '#e85d68' : i === 2 ? '#f0908a' : '#ddd',
                        borderRadius: '5px',
                        transition: 'width 1s ease-out'
                      }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Hourly Tab */}
      {activeTab === 'hourly' && (
        <div className="card" style={{ border: '2px solid var(--cherry-cola)' }}>
          <h3 style={{ fontWeight: 900, color: 'var(--cherry-cola)', marginBottom: '0.5rem' }}>⏰ Hourly Sales Heatmap</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Order volume across 24 hours — taller bars indicate busier times</p>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '180px', padding: '0 0.5rem' }}>
            {Array.from({ length: 24 }, (_, h) => {
              const d = hourlyData[h] || { orders: 0, revenue: 0 };
              const heightPct = maxHourlyOrders > 0 ? (d.orders / maxHourlyOrders) * 100 : 0;
              const isPeak = h === peakHour;
              return (
                <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: '800', color: isPeak ? 'var(--cherry-cola)' : 'var(--text-muted)' }}>
                    {d.orders > 0 ? d.orders : ''}
                  </div>
                  <div
                    title={`${h}:00 — ${d.orders} orders, ₹${d.revenue}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(heightPct, d.orders > 0 ? 8 : 2)}%`,
                      background: isPeak
                        ? 'var(--cherry-cola)'
                        : d.orders > 0
                          ? `rgba(154, 0, 2, ${0.2 + (d.orders / maxHourlyOrders) * 0.6})`
                          : 'var(--bg-secondary)',
                      borderRadius: '4px 4px 0 0',
                      transition: 'height 0.8s ease-out',
                      minHeight: '2px',
                    }}
                  ></div>
                </div>
              );
            })}
          </div>

          {/* Hour labels */}
          <div style={{ display: 'flex', gap: '3px', padding: '0.5rem 0.5rem 0', borderTop: '1px solid var(--border)' }}>
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '0.6rem',
                fontWeight: h === peakHour ? '900' : '600',
                color: h === peakHour ? 'var(--cherry-cola)' : 'var(--text-muted)',
              }}>
                {h % 3 === 0 ? `${h}` : ''}
              </div>
            ))}
          </div>

          {peakHour !== null && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(154, 0, 2, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak Hour</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>{peakTimeStr}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders at Peak</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>{hourlyData[peakHour]?.orders || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue at Peak</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>₹{(hourlyData[peakHour]?.revenue || 0).toLocaleString()}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Daily Trend Tab */}
      {activeTab === 'daily' && (
        <div className="card" style={{ border: '2px solid var(--cherry-cola)' }}>
          <h3 style={{ fontWeight: 900, color: 'var(--cherry-cola)', marginBottom: '0.5rem' }}>📅 Daily Revenue Trend</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>Revenue over the last 14 days</p>

          {dailyEntries.length > 0 ? (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '200px', padding: '0 0.5rem' }}>
                {dailyEntries.map(([day, stats]) => {
                  const heightPct = (stats.revenue / maxDailyRevenue) * 100;
                  const dayLabel = new Date(day + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                  return (
                    <div key={day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--cherry-cola)' }}>
                        ₹{stats.revenue >= 1000 ? `${(stats.revenue / 1000).toFixed(1)}k` : stats.revenue}
                      </div>
                      <div
                        title={`${dayLabel}: ${stats.orders} orders, ₹${stats.revenue}`}
                        style={{
                          width: '100%',
                          height: `${Math.max(heightPct, 4)}%`,
                          background: `rgba(154, 0, 2, ${0.3 + (stats.revenue / maxDailyRevenue) * 0.7})`,
                          borderRadius: '6px 6px 0 0',
                          transition: 'height 0.8s ease-out',
                        }}
                      ></div>
                      <div style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                        {dayLabel}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(154, 0, 2, 0.05)', borderRadius: '12px', display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Best Day</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>
                    {new Date(dailyEntries.sort((a, b) => b[1].revenue - a[1].revenue)[0][0] + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    ₹{dailyEntries.sort((a, b) => b[1].revenue - a[1].revenue)[0][1].revenue.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Daily Revenue</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>
                    ₹{Math.round(dailyEntries.reduce((s, d) => s + d[1].revenue, 0) / dailyEntries.length).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Avg Daily Orders</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '900', color: 'var(--cherry-dark)' }}>
                    {Math.round(dailyEntries.reduce((s, d) => s + d[1].orders, 0) / dailyEntries.length)}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No order data in the last 14 days</div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <>
          {data.orders.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', border: '2px dashed var(--border)' }}>
              No orders recorded yet.
            </div>
          ) : (
            <div className="table-wrapper" style={{ border: '2px solid var(--cherry-cola)', background: 'white' }}>
              <table>
                <thead>
                  <tr style={{ background: 'var(--cherry-cola)' }}>
                    <th style={{ color: 'white' }}>ID</th>
                    <th style={{ color: 'white' }}>Event</th>
                    <th style={{ color: 'white' }}>Items</th>
                    <th style={{ color: 'white' }}>Total</th>
                    <th style={{ color: 'white' }}>Payment</th>
                    <th style={{ color: 'white' }}>Status</th>
                    <th style={{ color: 'white' }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.orders.map((order) => (
                    <tr key={order._id}>
                      <td style={{ fontWeight: 800, color: 'var(--cherry-cola)' }}>#{order._id.slice(-6).toUpperCase()}</td>
                      <td><span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--cherry-dark)' }}>{order.eventCode}</span></td>
                      <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {order.items.map((it) => `${it.quantity}× ${it.name}`).join(', ')}
                      </td>
                      <td style={{ fontWeight: 900, color: 'var(--cherry-dark)' }}>₹{order.totalAmount}</td>
                      <td>
                        <span className="badge" style={{
                          background: order.paymentMethod === 'Cash' ? 'rgba(240, 192, 64, 0.15)' : 'rgba(154, 0, 2, 0.08)',
                          color: order.paymentMethod === 'Cash' ? '#b8860b' : 'var(--cherry-cola)',
                          border: 'none', fontWeight: '700'
                        }}>
                          {order.paymentMethod === 'Cash' ? '💵' : '📱'} {order.paymentMethod || 'UPI'}
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{
                          background: (order.status === 'Completed' || order.status === 'Ready') ? 'var(--success-bg)' : 'var(--warning-bg)',
                          color: (order.status === 'Completed' || order.status === 'Ready') ? 'var(--success)' : 'var(--warning)',
                          border: 'none'
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
