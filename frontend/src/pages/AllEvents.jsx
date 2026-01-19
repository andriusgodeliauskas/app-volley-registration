import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get } from '../api/config';
import Navbar from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';

function AllEvents() {
    const { t } = useLanguage();
    const [events, setEvents] = useState([]);
    const [activeEvents, setActiveEvents] = useState([]);
    const [pastEvents, setPastEvents] = useState([]);
    const [isPastCollapsed, setIsPastCollapsed] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userHasGroups, setUserHasGroups] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await get(`${API_ENDPOINTS.EVENTS}?status=all&upcoming=false`);

                if (response.success && response.data) {
                    // Check if user has groups
                    if (response.data.user_has_groups === false) {
                        setUserHasGroups(false);
                        setEvents([]);
                        setActiveEvents([]);
                        setPastEvents([]);
                        setError(null);
                    } else if (response.data.events) {
                        setUserHasGroups(true);
                        const allEvents = response.data.events;
                        setEvents(allEvents);

                        // Split events into active and past
                        const now = new Date();
                        const active = [];
                        const past = [];

                        allEvents.forEach(event => {
                            // Parse date properly - handle MySQL datetime format
                            const eventDate = new Date(event.date_time.replace(' ', 'T'));

                            if (eventDate > now) {
                                active.push(event);
                            } else {
                                past.push(event);
                            }
                        });

                        // Sort: active by date ASC (nearest first), past by date DESC (newest first)
                        active.sort((a, b) => new Date(a.date_time.replace(' ', 'T')) - new Date(b.date_time.replace(' ', 'T')));
                        past.sort((a, b) => new Date(b.date_time.replace(' ', 'T')) - new Date(a.date_time.replace(' ', 'T')));

                        setActiveEvents(active);
                        setPastEvents(past);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError(t('common.error'));
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-vh-100">
            <Navbar />

            <div className="main-container">
                <Breadcrumb items={[
                    { label: t('nav.home'), path: '/dashboard' },
                    { label: t('nav.all_events'), path: '/events' }
                ]} />

                {loading ? (
                    <div className="text-center py-5 text-muted">{t('common.loading')}</div>
                ) : !userHasGroups ? (
                    <div className="alert alert-warning d-flex align-items-start" role="alert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="me-3 flex-shrink-0 mt-1" viewBox="0 0 16 16">
                            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
                            <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
                        </svg>
                        <div>
                            <h5 className="alert-heading mb-2">{t('events.no_group_title')}</h5>
                            <p className="mb-0">{t('events.no_group_message')}</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                ) : events.length === 0 ? (
                    <div className="text-center py-5 text-muted">
                        <p className="mb-0">{t('dash.no_events')}</p>
                        <Link to="/dashboard" className="btn-custom mt-3">{t('common.back')}</Link>
                    </div>
                ) : (
                    <>
                        {/* Active Events Section */}
                        <div className="section">
                            <div className="section-header">
                                <div className="section-title">
                                    {t('admin.active_events')}
                                    <span className="badge bg-primary ms-2">{activeEvents.length}</span>
                                </div>
                            </div>

                            {activeEvents.length === 0 ? (
                                <div className="text-center py-4 text-muted">
                                    {t('admin.no_active_events')}
                                </div>
                            ) : (
                                <div className="d-flex flex-column gap-3">
                                    {activeEvents.map(event => (
                                        <div key={event.id} className="event-card">
                                            <div className="event-icon">
                                                {event.icon || '🏐'}
                                            </div>
                                            <div className="event-info">
                                                <div className="event-title">
                                                    {event.title}
                                                    {event.user_registered && <span className="event-badge">✓ {t('dash.registered')}</span>}
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
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past Events Section - Collapsible */}
                        <div className="section">
                            <div
                                className="section-header clickable-header"
                                onClick={() => setIsPastCollapsed(!isPastCollapsed)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="section-title">
                                    {t('admin.past_events')}
                                    <span className="badge bg-secondary ms-2">{pastEvents.length}</span>
                                    <i className={`bi ${isPastCollapsed ? 'bi-chevron-down' : 'bi-chevron-up'} ms-2`}></i>
                                </div>
                            </div>

                            {!isPastCollapsed && (
                                <div className="section-body">
                                    {pastEvents.length === 0 ? (
                                        <div className="text-center py-4 text-muted">
                                            {t('admin.no_past_events')}
                                        </div>
                                    ) : (
                                        <div className="d-flex flex-column gap-3">
                                            {pastEvents.map(event => (
                                                <div key={event.id} className="event-card past-event">
                                                    <div className="event-icon">
                                                        {event.icon || '🏐'}
                                                    </div>
                                                    <div className="event-info">
                                                        <div className="event-title">
                                                            {event.title}
                                                            {event.user_registered && <span className="event-badge">✓ {t('dash.registered')}</span>}
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
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AllEvents;
