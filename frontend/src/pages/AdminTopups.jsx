import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminTopups() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [topups, setTopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTopups();
    }, []);

    const fetchTopups = async () => {
        try {
            const response = await get(API_ENDPOINTS.ADMIN_TOPUPS);
            if (response.success && response.data?.topups) {
                setTopups(response.data.topups);
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch top-ups');
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

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.topups_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.topups_subtitle')}</p>
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
                        <div className="section-title">{t('admin.recent_transactions')}</div>
                    </div>
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : topups.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <h5>{t('admin.no_topups')}</h5>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            {topups.map(topup => (
                                <div key={topup.id} className="event-card">
                                    <div className="event-icon">
                                        💰
                                    </div>
                                    <div className="event-info">
                                        <div className="event-title">
                                            {topup.user_full_name}
                                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                                                +€{topup.amount.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="event-details">
                                            <div className="event-detail">📧 {topup.user_email}</div>
                                            <div className="event-detail">📅 {formatDate(topup.created_at)}</div>
                                            <div className="event-detail">👤 {topup.admin_name || 'System'}</div>
                                            <div className="event-detail">🔢 #{topup.id}</div>
                                        </div>
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

export default AdminTopups;
