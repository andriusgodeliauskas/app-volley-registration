import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminEvents() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [events, setEvents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [newEvent, setNewEvent] = useState({
        group_id: '',
        title: '',
        description: '',
        date_time: '',
        location: '',
        max_players: 12,
        court_count: 1,
        price_per_person: 5.00,
        rent_price: 0.00,
        icon: '🏐'
    });

    const ICONS = ['🏐', '🏆', '🏖️', '👟', '🍺', '🍕', '🎉', '🔥', '💪', '🥇'];

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eventsRes, groupsRes] = await Promise.all([
                get(`${API_ENDPOINTS.EVENTS}?status=all&upcoming=false`),
                get(API_ENDPOINTS.GROUPS)
            ]);

            if (eventsRes.success && eventsRes.data?.events) {
                setEvents(eventsRes.data.events);
            }
            if (groupsRes.success && groupsRes.data?.groups) {
                setGroups(groupsRes.data.groups);
                // Set default group
                if (groupsRes.data.groups.length > 0 && !newEvent.group_id) {
                    setNewEvent(prev => ({ ...prev, group_id: groupsRes.data.groups[0].id }));
                }
            }
        } catch (err) {
            console.error('Failed to fetch data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDuplicateEvent = (event) => {
        // Find the next number for this event's description
        const eventCopies = events.filter(e =>
            e.title === event.title &&
            e.location === event.location
        );
        const nextNumber = eventCopies.length + 1;

        // Prepare duplicated event data
        const duplicatedEvent = {
            group_id: event.group_id,
            title: event.title,
            description: event.description ? `${event.description} #${nextNumber}` : `#${nextNumber}`,
            date_time: '', // Leave empty for admin to set
            location: event.location,
            max_players: event.max_players,
            court_count: event.court_count,
            price_per_person: event.price_per_person,
            rent_price: event.rent_price || 0.00,
            icon: event.icon || '🏐'
        };

        setNewEvent(duplicatedEvent);
        setShowCreateModal(true);
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const response = await post(API_ENDPOINTS.EVENTS, newEvent);
            if (response.success) {
                setSuccess(t('admin.event_create_success'));
                setShowCreateModal(false);
                setNewEvent({
                    group_id: groups[0]?.id || '',
                    title: '',
                    description: '',
                    date_time: '',
                    location: '',
                    max_players: 12,
                    court_count: 1,
                    price_per_person: 5.00,
                    rent_price: 0.00,
                    icon: '🏐'
                });
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.message || t('admin.event_create_failed'));
        } finally {
            setCreating(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('lt-LT', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.events_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.events_subtitle')}</p>
                    </div>
                    <div className="d-flex gap-2">
                        <Link to="/admin" className="btn-custom bg-light border">{t('common.back')}</Link>
                        <button
                            className="btn-custom bg-warning text-dark border-warning"
                            onClick={() => setShowCreateModal(true)}
                            disabled={groups.length === 0}
                        >
                            <i className="bi bi-plus-lg me-1"></i> {t('admin.create_event')}
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                )}
                {success && (
                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                        <div>{success}</div>
                    </div>
                )}
                {groups.length === 0 && !loading && (
                    <div className="alert-custom bg-warning bg-opacity-10 border-warning text-dark mb-4">
                        <i className="bi bi-exclamation-circle-fill alert-custom-icon"></i>
                        <div dangerouslySetInnerHTML={{ __html: t('admin.no_groups_warning').replace('create a group', `<a href="/admin/groups" class="text-dark fw-bold text-decoration-underline">${t('admin.create_group')}</a>`) }}>
                        </div>
                    </div>
                )}

                {/* Events List */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">{t('admin.all_events')}</div>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h5>{t('admin.no_events')}</h5>
                                <p className="mb-0">{t('admin.no_events_subtitle')}</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 px-4 py-3">{t('admin.event_id')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_title')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_group')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_datetime')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_location')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_spots')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_price')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.event_status')}</th>
                                            <th className="border-0 px-4 py-3">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(event => (
                                            <tr key={event.id}>
                                                <td className="px-4">{event.id}</td>
                                                <td className="px-4 fw-semibold">{event.title}</td>
                                                <td className="px-4 text-muted small">{event.group_name}</td>
                                                <td className="px-4">{formatDate(event.date_time)}</td>
                                                <td className="px-4">{event.location}</td>
                                                <td className="px-4">
                                                    {event.registered_count}/{event.max_players}
                                                    {event.spots_available <= 2 && event.spots_available > 0 && (
                                                        <span className="badge bg-warning text-dark ms-1">{t('admin.event_almost_full')}</span>
                                                    )}
                                                    {event.spots_available <= 0 && (
                                                        <span className="badge bg-danger ms-1">{t('admin.event_full')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 fw-bold">€{parseFloat(event.price_per_person).toFixed(2)}</td>
                                                <td className="px-4">
                                                    <span className={`badge rounded-pill ${event.status === 'open' ? 'bg-success' :
                                                        event.status === 'closed' ? 'bg-secondary' :
                                                            event.status === 'canceled' ? 'bg-danger' : 'bg-info'
                                                        }`}>
                                                        {event.status}
                                                    </span>
                                                </td>
                                                <td className="px-4">
                                                    <div className="d-flex gap-2">
                                                        <Link to={`/admin/events/edit/${event.id}`} className="btn-custom btn-sm bg-light border">
                                                            {t('common.edit')}
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDuplicateEvent(event)}
                                                            className="btn-custom btn-sm bg-primary text-white border-primary"
                                                            title={t('common.view')}
                                                        >
                                                            <i className="bi bi-files"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold">{t('admin.create_event_title')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateEvent}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_group')}</label>
                                            <select
                                                className="form-select"
                                                value={newEvent.group_id}
                                                onChange={(e) => setNewEvent({ ...newEvent, group_id: e.target.value })}
                                                required
                                            >
                                                {groups.map(group => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_event_title')}</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                placeholder={t('placeholder.event_title')}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_icon')}</label>
                                        <div className="d-flex gap-2 flex-wrap bg-light p-2 rounded border">
                                            {ICONS.map(icon => (
                                                <button
                                                    key={icon}
                                                    type="button"
                                                    className={`btn btn-sm fs-5 ${newEvent.icon === icon ? 'btn-primary' : 'btn-outline-light text-dark border-0 hover-shadow'}`}
                                                    onClick={() => setNewEvent({ ...newEvent, icon })}
                                                >
                                                    {icon}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_datetime')}</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={newEvent.date_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, date_time: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('event.location')} *</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={newEvent.location}
                                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                                placeholder={t('placeholder.location')}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_max_players')}</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={newEvent.max_players}
                                                onChange={(e) => setNewEvent({ ...newEvent, max_players: parseInt(e.target.value) })}
                                                min="2"
                                                max="100"
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_courts')}</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={newEvent.court_count}
                                                onChange={(e) => setNewEvent({ ...newEvent, court_count: parseInt(e.target.value) })}
                                                min="1"
                                                max="10"
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className={user?.role === 'super_admin' ? "col-md-6 mb-3" : "col-md-12 mb-3"}>
                                            <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_price_person')}</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={newEvent.price_per_person}
                                                onChange={(e) => setNewEvent({ ...newEvent, price_per_person: parseFloat(e.target.value) })}
                                                min="0"
                                                step="0.50"
                                            />
                                        </div>
                                        {user?.role === 'super_admin' && (
                                            <div className="col-md-6 mb-3">
                                                <label className="form-label text-muted small fw-bold text-uppercase">{t('admin.form_rent_total')}</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={newEvent.rent_price}
                                                    onChange={(e) => setNewEvent({ ...newEvent, rent_price: parseFloat(e.target.value) })}
                                                    min="0"
                                                    step="0.01"
                                                    placeholder={t('admin.form_rent_tooltip')}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">{t('event.description')}</label>
                                        <textarea
                                            className="form-control"
                                            value={newEvent.description}
                                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                            placeholder={t('placeholder.description')}
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn-custom bg-light border"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-custom bg-warning text-dark border-warning"
                                        disabled={creating}
                                    >
                                        {creating ? t('admin.form_creating') : t('admin.create_event')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminEvents;
