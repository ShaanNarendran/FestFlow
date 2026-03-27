import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Signup() {
  const [searchParams] = useSearchParams();
  
  
  const [phase, setPhase] = useState('select'); 
  const [role, setRole] = useState('vendor'); 
  const [action, setAction] = useState('signup');

  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'admin') {
      setRole('admin');
      setPhase('form');
      setAction('login');
    } else if (mode === 'staff') {
      setRole('staff');
      setPhase('form');
      setAction('login');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    let url = '';
    let body = {};

    if (role === 'vendor') {
      url = action === 'signup' ? '/api/vendors/signup' : '/api/vendors/login';
      body = action === 'signup' ? { name, upiId, password } : { name, password };
    } else if (role === 'staff') {
      url = '/api/staff/login';
      body = { username: name, password };
    } else if (role === 'admin') {
      url = action === 'signup' ? '/api/admin/signup' : '/api/admin/login';
      body = action === 'signup' ? { username: name, password, inviteCode } : { username: name, password };
    }

    try {
      const res = await fetch(`http://${window.location.hostname}:5000${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      localStorage.setItem('token', data.token);
      if (role === 'admin') {
        localStorage.setItem('user', JSON.stringify({ ...data.admin, role: 'admin' }));
        navigate('/super-admin');
      } else if (role === 'staff') {
        localStorage.setItem('user', JSON.stringify({ ...data.staff, role: 'staff' }));
        navigate('/cashier');
      } else {
        localStorage.setItem('user', JSON.stringify({ ...data.vendor, role: 'vendor' }));
        navigate('/vendor');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectRole = (selectedRole, selectedAction = 'login') => {
    setRole(selectedRole);
    setAction(selectedAction);
    setPhase('form');
    setError('');
  };

  if (phase === 'select') {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '1rem' }}>FestFlow</h1>
          <p style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1.2rem' }}>Select your role to continue</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
          {/* Vendor Card */}
          <div className="card auth-card-portal" onClick={() => selectRole('vendor', 'signup')}>
            <div className="portal-icon"></div>
            <h2>Vendor</h2>
            <p>Own a stall? Join the fest, build your menu, and track your revenue.</p>
            <button className="btn btn-primary btn-block">Get Started</button>
          </div>

          {/* Staff Card */}
          <div className="card auth-card-portal" onClick={() => selectRole('staff', 'login')}>
            <div className="portal-icon"></div>
            <h2>Staff</h2>
            <p>Working at a stall? Log into your cashier account to record cash payments.</p>
            <button className="btn btn-outline btn-block">Staff Login</button>
          </div>

          {/* Admin Card */}
          <div className="card auth-card-portal" onClick={() => selectRole('admin', 'login')}>
            <div className="portal-icon"></div>
            <h2>Admin</h2>
            <p>Organizing the event? Manage applications, approve stalls, and view analytics.</p>
            <button className="btn btn-primary btn-block">System Access</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button 
          onClick={() => setPhase('select')}
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back
        </button>

        <h1 className="auth-title" style={{ color: 'var(--text-primary)', fontWeight: '900', fontSize: '2.5rem' }}>
          {role === 'vendor' && (action === 'signup' ? 'JOIN' : 'LOGIN')}
          {role === 'staff' && 'STAFF'}
          {role === 'admin' && (action === 'signup' ? 'REGISTER' : 'ADMIN')}
        </h1>
        <p className="auth-subtitle">
          {role === 'vendor' && (action === 'signup' ? 'Create your stall in seconds' : 'Manage your stall inventory')}
          {role === 'staff' && 'Record sales and manage orders'}
          {role === 'admin' && (action === 'signup' ? 'Create a new admin account' : 'Event management portal')}
        </p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
          {role === 'vendor' ? (
            <div className="form-group">
              <label className="form-label">Stall Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="The Brownie Boys"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                className="form-input"
                type="text"
                placeholder={role === 'staff' ? 'cashier123' : 'superadmin'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          {role === 'vendor' && action === 'signup' && (
            <div className="form-group">
              <label className="form-label">UPI ID</label>
              <input
                className="form-input"
                type="text"
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
              />
            </div>
          )}

          {role === 'admin' && action === 'signup' && (
             <div className="form-group">
              <label className="form-label">Invite Code (Optional)</label>
              <input
                className="form-input"
                type="text"
                placeholder="Enter code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
            {loading ? 'Processing...' : (action === 'signup' ? 'Create Account' : 'Login')}
          </button>
        </form>

        <div className="auth-nav-links" style={{ marginTop: '2rem', textAlign: 'center' }}>
          {role === 'vendor' && (
            <a href="#" className="auth-secondary-link" onClick={(e) => { e.preventDefault(); setAction(action === 'signup' ? 'login' : 'signup'); }}>
              {action === 'signup' ? 'Already have a stall? ' : 'Need a stall? '}
              <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{action === 'signup' ? 'Log in' : 'Sign up'}</span>
            </a>
          )}
          {role === 'admin' && (
            <a href="#" className="auth-secondary-link" onClick={(e) => { e.preventDefault(); setAction(action === 'signup' ? 'login' : 'signup'); }}>
              {action === 'signup' ? 'Already have an account? ' : 'Need an admin account? '}
              <span style={{ color: 'var(--text-primary)', fontWeight: '800' }}>{action === 'signup' ? 'Log in' : 'Sign up'}</span>
            </a>
          )}
          {role === 'staff' && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Staff accounts are created by stall owners in their dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
