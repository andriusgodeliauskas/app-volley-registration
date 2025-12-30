import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post } from '../api/config';

function AdminEvents() {
    const { user, logout } = useAuth();
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
        price_per_person: 5.00
    });

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

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const response = await post(API_ENDPOINTS.EVENTS, newEvent);
            if (response.success) {
                setSuccess('Event created successfully!');
                setShowCreateModal(false);
                setNewEvent({
                    group_id: groups[0]?.id || '',
                    title: '',
                    description: '',
                    date_time: '',
                    location: '',
                    max_players: 12,
                    court_count: 1,
                    price_per_person: 5.00
                });
                fetchData();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to create event');
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

            {/* Main Content */}
            <div className="container-fluid px-4 py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 text-white mb-1">Events</h1>
                        <p className="text-secondary mb-0">Manage volleyball events</p>
                    </div>
                    <button
                        className="btn btn-warning"
                        onClick={() => setShowCreateModal(true)}
                        disabled={groups.length === 0}
                    >
                        + Create Event
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}
                {success && (
                    <div className="alert alert-success">{success}</div>
                )}
                {groups.length === 0 && !loading && (
                    <div className="alert alert-warning">
                        <strong>No groups found!</strong> You need to <Link to="/admin/groups">create a group</Link> first before creating events.
                    </div>
                )}

                {/* Events List */}
                <div className="card bg-secondary bg-opacity-25 border-secondary">
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-warning"></div>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-5 text-white">
                                <h5>No events yet</h5>
                                <p className="text-secondary">Create your first event to start accepting registrations.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-dark table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Title</th>
                                            <th>Group</th>
                                            <th>Date & Time</th>
                                            <th>Location</th>
                                            <th>Spots</th>
                                            <th>Price</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(event => (
                                            <tr key={event.id}>
                                                <td>{event.id}</td>
                                                <td className="fw-semibold">{event.title}</td>
                                                <td className="text-secondary">{event.group_name}</td>
                                                <td>{formatDate(event.date_time)}</td>
                                                <td>{event.location}</td>
                                                <td>
                                                    {event.registered_count}/{event.max_players}
                                                    {event.spots_available <= 2 && event.spots_available > 0 && (
                                                        <span className="badge bg-warning text-dark ms-1">Almost full</span>
                                                    )}
                                                    {event.spots_available <= 0 && (
                                                        <span className="badge bg-danger ms-1">Full</span>
                                                    )}
                                                </td>
                                                <td>€{parseFloat(event.price_per_person).toFixed(2)}</td>
                                                <td>
                                                    <span className={`badge ${event.status === 'open' ? 'bg-success' :
                                                            event.status === 'closed' ? 'bg-secondary' :
                                                                event.status === 'canceled' ? 'bg-danger' : 'bg-info'
                                                        }`}>
                                                        {event.status}
                                                    </span>
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
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Create New Event</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateEvent}>
                                <div className="modal-body">
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Group *</label>
                                            <select
                                                className="form-select bg-secondary border-secondary text-white"
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
                                            <label className="form-label">Event Title *</label>
                                            <input
                                                type="text"
                                                className="form-control bg-secondary border-secondary text-white"
                                                value={newEvent.title}
                                                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                                                placeholder="e.g., Friday Night Volleyball"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Date & Time *</label>
                                            <input
                                                type="datetime-local"
                                                className="form-control bg-secondary border-secondary text-white"
                                                value={newEvent.date_time}
                                                onChange={(e) => setNewEvent({ ...newEvent, date_time: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label">Location *</label>
                                            <input
                                                type="text"
                                                className="form-control bg-secondary border-secondary text-white"
                                                value={newEvent.location}
                                                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                                                placeholder="e.g., Sports Hall, Vilnius"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Max Players</label>
                                            <input
                                                type="number"
                                                className="form-control bg-secondary border-secondary text-white"
                                                value={newEvent.max_players}
                                                onChange={(e) => setNewEvent({ ...newEvent, max_players: parseInt(e.target.value) })}
                                                min="2"
                                                max="100"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Courts</label>
                                            <input
                                                type="number"
                                                className="form-control bg-secondary border-secondary text-white"
                                                value={newEvent.court_count}
                                                onChange={(e) => setNewEvent({ ...newEvent, court_count: parseInt(e.target.value) })}
                                                min="1"
                                                max="10"
                                            />
                                        </div>
                                        <div className="col-md-4 mb-3">
                                            <label className="form-label">Price (€)</label>
                                            <input
                                                type="number"
                                                className="form-control bg-secondary border-secondary text-white"
                                                value={newEvent.price_per_person}
                                                onChange={(e) => setNewEvent({ ...newEvent, price_per_person: parseFloat(e.target.value) })}
                                                min="0"
                                                step="0.50"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control bg-secondary border-secondary text-white"
                                            value={newEvent.description}
                                            onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                                            placeholder="Additional details about the event..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-secondary">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-warning"
                                        disabled={creating}
                                    >
                                        {creating ? 'Creating...' : 'Create Event'}
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
