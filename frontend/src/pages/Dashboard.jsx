import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post, del } from '../api/config';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';

/**
 * UserDashboard Component
 * 
 * Displays:
 * - User's current balance (fetched fresh from API)
 * - List of upcoming events with registration functionality
 * - Registration status for each event
 */
function Dashboard() {
    const { user, logout, updateUser } = useAuth();
    const { t } = useLanguage();

    // State
    const [balance, setBalance] = useState(parseFloat(user?.balance || 0));
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventsLoading, setEventsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [registering, setRegistering] = useState({}); // Track loading state per event
    const [successMessage, setSuccessMessage] = useState('');

    /**
     * Fetch user's current balance from API
     */
    /**
     * Fetch user's current data from API
     */
    const fetchUserData = async () => {
        try {
            const response = await get(API_ENDPOINTS.USER);
            if (response.success && response.data?.user) {
                const userData = response.data.user;
                setBalance(parseFloat(userData.balance));
                // Update global user context to reflect changes (avatar, balance, etc)
                updateUser(userData);
            }
        } catch (err) {
            console.error('Failed to fetch user data:', err);
        }
    };

    /**
     * Fetch upcoming events from API
     */
    const fetchEvents = async () => {
        setEventsLoading(true);
        try {
            const response = await get(API_ENDPOINTS.EVENTS);
            if (response.success && response.data?.events) {
                setEvents(response.data.events);
            }
        } catch (err) {
            setError(t('dash.error_register'));
            console.error('Failed to fetch events:', err);
        } finally {
            setEventsLoading(false);
        }
    };

    /**
     * Initial data fetch - runs once on mount
     */
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchUserData(), fetchEvents()]);
            setLoading(false);
        };
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Handle event registration
     */
    /**
     * Handle event registration
     */
    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, eventId: null, eventTitle: null, price: null });

    /**
     * Initiate event registration (opens confirmation modal)
     */
    const handleRegister = (event) => {
        setConfirmModal({
            show: true,
            type: 'register',
            eventId: event.id,
            eventTitle: event.title,
            price: event.price_per_person
        });
    };

    /**
     * Initiate event cancellation (opens confirmation modal)
     */
    const handleCancelClick = (event) => {
        setConfirmModal({
            show: true,
            type: 'cancel',
            eventId: event.id,
            eventTitle: event.title,
            price: event.price_per_person
        });
    };

    /**
     * Process the action (register or cancel) after confirmation
     */
    const handleConfirmAction = async () => {
        const { type, eventId, eventTitle } = confirmModal;
        setConfirmModal({ show: false, type: null, eventId: null, eventTitle: null, price: null });

        setRegistering(prev => ({ ...prev, [eventId]: true }));
        setError(null);
        setSuccessMessage('');

        try {
            if (type === 'register') {
                const response = await post(API_ENDPOINTS.REGISTER_EVENT, { event_id: eventId });

                if (response.success) {
                    // Update balance from response
                    if (response.data?.new_balance !== undefined) {
                        setBalance(parseFloat(response.data.new_balance));
                        updateUser({
                            ...user,
                            balance: parseFloat(response.data.new_balance)
                        });
                    }

                    // Update event as registered
                    setEvents(prev => prev.map(event =>
                        event.id === eventId
                            ? {
                                ...event,
                                user_registered: true,
                                registered_count: event.registered_count + 1,
                                spots_available: event.spots_available - 1
                            }
                            : event
                    ));

                    setSuccessMessage(t('dash.registration_success'));
                    setTimeout(() => setSuccessMessage(''), 5000);
                }
            } else if (type === 'cancel') {
                const response = await del(`${API_ENDPOINTS.REGISTER_EVENT}?event_id=${eventId}`);

                if (response.success) {
                    // Update balance from response
                    if (response.data?.new_balance !== undefined) {
                        setBalance(parseFloat(response.data.new_balance));
                        updateUser({
                            ...user,
                            balance: parseFloat(response.data.new_balance)
                        });
                    }

                    // Update event as not registered
                    setEvents(prev => prev.map(event =>
                        event.id === eventId
                            ? {
                                ...event,
                                user_registered: false,
                                registered_count: event.registered_count - 1,
                                spots_available: event.spots_available + 1
                            }
                            : event
                    ));

                    setSuccessMessage(t('dash.cancellation_success', { amount: response.data?.refunded_amount?.toFixed(2) || '0.00' }));
                    setTimeout(() => setSuccessMessage(''), 5000);
                }
            }
        } catch (err) {
            setError(err.message || (type === 'register' ? t('dash.error_register') : t('dash.error_cancel')));
        } finally {
            setRegistering(prev => ({ ...prev, [eventId]: false }));
        }
    };

    /**
     * Format date for display
     */
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    };

    /**
     * Format time for display
     */
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    /**
     * Check if user can afford the event
     */
    const canAfford = (price) => balance >= parseFloat(price);

    return (
        <div className="min-vh-100">
            {/* Header Navigation */}
            <Navbar />

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow border-0 rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">
                                    {confirmModal.type === 'register' ? t('event.confirm_register_title') : t('event.confirm_cancel_title')}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setConfirmModal({ show: false })}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">{t('event.confirm_action', { action: confirmModal.type === 'register' ? t('event.action_register') : t('event.action_cancel'), title: confirmModal.eventTitle }).replace('{action}', confirmModal.type === 'register' ? t('event.action_register') : t('event.action_cancel')).replace('{title}', confirmModal.eventTitle)}</p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn-custom" onClick={() => setConfirmModal({ show: false })}>{t('common.no')}</button>
                                <button type="button" className={`btn-custom ${confirmModal.type === 'register' ? 'btn-custom text-white bg-primary border-primary' : 'btn-danger-custom text-white bg-danger border-danger'} px-4`} onClick={handleConfirmAction}>{t('common.yes')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.home'), path: '/dashboard' }
                ]} />

                {/* Apps Alerts */}
                {error && (
                    <div className="alert-custom mb-4 bg-danger bg-opacity-10 border-danger text-danger">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error} <button type="button" className="btn-close ms-2" onClick={() => setError(null)}></button></div>
                    </div>
                )}
                {successMessage && (
                    <div className="alert-custom mb-4 bg-success bg-opacity-10 border-success text-success">
                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                        <div>{successMessage}</div>
                    </div>
                )}

                {/* Welcome Section */}
                <div className="welcome">
                    <h1>{t('dash.welcome')}, {user?.name?.split(' ')[0]}! 👋</h1>
                </div>

                {/* Upcoming Events */}
                <div className="section">
                    {/* Mobile: Stacked layout */}
                    <div className="d-md-none">
                        <div className="text-center w-100 mb-3">
                            <div className="section-title">📅 {t('dash.upcoming')}</div>
                            <div className="section-subtitle">{t('event.browse_register')}</div>
                        </div>
                        <div className="d-flex justify-content-center mb-3">
                            <button
                                className="btn-custom"
                                onClick={() => { fetchEvents(); fetchUserData(); }}
                                disabled={eventsLoading}
                            >
                                {eventsLoading ? t('common.loading') : '🔄 ' + t('common.refresh')}
                            </button>
                        </div>
                    </div>

                    {/* Desktop: Single line layout */}
                    <div className="section-header d-none d-md-flex">
                        <div className="text-center w-100">
                            <div className="section-title">📅 {t('dash.upcoming')}</div>
                            <div className="section-subtitle">{t('event.browse_register')}</div>
                        </div>
                        <button
                            className="btn-custom"
                            onClick={() => { fetchEvents(); fetchUserData(); }}
                            disabled={eventsLoading}
                        >
                            {eventsLoading ? t('common.loading') : '🔄 ' + t('common.refresh')}
                        </button>
                    </div>

                    {loading ? (
                        <div className="text-center py-5 text-muted">{t('common.loading')}</div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-5 text-muted">{t('dash.no_events')}</div>
                    ) : (
                        events.map(event => {
                            const isRegistered = event.user_registered;
                            const isFull = event.spots_available <= 0;
                            const isProcessing = registering[event.id];

                            return (
                                <div key={event.id} className="event-card">
                                    <div className="event-icon">
                                        {event.icon || '🏐'}
                                    </div>
                                    <div className="event-info">
                                        <div className="event-title">
                                            {event.title}
                                            {isRegistered && <span className="event-badge">✓ {t('dash.registered')}</span>}
                                        </div>
                                        <div className="event-details">
                                            <div className="event-detail">📍 {event.location}</div>
                                            <div className="event-detail">📅 {formatDate(event.date_time)}, {formatTime(event.date_time)}</div>
                                            <div className="event-detail">
                                                👥 {event.spots_available > 0 ? `${event.spots_available} ${t('dash.spots_left')}` : t('dash.full')}
                                            </div>
                                            <div className="event-detail">🏐 {event.group_name}</div>
                                            <div className="event-detail">💰 €{parseFloat(event.price_per_person).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="event-actions">
                                        <Link to={`/event/${event.id}`} className="btn-custom">{t('dash.more_info')}</Link>
                                        {isRegistered ? (
                                            <button
                                                className="btn-custom btn-danger-custom"
                                                onClick={() => handleCancelClick(event)}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? t('common.loading') : t('event.cancel_btn')}
                                            </button>
                                        ) : (
                                            <button
                                                className={`btn-custom ${isFull ? '' : 'text-primary border-primary'}`}
                                                style={!isFull ? { background: '#eff6ff' } : {}}
                                                onClick={() => handleRegister(event)}
                                                disabled={isProcessing}
                                            >
                                                {isProcessing ? t('common.loading') : (isFull ? t('event.waitlist') : t('event.register_btn'))}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Dashboard Cards */}
                <div className="dashboard-cards">
                    <div className="dash-card card-wallet">
                        <div className="dash-card-header">
                            <div className="dash-card-title">{t('dash.balance_card')}</div>
                            <div className="dash-card-icon">💰</div>
                        </div>
                        <div className="dash-card-value">€{balance.toFixed(2)}</div>
                        <div className="dash-card-subtitle">{t('wallet.available')}</div>
                        <Link to="/wallet" className="card-action">{t('dash.top_up')}</Link>
                    </div>

                    <div className="dash-card card-registrations">
                        <div className="dash-card-header">
                            <div className="dash-card-title">{t('dash.my_registrations')}</div>
                            <div className="dash-card-icon">✅</div>
                        </div>
                        <div className="dash-card-value">{events.filter(e => e.user_registered).length}</div>
                        <div className="dash-card-subtitle">{t('dash.upcoming')}</div>
                        {events.filter(e => e.user_registered).length > 0 ? (
                            <Link to={`/event/${events.find(e => e.user_registered).id}`} className="card-action">{t('common.view')}</Link>
                        ) : (
                            <button className="card-action opacity-50" disabled>{t('common.view')}</button>
                        )}
                    </div>

                    <div className="dash-card card-available">
                        <div className="dash-card-header">
                            <div className="dash-card-title">{t('dash.latest_events')}</div>
                            <div className="dash-card-icon">🎯</div>
                        </div>
                        <div className="dash-card-value">{events.filter(e => !e.user_registered && e.spots_available > 0).length}</div>
                        <div className="dash-card-subtitle">{t('dash.find_events')}</div>
                        <Link to="/events" className="card-action">{t('common.view')}</Link>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2 className="quick-actions-title">{t('admin.quick_actions')}</h2>
                    <div className="action-buttons">
                        <Link to="/events" className="action-btn">📅 {t('dash.view_all')}</Link>
                        <Link to="/wallet" className="action-btn">💳 {t('wallet.topup_title')}</Link>
                        {/* <Link to="/children" className="action-btn">👨‍👩‍👧‍👦 {t('children.title')}</Link> */}
                    </div>
                </div>

                {/* Low Balance Alert */}
                {balance < 5 && (
                    <div className="alert-custom">
                        <div className="alert-custom-icon">⚠️</div>
                        <div>
                            {t('dash.insufficient_balance')} {t('wallet.available')}: €{balance.toFixed(2)}. <Link to="/wallet">{t('dash.top_up')}</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Dashboard;
