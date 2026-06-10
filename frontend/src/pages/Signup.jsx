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

  return (
    <div className="split-layout">
      {/* Left side: Brand / High Contrast Solid Area */}
      <div className="split-left">
        <div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1.5rem', color: 'white' }}>FestFlow</h1>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.8)', fontWeight: 500, maxWidth: '400px', lineHeight: 1.5 }}>
            The all-in-one platform for campus festivals. Build your menu, track your revenue, and manage your staff effortlessly.
          </p>
        </div>
      </div>

      {/* Right side: Actions & Forms */}
      <div className="split-right">
        <div style={{ width: '100%', maxWidth: '480px' }}>
          
          {phase === 'select' ? (
            <div>
              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>Welcome to FestFlow</h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Select your account type to get started.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="role-card-solid" onClick={() => selectRole('vendor', 'signup')}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Vendor</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Own a stall? Track revenue and manage menus.</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', color: 'var(--border-hover)' }}>→</div>
                </div>

                <div className="role-card-solid" onClick={() => selectRole('staff', 'login')}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Staff Cashier</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Log into your cashier account for point-of-sale.</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', color: 'var(--border-hover)' }}>→</div>
                </div>

                <div className="role-card-solid" onClick={() => selectRole('admin', 'login')}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>Organizer</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Manage the entire festival and approve stalls.</p>
                  </div>
                  <div style={{ fontSize: '1.5rem', color: 'var(--border-hover)' }}>→</div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <button 
                onClick={() => setPhase('select')}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                ← Back
              </button>

              <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {role === 'vendor' && (action === 'signup' ? 'Create a Stall' : 'Vendor Login')}
                {role === 'staff' && 'Staff Login'}
                {role === 'admin' && (action === 'signup' ? 'Register Admin' : 'Admin Portal')}
              </h2>
              <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                {role === 'vendor' && (action === 'signup' ? 'Setup your stall profile in seconds' : 'Manage your stall inventory')}
                {role === 'staff' && 'Record sales and manage orders'}
                {role === 'admin' && (action === 'signup' ? 'Create a new admin account' : 'Event management portal')}
              </p>

              {error && <div className="error-msg" style={{ borderRadius: 'var(--radius-sm)' }}>{error}</div>}

              <form onSubmit={handleSubmit}>
                {role === 'vendor' ? (
                  <div className="form-group">
                    <label className="form-label">Stall Name</label>
                    <input
                      className="form-input"
                      type="text"
                      placeholder="e.g. The Brownie Boys"
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

                <div className="form-group" style={{ marginBottom: '2.5rem' }}>
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

                <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading} style={{ padding: '0.85rem' }}>
                  {loading ? 'Processing...' : (action === 'signup' ? 'Create Account' : 'Login')}
                </button>
              </form>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                {role === 'vendor' && (
                  <a href="#" className="auth-secondary-link" onClick={(e) => { e.preventDefault(); setAction(action === 'signup' ? 'login' : 'signup'); }}>
                    {action === 'signup' ? 'Already have a stall? ' : 'Need a stall? '}
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{action === 'signup' ? 'Log in' : 'Sign up'}</span>
                  </a>
                )}
                {role === 'admin' && (
                  <a href="#" className="auth-secondary-link" onClick={(e) => { e.preventDefault(); setAction(action === 'signup' ? 'login' : 'signup'); }}>
                    {action === 'signup' ? 'Already have an account? ' : 'Need an admin account? '}
                    <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{action === 'signup' ? 'Log in' : 'Sign up'}</span>
                  </a>
                )}
                {role === 'staff' && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Staff accounts are created by stall owners in their dashboard.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
