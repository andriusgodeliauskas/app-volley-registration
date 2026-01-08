import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function AdminNavbar() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(`${path}/`) ? 'active' : '';

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="top-nav">
            <Link to="/admin" className="logo">
                <div className="logo-icon bg-warning text-dark">⚡</div>
                <span className="logo-text">{t('admin.app_title')}</span>
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
                {user?.role === 'super_admin' && (
                    <>
                        <Link to="/admin/deposits" className={`nav-link-custom ${isActive('/admin/deposits')}`}>{t('admin.nav_deposits')}</Link>
                        <Link to="/admin/donations" className={`nav-link-custom ${isActive('/admin/donations')}`}>{t('admin.nav_donations')}</Link>
                    </>
                )}
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

            {/* Mobile Menu Button */}
            <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle menu">
                {mobileMenuOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                )}
            </button>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={closeMobileMenu}>
                    <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        {/* User Info Section */}
                        <div className="mobile-menu-user">
                            <img
                                src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.avatar || 'Midnight'}`}
                                alt="Avatar"
                                className="mobile-user-avatar"
                            />
                            <div className="mobile-user-info">
                                <div className="mobile-user-name">{user?.name}</div>
                                <div className="mobile-user-balance text-white-50">{t('admin.role')}: {user?.role}</div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="mobile-menu-section">
                            <Link
                                to="/admin"
                                className={`mobile-menu-link ${location.pathname === '/admin' ? 'active' : ''}`}
                                onClick={closeMobileMenu}
                            >
                                {t('admin.nav_dashboard')}
                            </Link>
                            <Link
                                to="/admin/users"
                                className={`mobile-menu-link ${isActive('/admin/users')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('admin.nav_users')}
                            </Link>
                            <Link
                                to="/admin/groups"
                                className={`mobile-menu-link ${isActive('/admin/groups')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('admin.nav_groups')}
                            </Link>
                            <Link
                                to="/admin/events"
                                className={`mobile-menu-link ${isActive('/admin/events')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('admin.nav_events')}
                            </Link>
                            {user?.role === 'super_admin' && (
                                <Link
                                    to="/admin/rent"
                                    className={`mobile-menu-link ${isActive('/admin/rent')}`}
                                    onClick={closeMobileMenu}
                                >
                                    {t('admin.nav_rent')}
                                </Link>
                            )}
                            <Link
                                to="/admin/topups"
                                className={`mobile-menu-link ${isActive('/admin/topups')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('admin.nav_topups')}
                            </Link>
                            {user?.role === 'super_admin' && (
                                <>
                                    <Link
                                        to="/admin/deposits"
                                        className={`mobile-menu-link ${isActive('/admin/deposits')}`}
                                        onClick={closeMobileMenu}
                                    >
                                        {t('admin.nav_deposits')}
                                    </Link>
                                    <Link
                                        to="/admin/donations"
                                        className={`mobile-menu-link ${isActive('/admin/donations')}`}
                                        onClick={closeMobileMenu}
                                    >
                                        {t('admin.nav_donations')}
                                    </Link>
                                </>
                            )}
                            <Link
                                to="/admin/wallet"
                                className={`mobile-menu-link ${isActive('/admin/wallet')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('admin.nav_wallet')}
                            </Link>
                        </div>

                        {/* User Menu */}
                        <div className="mobile-menu-section">
                            <Link
                                to="/dashboard"
                                className="mobile-menu-link"
                                onClick={closeMobileMenu}
                            >
                                {t('admin.user_view')}
                            </Link>
                        </div>

                        {/* Logout Button */}
                        <div className="mobile-menu-section">
                            <button
                                className="mobile-menu-link mobile-menu-logout"
                                onClick={() => {
                                    closeMobileMenu();
                                    logout();
                                }}
                            >
                                {t('admin.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminNavbar;
