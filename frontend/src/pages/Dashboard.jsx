import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post, del } from '../api/config';

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
    const fetchBalance = async () => {
        try {
            const response = await get(API_ENDPOINTS.USER);
            if (response.success && response.data?.user) {
                const freshBalance = parseFloat(response.data.user.balance);
                setBalance(freshBalance);
            }
        } catch (err) {
            console.error('Failed to fetch balance:', err);
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
            setError('Failed to load events. Please try again.');
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
            await Promise.all([fetchBalance(), fetchEvents()]);
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

                    setSuccessMessage(`Successfully registered for "${eventTitle}"!`);
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

                    setSuccessMessage(`Registration cancelled. Refund of €${response.data?.refunded_amount?.toFixed(2) || '0.00'} processed.`);
                    setTimeout(() => setSuccessMessage(''), 5000);
                }
            }
        } catch (err) {
            setError(err.message || `Failed to ${type}. Please try again.`);
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
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/dashboard">🏐 Volley App</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item"><Link className="nav-link active" to="/dashboard">Dashboard</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/events">All Events</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/wallet">Wallet</Link></li>
                        </ul>
                        <div className="d-flex align-items-center">
                            <span className="text-white me-3">
                                <small className="opacity-75">Balance:</small>{' '}
                                <span className={`fw-semibold ${balance < 5 ? 'text-warning' : ''}`}>
                                    €{balance.toFixed(2)}
                                </span>
                            </span>
                            <div className="dropdown">
                                <button className="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                    {user?.name}
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><Link className="dropdown-item" to="/profile">Profile</Link></li>
                                    <li><Link className="dropdown-item" to="/children">My Children</Link></li>
                                    {(user?.role === 'super_admin' || user?.role === 'group_admin') && (
                                        <>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><Link className="dropdown-item" to="/admin">Admin Dashboard</Link></li>
                                        </>
                                    )}
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={logout}>Logout</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">
                                    {confirmModal.type === 'register' ? 'Confirm Registration' : 'Confirm Cancellation'}
                                </h5>
                                <button type="button" className="btn-close" onClick={() => setConfirmModal({ show: false })}></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-0">Are you sure you want to {confirmModal.type === 'register' ? 'register for' : 'cancel your registration for'} <br /><strong>{confirmModal.eventTitle}</strong>?</p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button type="button" className="btn btn-light" onClick={() => setConfirmModal({ show: false })}>No</button>
                                <button type="button" className={`btn ${confirmModal.type === 'register' ? 'btn-primary' : 'btn-danger'} px-4`} onClick={handleConfirmAction}>Yes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="container py-4">
                {/* Welcome Section */}
                <div className="row mb-4">
                    <div className="col">
                        <h1 className="h3 mb-1">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                        <p className="text-muted mb-0">Browse upcoming events and register in one click.</p>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                {successMessage && (
                    <div className="alert alert-success alert-dismissible fade show" role="alert">
                        <i className="bi bi-check-circle-fill me-2"></i>
                        {successMessage}
                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                    </div>
                )}



                {/* Upcoming Events Section */}
                <div className="card border-0 shadow-sm mb-4">
                    <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">📅 Upcoming Events</h5>
                            <small className="text-muted">Register for volleyball games near you</small>
                        </div>
                        <button
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => { fetchEvents(); fetchBalance(); }}
                            disabled={eventsLoading}
                        >
                            {eventsLoading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-1"></span>
                                    Loading...
                                </>
                            ) : (
                                <>🔄 Refresh</>
                            )}
                        </button>
                    </div>
                    <div className="card-body p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="text-muted mt-2">Loading events...</p>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-5">
                                <span className="display-1">📭</span>
                                <h5 className="mt-3">No upcoming events</h5>
                                <p className="text-muted">Check back later for new volleyball games!</p>
                            </div>
                        ) : (
                            <div className="list-group list-group-flush">
                                {events.map(event => {
                                    const isRegistered = event.user_registered;
                                    const isFull = event.spots_available <= 0;
                                    const affordable = canAfford(event.price_per_person);
                                    const isProcessing = registering[event.id];

                                    return (
                                        <div key={event.id} className="list-group-item px-4 py-3">
                                            <div className="row align-items-center">
                                                {/* Date/Time Column */}
                                                <div className="col-md-2 text-center mb-3 mb-md-0">
                                                    <div className="bg-primary bg-opacity-10 rounded-3 p-2">
                                                        <div className="text-primary fw-bold">{formatDate(event.date_time)}</div>
                                                        <div className="text-muted small">{formatTime(event.date_time)}</div>
                                                    </div>
                                                </div>

                                                {/* Event Details Column */}
                                                <div className="col-md-7 mb-3 mb-md-0">
                                                    <h6 className="mb-1 fw-semibold">
                                                        {event.title}
                                                        {isRegistered && (
                                                            <span className="badge bg-success ms-2">✓ Registered</span>
                                                        )}
                                                    </h6>
                                                    <p className="mb-1 text-muted small">
                                                        <i className="bi bi-geo-alt me-1"></i>{event.location}
                                                    </p>
                                                    <p className="mb-0 text-muted small">
                                                        <i className="bi bi-people me-1"></i>
                                                        <span className={event.spots_available <= 2 && event.spots_available > 0 ? 'text-warning fw-semibold' : ''}>
                                                            {event.spots_available > 0
                                                                ? `${event.spots_available} spots left`
                                                                : 'Full'}
                                                        </span>
                                                        <span className="mx-2">•</span>
                                                        {event.group_name}
                                                        <span className="mx-2">•</span>
                                                        <i className="bi bi-tag me-1"></i>
                                                        €{parseFloat(event.price_per_person).toFixed(2)}
                                                    </p>
                                                </div>



                                                {/* Action Column */}
                                                <div className="col-md-3 text-end">
                                                    <div className="d-flex flex-column gap-2 alig-items-end">
                                                        <Link
                                                            to={`/event/${event.id}`}
                                                            className="btn btn-outline-secondary btn-sm"
                                                        >
                                                            More info
                                                        </Link>
                                                        {isRegistered ? (
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => handleCancelClick(event)}
                                                                disabled={isProcessing}
                                                            >
                                                                {isProcessing ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                                        Cancelling...
                                                                    </>
                                                                ) : (
                                                                    <>Cancel Registration</>
                                                                )}
                                                            </button>
                                                        ) : (
                                                            <button
                                                                className={`btn ${isFull ? 'btn-warning' : 'btn-primary'} btn-sm`}
                                                                onClick={() => handleRegister(event)}
                                                                disabled={isProcessing}
                                                            >
                                                                {isProcessing ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-1"></span>
                                                                        {isFull ? 'Joining...' : 'Registering...'}
                                                                    </>
                                                                ) : (
                                                                    <>{isFull ? 'Join Waitlist' : 'Register Now'}</>
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <div className="card-body text-white">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="opacity-75 mb-1 text-uppercase small">Wallet Balance</h6>
                                        <h2 className="mb-0 fw-bold">€{balance.toFixed(2)}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 rounded-circle p-2">
                                        <span className="fs-4">💰</span>
                                    </div>
                                </div>
                                <Link to="/wallet" className="btn btn-light btn-sm mt-3">Top Up</Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
                            <div className="card-body text-white">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="opacity-75 mb-1 text-uppercase small">My Registrations</h6>
                                        <h2 className="mb-0 fw-bold">{events.filter(e => e.user_registered).length}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 rounded-circle p-2">
                                        <span className="fs-4">✅</span>
                                    </div>
                                </div>
                                <small className="opacity-75 d-block mb-3">Upcoming events you're registered for</small>
                                {events.filter(e => e.user_registered).length > 0 ? (
                                    <Link to={`/event/${events.find(e => e.user_registered).id}`} className="btn btn-light btn-sm">More</Link>
                                ) : (
                                    <button className="btn btn-light btn-sm" disabled>More</button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <div className="card-body text-white">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="opacity-75 mb-1 text-uppercase small">Available Events</h6>
                                        <h2 className="mb-0 fw-bold">{events.filter(e => !e.user_registered && e.spots_available > 0).length}</h2>
                                    </div>
                                    <div className="bg-white bg-opacity-25 rounded-circle p-2">
                                        <span className="fs-4">🏐</span>
                                    </div>
                                </div>
                                <small className="opacity-75 d-block mb-3">Events with open spots</small>
                                <Link to="/events" className="btn btn-light btn-sm">More</Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card border-0 shadow-sm mt-4">
                    <div className="card-header bg-white border-0 py-3">
                        <h5 className="mb-0">⚡ Quick Actions</h5>
                    </div>
                    <div className="card-body">
                        <div className="d-flex gap-2 flex-wrap">
                            <Link to="/events" className="btn btn-outline-primary">
                                <i className="bi bi-calendar-event me-1"></i>View All Events
                            </Link>
                            <Link to="/wallet" className="btn btn-outline-success">
                                <i className="bi bi-wallet2 me-1"></i>Top Up Wallet
                            </Link>
                            <Link to="/children" className="btn btn-outline-secondary">
                                <i className="bi bi-people me-1"></i>Manage Family
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Low Balance Warning */}
                {balance < 5 && (
                    <div className="alert alert-warning d-flex align-items-center mt-4" role="alert">
                        <i className="bi bi-wallet2 me-2 fs-5"></i>
                        <div className="flex-grow-1">
                            <strong>Low balance!</strong> You have €{balance.toFixed(2)} remaining.
                            <Link to="/wallet" className="alert-link ms-1">Top up now</Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-top py-3 mt-auto">
                <div className="container text-center text-muted small">
                    © 2025 Volley App. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

export default Dashboard;
