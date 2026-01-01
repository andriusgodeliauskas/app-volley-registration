import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, get } from '../api/config';
import Navbar from '../components/Navbar';

function AllEvents() {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const response = await get(API_ENDPOINTS.EVENTS);
                if (response.success && response.data?.events) {
                    setEvents(response.data.events);
                }
            } catch (err) {
                console.error('Failed to fetch events:', err);
                setError('Failed to load events. Please try again.');
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
                <div className="section">
                    <div className="section-header">
                        <div>
                            <div className="section-title">📅 All Available Events</div>
                            <div className="section-subtitle">Browse and register for all volleyball games</div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5 text-muted">Loading events...</div>
                    ) : error ? (
                        <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger">
                            <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                            <div>{error}</div>
                        </div>
                    ) : events.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p className="mb-0">No upcoming events scheduled at the moment.</p>
                            <Link to="/dashboard" className="btn-custom mt-3">Back to Dashboard</Link>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {events.map(event => (
                                <div key={event.id} className="event-card">
                                    <div className="event-icon">
                                        {event.icon || '🏐'}
                                    </div>
                                    <div className="event-info">
                                        <div className="event-title">
                                            {formatDate(event.date_time)} {event.title}
                                            {event.user_registered && <span className="event-badge">✓ Registered</span>}
                                        </div>
                                        <div className="event-details">
                                            <div className="event-detail">📍 {event.location}</div>
                                            <div className="event-detail">📅 {formatDate(event.date_time)}, {formatTime(event.date_time)}</div>
                                            <div className="event-detail">
                                                👥 {event.spots_available > 0 ? `${event.spots_available} spots left` : 'Full'} • {event.group_name}
                                            </div>
                                            <div className="event-detail">💰 €{parseFloat(event.price_per_person).toFixed(2)}</div>
                                        </div>
                                    </div>
                                    <div className="event-actions">
                                        <Link to={`/event/${event.id}`} className="btn-custom">More info</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AllEvents;
