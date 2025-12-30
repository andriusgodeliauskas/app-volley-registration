import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_ENDPOINTS, get } from '../api/config';

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
        <div className="min-vh-100 bg-light">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
                <div className="container">
                    <Link className="navbar-brand fw-bold" to="/dashboard">🏐 Volley App</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
                            <li className="nav-item"><Link className="nav-link active" to="/events">All Events</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/wallet">Wallet</Link></li>
                        </ul>
                    </div>
                </div>
            </nav>

            <div className="container pb-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold mb-0">All Available Events</h2>
                </div>

                {loading ? (
                    <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : events.length === 0 ? (
                    <div className="text-center py-5 bg-white rounded-3 shadow-sm">
                        <span className="display-1">📭</span>
                        <h4 className="mt-3">No events found</h4>
                        <p className="text-muted">There are no upcoming events scheduled at the moment.</p>
                        <Link to="/dashboard" className="btn btn-primary mt-2">Back to Dashboard</Link>
                    </div>
                ) : (
                    <div className="row g-4">
                        {events.map(event => (
                            <div key={event.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-0 shadow-sm hover-shadow transition-all">
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="bg-primary bg-opacity-10 text-primary rounded px-2 py-1 fw-bold small">
                                                {formatDate(event.date_time)}
                                            </div>
                                            <span className="badge bg-light text-dark border">
                                                {event.group_name}
                                            </span>
                                        </div>

                                        <h5 className="card-title fw-bold mb-1">{event.title}</h5>
                                        <p className="text-muted small mb-3">
                                            <i className="bi bi-geo-alt me-1"></i>{event.location}
                                        </p>

                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <div className="d-flex align-items-center">
                                                <i className="bi bi-clock me-2 text-muted"></i>
                                                <span>{formatTime(event.date_time)}</span>
                                            </div>
                                            <div className="fw-bold text-success">
                                                €{parseFloat(event.price_per_person).toFixed(2)}
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center pt-3 border-top">
                                            <span className={`small ${event.spots_available <= 2 ? 'text-danger fw-bold' : 'text-muted'}`}>
                                                {event.spots_available > 0 ? `${event.spots_available} spots left` : 'Full'}
                                            </span>
                                            <Link
                                                to={`/event/${event.id}`}
                                                className="btn btn-primary btn-sm px-3"
                                            >
                                                More info
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AllEvents;
