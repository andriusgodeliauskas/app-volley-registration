import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post, del } from '../api/config';

function EventDetails() {
    const { id } = useParams();
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const fetchDetails = async () => {
        setLoading(true);
        try {
            // Pass user_id to check registration status
            const userId = user?.id || 0;
            const response = await get(`${API_ENDPOINTS.EVENT_DETAILS}?event_id=${id}&user_id=${userId}`);
            if (response.success) {
                setData(response.data);
            } else {
                setError(response.message || 'Failed to load event details');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('An error occurred while loading data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id && user) {
            fetchDetails();
        }
    }, [id, user]);

    const [confirmModal, setConfirmModal] = useState({ show: false, type: null, eventId: null, eventTitle: null, price: null });

    const openRegisterModal = () => {
        setConfirmModal({
            show: true,
            type: 'register',
            eventId: id,
            eventTitle: data.event.title,
            price: data.event.price_per_person
        });
    };

    const openCancelModal = () => {
        setConfirmModal({
            show: true,
            type: 'cancel',
            eventId: id,
            eventTitle: data.event.title,
            price: data.event.price_per_person
        });
    };

    const handleConfirmAction = async () => {
        const { type } = confirmModal;
        setConfirmModal({ show: false, type: null, eventId: null, eventTitle: null, price: null });

        setProcessing(true);
        setError(null);
        setSuccessMessage('');

        try {
            if (type === 'register') {
                const response = await post(API_ENDPOINTS.REGISTER_EVENT, { event_id: id });

                if (response.success) {
                    // Update balance if returned
                    if (response.data?.new_balance !== undefined) {
                        updateUser({ ...user, balance: parseFloat(response.data.new_balance) });
                    }

                    setSuccessMessage('Successfully registered!');
                    fetchDetails(); // Reload data
                } else {
                    setError(response.message || 'Failed to register.');
                }
            } else if (type === 'cancel') {
                const response = await del(`${API_ENDPOINTS.REGISTER_EVENT}?event_id=${id}`);

                if (response.success) {
                    // Update balance if returned
                    if (response.data?.new_balance !== undefined) {
                        updateUser({ ...user, balance: parseFloat(response.data.new_balance) });
                    }

                    setSuccessMessage('Registration cancelled.');
                    fetchDetails(); // Reload data
                } else {
                    setError(response.message || 'Failed to cancel registration.');
                }
            }
        } catch (err) {
            setError(err.message || `Failed to ${type}.`);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="min-vh-100 bg-light p-4">
                <div className="container">
                    <div className="alert alert-danger">
                        {error}
                        <div className="mt-2">
                            <Link to="/dashboard" className="btn btn-sm btn-outline-danger">Back to Dashboard</Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { event, attendees } = data;
    const spotsLeft = event.max_players - event.registered_count;
    const isFull = spotsLeft <= 0;
    const isRegistered = event.user_registered;

    // Dates
    const eventDate = new Date(event.date_time);
    const dateStr = eventDate.toISOString().split('T')[0];
    const timeStr = eventDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/dashboard">🏐 Volley App</Link>
                    <div className="ms-auto">
                        <Link to="/dashboard" className="btn btn-outline-light btn-sm">
                            <i className="bi bi-arrow-left me-1"></i>Back
                        </Link>
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

            <div className="container pb-5">
                {/* Alerts allow displaying temporary success/error messages inside the page */}
                {successMessage && (
                    <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
                        {successMessage}
                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                    </div>
                )}
                {error && data && (
                    <div className="alert alert-danger alert-dismissible fade show mb-4" role="alert">
                        {error}
                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                    </div>
                )}

                <div className="row g-4">
                    {/* Left Column: Event Details */}
                    <div className="col-lg-5">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <h5 className="text-uppercase text-muted small fw-bold mb-3">Event Details</h5>
                                <h2 className="card-title fw-bold mb-3 text-primary">{event.title}</h2>

                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="bi bi-calendar-event fs-5 text-primary me-3"></i>
                                        <div>
                                            <div className="fw-semibold">{dateStr}</div>
                                            <div className="text-muted small">{timeStr}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="bi bi-geo-alt fs-5 text-primary me-3"></i>
                                        <div>
                                            <div className="fw-semibold">{event.location}</div>
                                            <div className="text-muted small">Location</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="bi bi-people fs-5 text-primary me-3"></i>
                                        <div>
                                            <div className="fw-semibold">{event.group_name}</div>
                                            <div className="text-muted small">Group</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="bi bi-tag fs-5 text-primary me-3"></i>
                                        <div>
                                            <div className="fw-semibold">€{parseFloat(event.price_per_person).toFixed(2)}</div>
                                            <div className="text-muted small">Per person</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-light rounded-3 mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted">Status</span>
                                        <span className={`badge ${event.status === 'open' ? 'bg-success' : 'bg-secondary'}`}>
                                            {event.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">Spots Available</span>
                                        <span className={`fw-bold ${spotsLeft <= 3 ? 'text-danger' : 'text-dark'}`}>
                                            {spotsLeft} <span className="text-muted fw-normal">/ {event.max_players}</span>
                                        </span>
                                    </div>
                                    {/* Progress Bar */}
                                    <div className="progress mt-2" style={{ height: '6px' }}>
                                        <div
                                            className="progress-bar bg-success"
                                            role="progressbar"
                                            style={{ width: `${(event.registered_count / event.max_players) * 100}%` }}
                                            aria-valuenow={event.registered_count}
                                            aria-valuemin="0"
                                            aria-valuemax={event.max_players}
                                        ></div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="d-grid gap-2">
                                    {isRegistered ? (
                                        <button
                                            className="btn btn-outline-danger btn-lg"
                                            onClick={openCancelModal}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : 'Cancel Registration'}
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn btn-lg shadow-sm ${isFull ? 'btn-warning' : 'btn-primary'}`}
                                            onClick={openRegisterModal}
                                            disabled={processing}
                                        >
                                            {processing ? 'Processing...' : (isFull ? 'Join Waitlist' : 'Register Now')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Attendees List */}
                    <div className="col-lg-7">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-header bg-white border-0 py-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">
                                    <i className="bi bi-list-ol me-2 text-primary"></i>
                                    Registered Players
                                </h5>
                                <span className="badge bg-primary rounded-pill">
                                    {attendees.length}
                                </span>
                            </div>
                            <div className="card-body p-0">
                                {attendees.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <i className="bi bi-person-x fs-1 opacity-50"></i>
                                        <p className="mt-2">No players registered yet.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Main List */}
                                        <div className="list-group list-group-flush">
                                            {attendees.filter(a => a.index <= event.max_players).map((attendee) => (
                                                <div key={attendee.id} className="list-group-item px-4 py-3 d-flex align-items-center">
                                                    <div
                                                        className="me-3 rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-secondary"
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        {attendee.index}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar me-3 bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className="bi bi-person-fill"></i>
                                                        </div>
                                                        <div>
                                                            <h6 className="mb-0 fw-semibold">{attendee.name}</h6>
                                                            <small className="text-muted">
                                                                Registered: {(() => {
                                                                    const d = new Date(attendee.registered_at);
                                                                    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                                                })()}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Waitlist */}
                                        {attendees.some(a => a.index > event.max_players) && (
                                            <>
                                                <div className="bg-light px-4 py-2 border-top border-bottom">
                                                    <small className="fw-bold text-uppercase text-warning">Waitlist / Queue</small>
                                                </div>
                                                <div className="list-group list-group-flush bg-light bg-opacity-25">
                                                    {attendees.filter(a => a.index > event.max_players).map((attendee) => (
                                                        <div key={attendee.id} className="list-group-item px-4 py-3 d-flex align-items-center bg-transparent">
                                                            <div
                                                                className="me-3 rounded-circle bg-warning bg-opacity-25 d-flex align-items-center justify-content-center fw-bold text-dark"
                                                                style={{ width: '32px', height: '32px' }}
                                                            >
                                                                {attendee.index}
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <div className="avatar me-3 bg-secondary bg-opacity-10 text-secondary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                                    <i className="bi bi-clock"></i>
                                                                </div>
                                                                <div>
                                                                    <h6 className="mb-0 fw-semibold text-muted">{attendee.name}</h6>
                                                                    <small className="text-muted">
                                                                        Waiting since: {(() => {
                                                                            const d = new Date(attendee.registered_at);
                                                                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                                                        })()}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default EventDetails;
