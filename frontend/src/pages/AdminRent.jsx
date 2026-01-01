import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminRent() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Redirect if not super_admin
    if (user && user.role !== 'super_admin') {
        return (
            <div className="min-vh-100">
                <AdminNavbar />
                <div className="container mt-5">
                    <div className="alert alert-danger">{t('admin.rent_access_denied')}</div>
                </div>
            </div>
        );
    }

    useEffect(() => {
        fetchRentData();
    }, []);

    const fetchRentData = async () => {
        try {
            const response = await get(API_ENDPOINTS.ADMIN_RENT);
            if (response.success && response.data?.rent_events) {
                setEvents(response.data.rent_events);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch rent data');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('lt-LT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTotalRent = () => {
        return events.reduce((sum, event) => sum + (parseFloat(event.rent_price) || 0), 0);
    };

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.rent_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.rent_subtitle')}</p>
                    </div>
                    <div className="bg-danger bg-opacity-10 px-4 py-2 rounded-3 border border-danger border-opacity-25">
                        <span className="text-danger small fw-bold text-uppercase d-block">{t('admin.total_rent_cost')}</span>
                        <span className="fs-4 fw-bold text-danger">€{getTotalRent().toFixed(2)}</span>
                    </div>
                </div>

                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                )}

                <div className="section">
                    <div className="section-header">
                        <div className="section-title">Rent History</div>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : events.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h5>No past events found</h5>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 px-4 py-3">ID</th>
                                            <th className="border-0 px-4 py-3">Date Ended</th>
                                            <th className="border-0 px-4 py-3">Event</th>
                                            <th className="border-0 px-4 py-3">Location</th>
                                            <th className="border-0 px-4 py-3">Group</th>
                                            <th className="border-0 px-4 py-3 text-end">Rent Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {events.map(event => (
                                            <tr key={event.id}>
                                                <td className="px-4 text-muted small">#{event.id}</td>
                                                <td className="px-4">{formatDate(event.date_time)}</td>
                                                <td className="px-4 fw-semibold">
                                                    <Link to={`/admin/events/edit/${event.id}`} className="text-decoration-none text-dark">
                                                        {event.title}
                                                    </Link>
                                                </td>
                                                <td className="px-4 text-muted small">{event.location}</td>
                                                <td className="px-4 small">{event.group_name}</td>
                                                <td className="px-4 fw-bold text-danger text-end">-€{event.rent_price.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminRent;
