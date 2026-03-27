import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const navigate = useNavigate();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signup');
  };

  if (!user) return null;

  const isApproved = user.approvalStatus === 'approved';
  const role = user.role;

  return (
    <nav className="navbar">
      <Link to={role === 'admin' ? '/super-admin' : (role === 'staff' ? '/cashier' : '/vendor')} className="navbar-brand">
        <span className="brand-icon"></span> FestFlow
      </Link>

      <div className="navbar-links">
        {role === 'vendor' && (
          <>
            <Link to="/vendor" className="nav-link">
              Dashboard
            </Link>
            {isApproved && (
              <>
                <Link to="/vendor/pos" className="nav-link">
                  POS
                </Link>
                <Link to="/vendor/history" className="nav-link">
                  History
                </Link>
              </>
            )}
          </>
        )}
        {role === 'staff' && (
          <Link to="/cashier" className="nav-link">
            Cashier POS
          </Link>
        )}
        {role === 'admin' && (
          <Link to="/super-admin" className="nav-link">
            Admin Panel
          </Link>
        )}
        <button className="nav-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
