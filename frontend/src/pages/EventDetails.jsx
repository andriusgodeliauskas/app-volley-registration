import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post, del } from '../api/config';
import Navbar from '../components/Navbar';

function EventDetails() {
    const { t } = useLanguage();
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
                setError(response.message || t('event.failed_load'));
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError(t('profile.error_occurred'));
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

                    setSuccessMessage(t('dash.registration_success'));
                    fetchDetails(); // Reload data
                } else {
                    setError(response.message || t('event.failed_register'));
                }
            } else if (type === 'cancel') {
                const response = await del(`${API_ENDPOINTS.REGISTER_EVENT}?event_id=${id}`);

                if (response.success) {
                    // Update balance if returned
                    if (response.data?.new_balance !== undefined) {
                        updateUser({ ...user, balance: parseFloat(response.data.new_balance) });
                    }

                    setSuccessMessage(t('dash.cancellation_success'));
                    fetchDetails(); // Reload data
                } else {
                    setError(response.message || t('event.failed_cancel'));
                }
            }
        } catch (err) {
            setError(err.message || (type === 'register' ? t('event.failed_register') : t('event.failed_cancel')));
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
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
                            <Link to="/dashboard" className="btn btn-sm btn-outline-danger">{t('common.back')}</Link>
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
        <div className="min-vh-100">
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
                                <button type="button" className={`btn-custom ${confirmModal.type === 'register' ? 'bg-primary text-white border-primary' : 'btn-danger-custom text-white bg-danger border-danger'} px-4`} onClick={handleConfirmAction}>{t('common.yes')}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="main-container">
                {/* Alerts */}
                {successMessage && (
                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                        <div>{successMessage} <button type="button" className="btn-close ms-2" onClick={() => setSuccessMessage('')}></button></div>
                    </div>
                )}
                {error && data && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error} <button type="button" className="btn-close ms-2" onClick={() => setError(null)}></button></div>
                    </div>
                )}

                <div className="row g-4">
                    {/* Left Column: Event Details */}
                    <div className="col-lg-5">
                        <div className="section h-100">
                            <div className="section-header">
                                <div>
                                    <div className="section-title text-primary">{event.title}</div>
                                    <div className="section-subtitle">{t('event.details')}</div>
                                </div>
                            </div>
                            <div className="p-0">
                                <div className="mb-4">
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                                            <i className="bi bi-calendar-event fs-5"></i>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">{dateStr}</div>
                                            <div className="text-muted small">{timeStr}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                                            <i className="bi bi-geo-alt fs-5"></i>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">{event.location}</div>
                                            <div className="text-muted small">{t('event.location')}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                                            <i className="bi bi-people fs-5"></i>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">{event.group_name}</div>
                                            <div className="text-muted small">{t('event.group')}</div>
                                        </div>
                                    </div>
                                    <div className="d-flex align-items-center mb-3">
                                        <div className="bg-primary bg-opacity-10 p-2 rounded me-3 text-primary">
                                            <i className="bi bi-tag fs-5"></i>
                                        </div>
                                        <div>
                                            <div className="fw-semibold">€{parseFloat(event.price_per_person).toFixed(2)}</div>
                                            <div className="text-muted small">{t('event.per_person')}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-light rounded-3 mb-4">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <span className="text-muted">{t('event.status')}</span>
                                        <span className={`badge ${event.status === 'open' ? 'bg-success' : 'bg-secondary'}`}>
                                            {t('event.open')}
                                        </span>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <span className="text-muted">{t('event.spots')}</span>
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
                                            className="btn-custom btn-danger-custom text-white bg-danger border-danger w-100"
                                            onClick={openCancelModal}
                                            disabled={processing}
                                        >
                                            {processing ? t('common.loading') : t('event.cancel_btn')}
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn-custom w-100 ${isFull ? 'bg-warning text-dark border-warning' : 'bg-primary text-white border-primary'}`}
                                            onClick={openRegisterModal}
                                            disabled={processing}
                                        >
                                            {processing ? t('common.loading') : (isFull ? t('event.waitlist') : t('event.register_btn'))}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Attendees List */}
                    <div className="col-lg-7">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">
                                    {t('event.registered_players')}
                                    <span className="badge bg-primary rounded-pill ms-2 fs-6 align-middle">
                                        {attendees.length}
                                    </span>
                                </div>
                            </div>
                            <div className="p-0">
                                {attendees.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <p className="mt-2">{t('wallet.no_transactions')}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Main List */}
                                        <div className="d-flex flex-column gap-2">
                                            {attendees.filter(a => a.index <= event.max_players).map((attendee) => (
                                                <div key={attendee.id} className="p-3 bg-white border rounded-3 d-flex align-items-center">
                                                    <div
                                                        className="me-3 rounded-circle bg-light d-flex align-items-center justify-content-center fw-bold text-secondary"
                                                        style={{ width: '32px', height: '32px' }}
                                                    >
                                                        {attendee.index}
                                                    </div>
                                                    <div className="d-flex align-items-center">
                                                        <img
                                                            src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${attendee.avatar || 'Midnight'}`}
                                                            alt={attendee.name}
                                                            className="me-3 rounded-circle shadow-sm bg-gray-100"
                                                            style={{ width: '40px', height: '40px' }}
                                                        />
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
                                                <div className="px-1 py-3">
                                                    <small className="fw-bold text-uppercase text-warning">{t('event.waitlist')}</small>
                                                </div>
                                                <div className="d-flex flex-column gap-2 opacity-75">
                                                    {attendees.filter(a => a.index > event.max_players).map((attendee) => (
                                                        <div key={attendee.id} className="p-3 bg-light border border-warning rounded-3 d-flex align-items-center">
                                                            <div
                                                                className="me-3 rounded-circle bg-warning bg-opacity-25 d-flex align-items-center justify-content-center fw-bold text-dark"
                                                                style={{ width: '32px', height: '32px' }}
                                                            >
                                                                {attendee.index}
                                                            </div>
                                                            <div className="d-flex align-items-center">
                                                                <img
                                                                    src={`https://api.dicebear.com/9.x/adventurer/svg?seed=${attendee.avatar || 'Midnight'}`}
                                                                    alt={attendee.name}
                                                                    className="me-3 rounded-circle shadow-sm bg-light opacity-75"
                                                                    style={{ width: '40px', height: '40px', filter: 'grayscale(100%)' }}
                                                                />
                                                                <div>
                                                                    <h6 className="mb-0 fw-semibold text-muted">{attendee.name}</h6>
                                                                    <small className="text-muted">
                                                                        {t('event.waiting_since')}: {(() => {
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
