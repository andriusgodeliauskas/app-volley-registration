import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';

function Navbar() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isActive = (path) => location.pathname === path ? 'active' : '';

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };

    return (
        <div className="top-nav">
            <Link to="/dashboard" className="logo">
                <div className="logo-icon">🏐</div>
                <span className="logo-text">AG VOLLEY</span>
            </Link>

            <div className="nav-links">
                <Link to="/dashboard" className={`nav-link-custom ${isActive('/dashboard')}`}>{t('nav.dashboard')}</Link>
                <Link to="/events" className={`nav-link-custom ${isActive('/events')}`}>{t('nav.all_events')}</Link>
                <Link to="/wallet" className={`nav-link-custom ${isActive('/wallet')}`}>{t('nav.wallet')}</Link>
                <Link to="/deposit" className={`nav-link-custom ${isActive('/deposit')}`}>{t('nav.deposit')}</Link>
                <Link to="/support" className={`nav-link-custom ${isActive('/support')}`}>{t('nav.support')}</Link>
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
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 p-1 mt-2" style={{ minWidth: '200px' }}>
                        <li><Link className="dropdown-item rounded-2 py-2" to="/profile"><i className="bi bi-person me-2"></i>{t('nav.profile')}</Link></li>
                        {/* <li><Link className="dropdown-item rounded-2 py-2" to="/children">{t('nav.children')}</Link></li> */}
                        {(user?.role === 'super_admin' || user?.role === 'group_admin') && (
                            <>
                                <li><hr className="dropdown-divider my-1" /></li>
                                <li><Link className="dropdown-item rounded-2 py-2" to="/admin"><i className="bi bi-gear me-2"></i>{t('nav.admin_dashboard')}</Link></li>
                            </>
                        )}
                        <li><hr className="dropdown-divider my-1" /></li>
                        <li><button className="dropdown-item rounded-2 py-2 text-danger" onClick={logout}><i className="bi bi-box-arrow-right me-2"></i>{t('nav.logout')}</button></li>
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
                                <div className="mobile-user-balance">
                                    {t('nav.balance')}: <span className="balance-amount">€{parseFloat(user?.balance || 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Language Switcher */}
                        <div className="mobile-menu-section">
                            <LanguageSwitcher />
                        </div>

                        {/* Navigation Links */}
                        <div className="mobile-menu-section">
                            <Link
                                to="/dashboard"
                                className={`mobile-menu-link ${isActive('/dashboard')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('nav.dashboard')}
                            </Link>
                            <Link
                                to="/events"
                                className={`mobile-menu-link ${isActive('/events')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('nav.all_events')}
                            </Link>
                            <Link
                                to="/wallet"
                                className={`mobile-menu-link ${isActive('/wallet')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('nav.wallet')}
                            </Link>
                            <Link
                                to="/support"
                                className={`mobile-menu-link ${isActive('/support')}`}
                                onClick={closeMobileMenu}
                            >
                                {t('nav.support')}
                            </Link>
                        </div>

                        {/* User Menu */}
                        <div className="mobile-menu-section">
                            <Link
                                to="/profile"
                                className="mobile-menu-link"
                                onClick={closeMobileMenu}
                            >
                                {t('nav.profile')}
                            </Link>
                            {/* <Link
                                to="/children"
                                className="mobile-menu-link"
                                onClick={closeMobileMenu}
                            >
                                {t('nav.children')}
                            </Link> */}
                            {(user?.role === 'super_admin' || user?.role === 'group_admin') && (
                                <Link
                                    to="/admin"
                                    className="mobile-menu-link"
                                    onClick={closeMobileMenu}
                                >
                                    {t('nav.admin_dashboard')}
                                </Link>
                            )}
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
                                {t('nav.logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Navbar;
