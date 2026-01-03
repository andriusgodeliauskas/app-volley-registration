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

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await get(`${API_ENDPOINTS.EVENTS}?status=all&upcoming=false`);
                if (response.success && response.data?.events) {
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
