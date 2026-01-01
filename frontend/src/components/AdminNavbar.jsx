import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function AdminNavbar() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`) ? 'active' : '';

    return (
        <div className="top-nav">
            <Link to="/admin" className="logo">
                <div className="logo-icon bg-warning text-dark">⚡</div>
                <span>{t('admin.app_title')}</span>
            </Link>
            <div className="nav-links">
                <Link to="/admin" className={`nav-link-custom ${location.pathname === '/admin' ? 'active' : ''}`}>{t('admin.nav_dashboard')}</Link>
                <Link to="/admin/users" className={`nav-link-custom ${isActive('/admin/users')}`}>{t('admin.nav_users')}</Link>
                <Link to="/admin/groups" className={`nav-link-custom ${isActive('/admin/groups')}`}>{t('admin.nav_groups')}</Link>
                <Link to="/admin/events" className={`nav-link-custom ${isActive('/admin/events')}`}>{t('admin.nav_events')}</Link>
                {user?.role === 'super_admin' && (
                    <Link to="/admin/rent" className={`nav-link-custom ${isActive('/admin/rent')}`}>{t('admin.nav_rent')}</Link>
                )}
                <Link to="/admin/topups" className={`nav-link-custom ${isActive('/admin/topups')}`}>{t('admin.nav_topups')}</Link>
                <Link to="/admin/wallet" className={`nav-link-custom ${isActive('/admin/wallet')}`}>{t('admin.nav_wallet')}</Link>
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
                        <li><Link className="dropdown-item rounded-3" to="/dashboard">{t('admin.user_view')}</Link></li>
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item rounded-3 text-danger" onClick={logout}>{t('admin.logout')}</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminNavbar;
