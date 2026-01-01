import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <div className="top-nav">
            <Link to="/dashboard" className="logo">
                <div className="logo-icon">🏐</div>
                <span>Volley App</span>
            </Link>
            <div className="nav-links">
                <Link to="/dashboard" className={`nav-link-custom ${isActive('/dashboard')}`}>{t('nav.dashboard')}</Link>
                <Link to="/events" className={`nav-link-custom ${isActive('/events')}`}>{t('nav.all_events')}</Link>
                <Link to="/wallet" className={`nav-link-custom ${isActive('/wallet')}`}>{t('nav.wallet')}</Link>
            </div>
            <div className="user-section">
                <div className="balance">
                    {t('nav.balance')}: <span className="balance-amount">€{parseFloat(user?.balance || 0).toFixed(2)}</span>
                </div>

                <LanguageSwitcher />

                <div className="dropdown ms-3">
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
                        <li><Link className="dropdown-item rounded-3" to="/profile">{t('nav.profile')}</Link></li>
                        <li><Link className="dropdown-item rounded-3" to="/children">{t('nav.children')}</Link></li>
                        {(user?.role === 'super_admin' || user?.role === 'group_admin') && (
                            <>
                                <li><hr className="dropdown-divider" /></li>
                                <li><Link className="dropdown-item rounded-3" to="/admin">{t('nav.admin_dashboard')}</Link></li>
                            </>
                        )}
                        <li><hr className="dropdown-divider" /></li>
                        <li><button className="dropdown-item rounded-3 text-danger" onClick={logout}>{t('nav.logout')}</button></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Navbar;
