import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminDashboard() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        total_users: 0,
        active_groups: 0,
        upcoming_events: 0,
        pending_topups: 0
    });
    const [loading, setLoading] = useState(true);
    const [eventsOccupancy, setEventsOccupancy] = useState([]);
    const [occupancyLoading, setOccupancyLoading] = useState(true);
    const [expandedEvents, setExpandedEvents] = useState({});

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await get(API_ENDPOINTS.ADMIN_STATS);
                if (response.success && response.data?.stats) {
                    setStats(response.data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchEventsOccupancy = async () => {
            try {
                const response = await get(API_ENDPOINTS.ADMIN_EVENTS_OCCUPANCY);
                if (response.success && response.data?.events) {
                    // Filter only upcoming events and sort by date ASC (nearest first)
                    const now = new Date();
                    const upcomingEvents = response.data.events
                        .filter(event => new Date(event.date_time) > now)
                        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
                    setEventsOccupancy(upcomingEvents);
                }
            } catch (error) {
                console.error('Failed to fetch events occupancy:', error);
            } finally {
                setOccupancyLoading(false);
            }
        };

        fetchStats();
        fetchEventsOccupancy();
    }, []);

    const toggleEventExpansion = (eventId) => {
        setExpandedEvents(prev => ({
            ...prev,
            [eventId]: !prev[eventId]
        }));
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
                {/* Admin Header & Nav */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.dashboard_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.dashboard_subtitle')}</p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Link to="/admin/users" className="btn-custom bg-white border">{t('admin.stats_users')}</Link>
                        <Link to="/admin/groups" className="btn-custom bg-white border">{t('admin.stats_groups')}</Link>
                        <Link to="/admin/events" className="btn-custom bg-white border">{t('admin.stats_events')}</Link>
                        <Link to="/admin/wallet" className="btn-custom bg-white border">{t('admin.stats_wallet')}</Link>
                    </div>
                </div>

                {/* Events Occupancy Section */}
                <div className="section mb-4">
                    <div className="section-header">
                        <div className="section-title">{t('admin.events_occupancy')}</div>
                        <p className="text-muted mb-0 small">{t('admin.occupancy_subtitle')}</p>
                    </div>
                    <div className="section-body">
                        {occupancyLoading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : eventsOccupancy.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                <p className="mb-0">{t('admin.no_events_occupancy')}</p>
                            </div>
                        ) : (
                            <div className="row g-3">
                                {eventsOccupancy.map(event => {
                                    const percentage = event.max_players > 0
                                        ? (event.registered_count / event.max_players * 100).toFixed(0)
                                        : 0;
                                    const isExpanded = expandedEvents[event.id];

                                    return (
                                        <div key={event.id} className="col-12 col-md-6 col-lg-4">
                                            <div className="card border-0 shadow-sm h-100">
                                                <div className="card-body">
                                                    {/* Event Header */}
                                                    <div className="d-flex align-items-start mb-3">
                                                        <div className="fs-3 me-2">{event.icon || '🏐'}</div>
                                                        <div className="flex-grow-1">
                                                            <h6 className="mb-1 fw-bold">{event.title}</h6>
                                                            <small className="text-muted d-block">
                                                                📅 {formatDate(event.date_time)}
                                                            </small>
                                                            <small className="text-muted d-block">
                                                                📍 {event.location}
                                                            </small>
                                                        </div>
                                                    </div>

                                                    {/* Occupancy Stats */}
                                                    <div className="mb-3">
                                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                                            <span className="small fw-bold text-muted">
                                                                {event.registered_count} / {event.max_players} {t('admin.occupancy_total_spots')}
                                                            </span>
                                                            <span className={`badge ${percentage >= 100 ? 'bg-danger' : percentage >= 80 ? 'bg-warning' : 'bg-success'}`}>
                                                                {percentage}%
                                                            </span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="progress" style={{ height: '24px', borderRadius: '12px' }}>
                                                            <div
                                                                className="progress-bar bg-danger"
                                                                role="progressbar"
                                                                style={{ width: `${percentage}%` }}
                                                                aria-valuenow={percentage}
                                                                aria-valuemin="0"
                                                                aria-valuemax="100"
                                                            >
                                                                <small className="fw-bold">{t('admin.occupancy_taken')}</small>
                                                            </div>
                                                            {percentage < 100 && (
                                                                <div
                                                                    className="progress-bar bg-success"
                                                                    role="progressbar"
                                                                    style={{ width: `${100 - percentage}%` }}
                                                                >
                                                                    <small className="fw-bold">{t('admin.occupancy_available')}</small>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Participants Toggle */}
                                                    {event.participants && event.participants.length > 0 && (
                                                        <>
                                                            <button
                                                                className="btn btn-sm btn-outline-primary w-100 mb-2"
                                                                onClick={() => toggleEventExpansion(event.id)}
                                                            >
                                                                <i className={`bi ${isExpanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`}></i>
                                                                {t('admin.participants_list')} ({event.participants.length})
                                                            </button>

                                                            {/* Participants List */}
                                                            {isExpanded && (
                                                                <div className="table-responsive">
                                                                    <table className="table table-sm table-hover mb-0">
                                                                        <thead className="table-light">
                                                                            <tr>
                                                                                <th style={{ width: '40px' }}>{t('admin.participant_number')}</th>
                                                                                <th>{t('admin.participant_name')}</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {event.participants.map(participant => (
                                                                                <tr key={participant.id}>
                                                                                    <td className="text-muted">{participant.number}</td>
                                                                                    <td>{participant.name} {participant.surname}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {event.participants && event.participants.length === 0 && (
                                                        <div className="text-center py-2">
                                                            <small className="text-muted">{t('admin.no_participants')}</small>
                                                        </div>
                                                    )}
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
                <div className="dashboard-cards mb-4">
                    <div className="dash-card bg-primary text-white">
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">{t('admin.total_users')}</div>
                            <div className="dash-card-icon text-white">👥</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.total_users}
                        </div>
                    </div>
                    <div className="dash-card bg-success text-white">
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">{t('admin.stats_groups')}</div>
                            <div className="dash-card-icon text-white">🏘️</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.active_groups}
                        </div>
                    </div>
                    <div className="dash-card bg-info text-white">
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">{t('admin.total_events')}</div>
                            <div className="dash-card-icon text-white">📅</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.upcoming_events}
                        </div>
                    </div>
                    {user?.role === 'super_admin' && (
                        <div className="dash-card bg-success text-white">
                            <div className="dash-card-header text-white-50">
                                <div className="dash-card-title text-white">{t('admin.total_earnings')}</div>
                                <div className="dash-card-icon text-white">📈</div>
                            </div>
                            <div className="dash-card-value text-white">
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : `€${stats.total_earnings?.toFixed(2) || '0.00'}`}
                            </div>
                        </div>
                    )}
                    <div className="dash-card bg-purple text-white" style={{ backgroundColor: '#6f42c1' }}>
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">{t('admin.total_topups')}</div>
                            <div className="dash-card-icon text-white">💰</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : `€${stats.total_topups_amount?.toFixed(2) || '0.00'}`}
                        </div>
                    </div>
                    {user?.role === 'super_admin' && (
                        <div className="dash-card bg-danger text-white">
                            <div className="dash-card-header text-white-50">
                                <div className="dash-card-title text-white">{t('admin.total_rent_cost')}</div>
                                <div className="dash-card-icon text-white">🏟️</div>
                            </div>
                            <div className="dash-card-value text-white">
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : `€${stats.total_rent_amount?.toFixed(2) || '0.00'}`}
                            </div>
                        </div>
                    )}
                </div>

                {/* Admin Actions */}
                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">{t('admin.quick_actions')}</div>
                            </div>
                            <div className="d-grid gap-2">
                                <div className="d-flex gap-2">
                                    <Link to="/admin/users" className="btn-custom flex-grow-1 text-center bg-light">{t('admin.manage_users')}</Link>
                                    <Link to="/admin/events" className="btn-custom flex-grow-1 text-center bg-light">{t('admin.manage_events')}</Link>
                                </div>
                                <Link to="/admin/wallet" className="btn-custom text-center bg-warning bg-opacity-10 text-warning border-warning border-opacity-25">
                                    {t('admin.process_topups')}
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">{t('admin.recent_activity')}</div>
                            </div>
                            <div className="text-muted small">
                                {t('admin.activity_feed')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
