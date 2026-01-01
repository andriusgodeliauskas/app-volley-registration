import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AdminNavbar() {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`) ? 'active' : '';

    return (
        <div className="top-nav">
            <Link to="/admin" className="logo">
                <div className="logo-icon bg-warning text-dark">⚡</div>
                <span>Volley Admin</span>
            </Link>
            <div className="nav-links">
                <Link to="/admin" className={`nav-link-custom ${location.pathname === '/admin' ? 'active' : ''}`}>Dashboard</Link>
                <Link to="/admin/users" className={`nav-link-custom ${isActive('/admin/users')}`}>Users</Link>
                <Link to="/admin/groups" className={`nav-link-custom ${isActive('/admin/groups')}`}>Groups</Link>
                <Link to="/admin/events" className={`nav-link-custom ${isActive('/admin/events')}`}>Events</Link>
                <Link to="/admin/topups" className={`nav-link-custom ${isActive('/admin/topups')}`}>Top Ups</Link>
                <Link to="/admin/wallet" className={`nav-link-custom ${isActive('/admin/wallet')}`}>Wallet</Link>
            </div>
            <div className="user-section">
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
                        <li><Link className="dropdown-item rounded-3" to="/dashboard">User View</Link></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item rounded-3 text-danger" onClick={logout}>Logout</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminNavbar;
