import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminTopups() {
    const { user } = useAuth();
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
                        <h1 className="h3 fw-bold mb-1">Top-ups History</h1>
                        <p className="text-muted mb-0">View all manual wallet top-ups</p>
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
                        <div className="section-title">Recent Transactions</div>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : topups.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h5>No top-ups found</h5>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 px-4 py-3">ID</th>
                                            <th className="border-0 px-4 py-3">Date</th>
                                            <th className="border-0 px-4 py-3">User</th>
                                            <th className="border-0 px-4 py-3">Email</th>
                                            <th className="border-0 px-4 py-3">Admin</th>
                                            <th className="border-0 px-4 py-3 text-end">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {topups.map(t => (
                                            <tr key={t.id}>
                                                <td className="px-4 text-muted small">#{t.id}</td>
                                                <td className="px-4">{formatDate(t.created_at)}</td>
                                                <td className="px-4 fw-semibold">{t.user_full_name}</td>
                                                <td className="px-4 text-muted small">{t.user_email}</td>
                                                <td className="px-4 small">{t.admin_name || 'System'}</td>
                                                <td className="px-4 fw-bold text-success text-end">+€{t.amount.toFixed(2)}</td>
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

export default AdminTopups;
