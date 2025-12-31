import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post } from '../api/config';

function AdminEventEdit() {
    const { id } = useParams();
    const { user, logout } = useAuth();
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
        status: 'open'
    });

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
                price_per_person: parseFloat(formData.price_per_person)
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
        <div className="min-vh-100 bg-dark">
            {/* Admin Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary">
                <div className="container-fluid px-4">
                    <Link className="navbar-brand fw-bold text-warning" to="/admin">⚡ Volley Admin</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="adminNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item"><Link className="nav-link" to="/admin">Dashboard</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/groups">Groups</Link></li>
                            <li className="nav-item"><Link className="nav-link active" to="/admin/events">Events</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/wallet">Wallet</Link></li>
                        </ul>
                        <div className="d-flex align-items-center">
                            <span className="badge bg-warning text-dark me-3">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                            <div className="dropdown">
                                <button className="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">{user?.name}</button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><Link className="dropdown-item" to="/dashboard">User View</Link></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={logout}>Logout</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container px-4 py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 text-white mb-0">Edit Event</h1>
                    <Link to="/admin/events" className="btn btn-outline-light btn-sm">
                        <i className="bi bi-arrow-left me-1"></i> Back to Events
                    </Link>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        <div className="card bg-secondary bg-opacity-25 border-secondary">
                            <div className="card-body p-4">
                                {successMessage && (
                                    <div className="alert alert-success alert-dismissible fade show">
                                        {successMessage}
                                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                                    </div>
                                )}
                                {error && (
                                    <div className="alert alert-danger alert-dismissible fade show">
                                        {error}
                                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-light">Group</label>
                                            <select
                                                className="form-select bg-dark text-white border-secondary"
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
                                            <label className="form-label text-light">Event Title</label>
                                            <input
                                                type="text"
                                                className="form-control bg-dark text-white border-secondary"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-light">Date & Time</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-dark text-white border-secondary"
                                                name="date_time"
                                                value={formData.date_time}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-light">Location</label>
                                            <input
                                                type="text"
                                                className="form-control bg-dark text-white border-secondary"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label text-light">Max Players</label>
                                            <input
                                                type="number"
                                                className="form-control bg-dark text-white border-secondary"
                                                name="max_players"
                                                value={formData.max_players}
                                                onChange={handleChange}
                                                min="2"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label text-light">Courts</label>
                                            <input
                                                type="number"
                                                className="form-control bg-dark text-white border-secondary"
                                                name="court_count"
                                                value={formData.court_count}
                                                onChange={handleChange}
                                                min="1"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label text-light">Price (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control bg-dark text-white border-secondary"
                                                name="price_per_person"
                                                value={formData.price_per_person}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-light">Status</label>
                                        <select
                                            className="form-select bg-dark text-white border-secondary"
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
                                        <label className="form-label text-light">Description</label>
                                        <textarea
                                            className="form-control bg-dark text-white border-secondary"
                                            name="description"
                                            value={formData.description || ''}
                                            onChange={handleChange}
                                            rows="3"
                                        ></textarea>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Link to="/admin/events" className="btn btn-outline-light">Cancel</Link>
                                        <button type="submit" className="btn btn-warning px-4" disabled={submitting}>
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Event Actions Card */}
                    <div className="col-lg-4">
                        <div className="card bg-secondary bg-opacity-25 border-secondary h-100">
                            <div className="card-header bg-transparent border-secondary text-white fw-bold">
                                <i className="bi bi-gear me-2"></i> Event Actions
                            </div>
                            <div className="card-body p-4">
                                <div className="mb-4 text-center p-3 bg-dark rounded border border-secondary">
                                    <small className="text-muted text-uppercase d-block mb-1">Current Status</small>
                                    <h3 className={`mb-0 text-uppercase ${formData.status === 'open' ? 'text-success' : (formData.status === 'closed' ? 'text-danger' : 'text-warning')}`}>
                                        {formData.status}
                                    </h3>
                                </div>

                                <div className="alert alert-info small border-0 bg-opacity-10 bg-info text-info">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Finalizing the event will:
                                    <ul className="mb-0 ps-3 mt-1">
                                        <li>Charge all registered players €{parseFloat(formData.price_per_person).toFixed(2)}</li>
                                        <li>Close the event for new registrations</li>
                                        <li>Add transactions to user wallets</li>
                                    </ul>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-danger w-100 py-2"
                                    onClick={handleFinalize}
                                    disabled={finalizeLoading || formData.status === 'closed' || formData.status === 'canceled'}
                                >
                                    {finalizeLoading ? 'Processing...' : (formData.status === 'closed' ? 'Event Finalized' : 'Finalize Event & Charge')}
                                </button>
                                {formData.status === 'closed' && (
                                    <div className="text-center mt-2 text-muted small">
                                        <i className="bi bi-check-circle-fill text-success me-1"></i>
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
