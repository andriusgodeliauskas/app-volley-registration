import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="top-nav">
            <Link to="/dashboard" className="logo">
                <div className="logo-icon">🏐</div>
                <span>Volley App</span>
            </Link>
            <div className="nav-links">
                <Link to="/dashboard" className={`nav-link-custom ${isActive('/dashboard')}`}>Dashboard</Link>
                <Link to="/events" className={`nav-link-custom ${isActive('/events')}`}>All Events</Link>
                <Link to="/wallet" className={`nav-link-custom ${isActive('/wallet')}`}>Wallet</Link>
            </div>
            <div className="user-section">
                <div className="balance">
                    Balance: <span className="balance-amount">€{parseFloat(user?.balance || 0).toFixed(2)}</span>
                </div>
                <div className="dropdown">
                    <div className="user-menu" data-bs-toggle="dropdown">
                        <img
                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.avatar || 'Midnight'}`}
                            alt="Avatar"
                            className="user-avatar"
                        />
                        <span className="text-white ms-2">{user?.name}</span>
                        <span className="ms-1 text-white opacity-75">▼</span>
                    </div>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 p-2 mt-2">
                        <li><Link className="dropdown-item rounded-3" to="/profile">Profile</Link></li>
                        <li><Link className="dropdown-item rounded-3" to="/children">My Children</Link></li>
                        {(user?.role === 'super_admin' || user?.role === 'group_admin') && (
                            <>
                                <li><hr className="dropdown-divider" /></li>
                                <li><Link className="dropdown-item rounded-3" to="/admin">Admin Dashboard</Link></li>
                            </>
                        )}
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item rounded-3 text-danger" onClick={logout}>Logout</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Navbar;
