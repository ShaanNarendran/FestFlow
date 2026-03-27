import { useState, useEffect } from 'react';

export default function SuperAdminDash() {
  const adminRaw = localStorage.getItem('user');
  const user = adminRaw ? JSON.parse(adminRaw) : null;
  
  const [eventCode, setEventCode] = useState(user?.managedEventCodes?.[0] || '');
  const [applications, setApplications] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tab, setTab] = useState('applications'); 
  const token = localStorage.getItem('token');

  const fetchApplications = async () => {
    if (!eventCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/applications/${eventCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setApplications(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!eventCode) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/analytics/${eventCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAnalytics(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventCode) {
      if (tab === 'applications') fetchApplications();
      if (tab === 'analytics') fetchAnalytics();
    }
  }, [eventCode, tab, token]);

  const handleApprove = async (appId, status) => {
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/approve/${appId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      fetchApplications();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page-wide" style={{padding: '2rem'}}>
      <h1 className="page-title" style={{fontSize: '3rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '0.5rem'}}>
        Admin Hub
      </h1>
      <p className="page-subtitle" style={{fontWeight: 600}}>Event management & high-level analytics</p>

      {error && <div className="error-msg">{error}</div>}
      {message && <div className="success-msg">{message}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setTab('applications')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: 800, color: tab === 'applications' ? 'var(--text-primary)' : '#999',
            borderBottom: tab === 'applications' ? '3px solid var(--text-primary)' : '3px solid transparent'
          }}
        >
          APPLICATIONS
        </button>
        <button 
          onClick={() => setTab('analytics')}
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: 800, color: tab === 'analytics' ? 'var(--text-primary)' : '#999',
            borderBottom: tab === 'analytics' ? '3px solid var(--text-primary)' : '3px solid transparent'
          }}
        >
          ANALYTICS
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666' }}>EVENT:</label>
           <input 
             className="form-input" 
             style={{ width: '120px', padding: '0.4rem' }} 
             value={eventCode} 
             onChange={(e) => setEventCode(e.target.value.toUpperCase())}
           />
        </div>
      </div>

      {loading && <div className="loading-screen">Synchronizing Data...</div>}

      {/* Applications Tab */}
      {!loading && tab === 'applications' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {applications.length === 0 && <p style={{ textAlign: 'center', py: '4rem', color: '#999' }}>No applications for this code.</p>}
          {applications.map((app) => (
            <div className="card" key={app._id} style={{ border: '2px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontWeight: 900, color: 'var(--text-primary)' }}>{app.vendorId?.name}</h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>UPI: {app.vendorId?.upiId} · /{app.vendorId?.slug}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`badge ${app.status === 'approved' ? 'badge-approved' : app.status === 'rejected' ? 'badge-rejected' : 'badge-pending'}`} style={{ marginBottom: '0.5rem' }}>
                    {app.status}
                  </span>
                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button className="btn btn-sm btn-success" onClick={() => handleApprove(app._id, 'approved')}>Approve</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleApprove(app._id, 'rejected')}>Reject</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {!loading && tab === 'analytics' && analytics && (
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Top Scorecards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div className="card" style={{ background: 'var(--bg-dark)', color: 'white', border: 'none' }}>
              <div style={{ opacity: 0.8, fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase' }}>Event Revenue</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900 }}>${analytics.totals.totalRevenue.toLocaleString()}</div>
            </div>
            <div className="card" style={{ border: 'none' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>Total Transactions</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>{analytics.totals.totalOrders}</div>
            </div>
            <div className="card" style={{ border: 'none' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 800 }}>Payment Split</div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <div><span style={{ color: 'var(--success)', fontWeight: 900 }}>CASH:</span> ${analytics.totals.cashRevenue.toLocaleString()}</div>
                <div><span style={{ color: 'var(--text-primary)', fontWeight: 900 }}>UPI:</span> ${analytics.totals.upiRevenue.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Revenue Distribution Chart */}
          <div className="card" style={{ border: '2px solid var(--border)' }}>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>Stall Revenue Distribution</h3>
            {analytics.vendorStats.length > 0 ? (
              <div style={{ height: '300px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '2%', paddingBottom: '40px', position: 'relative' }}>
                {analytics.vendorStats.map((v, i) => {
                  const height = (v.revenue / analytics.totals.totalRevenue) * 100;
                  return (
                    <div key={i} style={{ flex: 1, height: `${height}%`, background: 'var(--bg-dark)', borderRadius: '8px 8px 0 0', position: 'relative', minWidth: '40px' }}>
                      <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        ${v.revenue > 1000 ? `${(v.revenue/1000).toFixed(1)}k` : v.revenue}
                      </div>
                      <div style={{ position: 'absolute', bottom: '-40px', width: '100%', textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, transform: 'rotate(-45deg)', whiteSpace: 'nowrap' }}>
                        {v.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p style={{ textAlign: 'center', py: '2rem' }}>No data available yet.</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Hourly Trend Mini Chart */}
            <div className="card" style={{ border: '2px solid var(--border)' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 900, fontSize: '1rem' }}>24h Revenue Trend</h3>
                <div style={{ height: '120px', width: '100%', display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
                    {Array.from({ length: 24 }).map((_, i) => {
                        const hourStat = analytics.hourlyStats.find(s => s._id === i);
                        const maxH = Math.max(...analytics.hourlyStats.map(s => s.revenue), 1);
                        const h = hourStat ? (hourStat.revenue / maxH) * 100 : 5;
                        return (
                            <div key={i} title={`${i}:00`} style={{ flex: 1, height: `${h}%`, background: hourStat ? 'var(--text-primary)' : '#eee', borderRadius: '2px' }} />
                        );
                    })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#999', marginTop: '0.5rem' }}>
                    <span>24h ago</span>
                    <span>Now</span>
                </div>
            </div>

            {/* Top Performers List */}
            <div className="card" style={{ border: '2px solid var(--border)' }}>
                <h3 style={{ marginBottom: '1rem', fontWeight: 900, fontSize: '1rem' }}>Top Stalls</h3>
                {analytics.vendorStats.slice(0, 5).map((v, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                        <span style={{ fontWeight: 700 }}>{v.name}</span>
                        <span style={{ fontWeight: 900, color: 'var(--success)' }}>${v.revenue}</span>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
