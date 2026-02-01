import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminEventEdit() {
    const { id } = useParams();
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');
    const [groups, setGroups] = useState([]);

    const [formData, setFormData] = useState({
        title: '',
        group_id: '',
        description: '',
        date_time: '',
        location: '',
        max_players: 0,
        court_count: 1,
        price_per_person: 0,
        rent_price: 0,
        registration_cutoff_hours: '',
        negative_balance_limit: -12.00,
        status: 'open',
        icon: '🏐'
    });

    const ICONS = ['🏐', '🏆', '🏖️', '👟', '🍺', '🍕', '🎉', '🔥', '💪', '🥇'];

    const [finalizeLoading, setFinalizeLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                // Fetch groups for dropdown
                const groupsRes = await get(API_ENDPOINTS.GROUPS);
                if (groupsRes.success && groupsRes.data?.groups) {
                    setGroups(groupsRes.data.groups);
                }

                // Fetch event details
                const eventRes = await get(`${API_ENDPOINTS.ADMIN_EVENT_DETAILS}?event_id=${id}`);
                if (eventRes.success && eventRes.data?.event) {
                    setFormData(eventRes.data.event);
                } else {
                    setError(eventRes.message || 'Failed to load event details');
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('An error occurred while loading event data.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInitialData();
        }
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFinalize = async () => {
        if (!window.confirm('Are you sure you want to finalize this event? This will charge all registered users and close the event.')) {
            return;
        }

        setFinalizeLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const response = await post(API_ENDPOINTS.ADMIN_EVENT_FINALIZE, { event_id: id });

            if (response.success) {
                setSuccessMessage(
                    `Event finalized! Charged ${response.data.charged_count} users. Total: €${parseFloat(response.data.total_amount).toFixed(2)}`
                );
                // Refresh data
                const eventRes = await get(`${API_ENDPOINTS.ADMIN_EVENT_DETAILS}?event_id=${id}`);
                if (eventRes.success && eventRes.data?.event) {
                    setFormData(eventRes.data.event);
                }
            } else {
                setError(response.message || 'Failed to finalize event');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during finalization.');
        } finally {
            setFinalizeLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage('');

        try {
            const payload = {
                event_id: id,
                ...formData,
                group_id: parseInt(formData.group_id),
                max_players: parseInt(formData.max_players),
                court_count: parseInt(formData.court_count),
                price_per_person: parseFloat(formData.price_per_person),
                rent_price: parseFloat(formData.rent_price),
                registration_cutoff_hours: formData.registration_cutoff_hours ? parseInt(formData.registration_cutoff_hours) : null,
                negative_balance_limit: parseFloat(formData.negative_balance_limit)
            };

            const response = await post(API_ENDPOINTS.ADMIN_EVENT_UPDATE, payload);

            if (response.success) {
                setSuccessMessage('Event updated successfully!');
            } else {
                setError(response.message || 'Failed to update event');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while updating.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">Edit Event</h1>
                        <p className="text-muted mb-0">Update event details or status</p>
                    </div>
                    <Link to="/admin/events" className="btn-custom bg-light border">
                        <i className="bi bi-arrow-left me-1"></i> Back to Events
                    </Link>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="section">
                            <div className="p-4">
                                {successMessage && (
                                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                                        <div>
                                            {successMessage}
                                            <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage('')}></button>
                                        </div>
                                    </div>
                                )}
                                {error && (
                                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                                        <div>
                                            {error}
                                            <button type="button" className="btn-close ms-auto" onClick={() => setError(null)}></button>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Group</label>
                                            <select
                                                className="form-select"
                                                name="group_id"
                                                value={formData.group_id}
                                                onChange={handleChange}
                                                required
                                            >
                                                {groups.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Event Title</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Icon</label>
                                        <div className="d-flex gap-2 flex-wrap bg-light p-2 rounded border">
                                            {ICONS.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    className={`btn btn-sm fs-5 ${formData.icon === icon ? 'btn-primary' : 'btn-outline-light text-dark border-0 hover-shadow'}`}
                                                    onClick={() => setFormData({ ...formData, icon })}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                name="date_time"
                                                value={formData.date_time}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Location</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Max Players</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="max_players"
                                                value={formData.max_players}
                                                onChange={handleChange}
                                                min="2"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Courts</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                name="court_count"
                                                value={formData.court_count}
                                                onChange={handleChange}
                                                min="1"
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className={user?.role === 'super_admin' ? "col-md-6 mb-3" : "col-md-12 mb-3"}>
                                            <label className="form-label text-muted small fw-bold text-uppercase">Price per Person (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="price_per_person"
                                                value={formData.price_per_person}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {user?.role === 'super_admin' && (
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small fw-bold text-uppercase">Rent Price Total (€)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    name="rent_price"
                                                    value={formData.rent_price}
                                                    onChange={handleChange}
                                                    placeholder="Total to pay to venue"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">
                                            {t('registration_cutoff_hours')}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="registration_cutoff_hours"
                                            value={formData.registration_cutoff_hours}
                                            onChange={handleChange}
                                            min="0"
                                            placeholder={t('registration_cutoff_hours_placeholder')}
                                        />
                                        <small className="form-text text-muted">
                                            {t('registration_cutoff_hours_helper')}
                                        </small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">
                                            {t('admin.negative_balance_limit')} (€)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            name="negative_balance_limit"
                                            value={formData.negative_balance_limit}
                                            onChange={handleChange}
                                            placeholder="-12.00"
                                        />
                                        <small className="form-text text-muted">
                                            <i className="bi bi-info-circle me-1"></i>
                                            {t('admin.negative_balance_limit_event_help')}
                                        </small>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Status</label>
                                        <select
                                            className="form-select"
                                            name="status"
                                            value={formData.status}
                                            onChange={handleChange}
                                        >
                                            <option value="open">Open</option>
                                            <option value="closed">Closed</option>
                                            <option value="canceled">Canceled</option>
                                        </select>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Description</label>
                                        <textarea
                                            className="form-control"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleChange}
                                            rows="3"
                                        ></textarea>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Link to="/admin/events" className="btn-custom bg-light border">Cancel</Link>
                                        <button type="submit" className="btn-custom bg-warning text-dark border-warning" disabled={submitting}>
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Event Actions Card */}
                    <div className="col-lg-4">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">
                                    <i className="bi bi-gear me-2"></i> Event Actions
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="mb-4 text-center p-3 bg-light rounded border">
                                    <small className="text-muted text-uppercase d-block mb-1">Current Status</small>
                                    <h3 className={`mb-0 text-uppercase ${formData.status === 'open' ? 'text-success' : (formData.status === 'closed' ? 'text-danger' : 'text-warning')}`}>
                                        {formData.status}
                                    </h3>
                                </div>

                                <div className="alert-custom bg-info bg-opacity-10 border-info text-info mb-4" style={{ display: 'block' }}>
                                    <div className="d-flex align-items-center mb-2">
                                        <i className="bi bi-info-circle-fill me-2"></i>
                                        Finalizing limits:
                                    </div>
                                    <ul className="mb-0 ps-3 small">
                                        <li>Charge all registered players €{parseFloat(formData.price_per_person).toFixed(2)}</li>
                                        <li>Close the event for new registrations</li>
                                        <li>Add transactions to user wallets</li>
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    className="btn-custom bg-danger text-white w-100 py-3"
                                    onClick={handleFinalize}
                                    disabled={finalizeLoading || formData.status === 'closed' || formData.status === 'canceled'}
                                >
                                    {finalizeLoading ? 'Processing...' : (formData.status === 'closed' ? 'Event Finalized' : 'Finalize Event & Charge')}
                                </button>
                                {formData.status === 'closed' && (
                                    <div className="text-center mt-3 text-success small fw-bold">
                                        <i className="bi bi-check-circle-fill me-1"></i>
                                        Payments have been processed.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminEventEdit;
