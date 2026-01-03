import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminTopups() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [topups, setTopups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    // Modal state
    const [showTopupModal, setShowTopupModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [topUpData, setTopUpData] = useState({
        user_id: '',
        amount: '',
        description: '',
        created_at: ''
    });
    const [topUpLoading, setTopUpLoading] = useState(false);

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

    const fetchUsers = async () => {
        setUsersLoading(true);
        try {
            const response = await get(API_ENDPOINTS.USERS);
            if (response.success && response.data?.users) {
                setUsers(response.data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError(t('admin.failed_load_users'));
        } finally {
            setUsersLoading(false);
        }
    };

    const handleOpenTopupModal = () => {
        setShowTopupModal(true);
        fetchUsers();
        setError(null);
        setSuccessMessage('');
        setSearchTerm('');
    };

    const handleCloseTopupModal = () => {
        setShowTopupModal(false);
        setTopUpData({
            user_id: '',
            amount: '',
            description: '',
            created_at: ''
        });
        setSearchTerm('');
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        setTopUpLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const payload = {
                user_id: parseInt(topUpData.user_id),
                amount: parseFloat(topUpData.amount),
                description: topUpData.description || 'Manual Top-up',
                created_at: topUpData.created_at
            };

            const response = await post(API_ENDPOINTS.ADMIN_TOPUP, payload);

            if (response.success) {
                setSuccessMessage(t('admin.topup_success') || `Successfully topped up wallet by €${payload.amount}`);
                handleCloseTopupModal();
                fetchTopups(); // Refresh topups list
            } else {
                setError(response.message || t('admin.topup_error'));
            }
        } catch (err) {
            setError(err.message || t('admin.topup_error'));
        } finally {
            setTopUpLoading(false);
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
                    <div className="d-flex gap-2">
                        <button
                            onClick={handleOpenTopupModal}
                            className="btn-custom bg-success text-white"
                        >
                            <i className="bi bi-plus-circle me-1"></i>
                            {t('admin.add_topup')}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>
                            {error}
                            <button type="button" className="btn-close ms-auto" onClick={() => setError(null)}></button>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                        <div>
                            {successMessage}
                            <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage('')}></button>
                        </div>
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

                {/* Top-up Modal */}
                {showTopupModal && (
                    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">{t('admin.topup_modal_title')}</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={handleCloseTopupModal}
                                    ></button>
                                </div>
                                <form onSubmit={handleTopUp}>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">
                                                {t('admin.select_user')}
                                            </label>
                                            {usersLoading ? (
                                                <div className="text-center py-3">
                                                    <div className="spinner-border spinner-border-sm text-primary"></div>
                                                </div>
                                            ) : (
                                                <>
                                                    <input
                                                        type="text"
                                                        className="form-control mb-2"
                                                        placeholder="Ieškoti pagal vardą ar pavardę..."
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                    <select
                                                        className="form-select"
                                                        value={topUpData.user_id}
                                                        onChange={(e) => setTopUpData({ ...topUpData, user_id: e.target.value })}
                                                        required
                                                        size="8"
                                                    >
                                                        <option value="">{t('admin.select_user')}</option>
                                                        {users
                                                            .filter(u => {
                                                                if (!searchTerm) return true;
                                                                const search = searchTerm.toLowerCase();
                                                                return (
                                                                    (u.name && u.name.toLowerCase().includes(search)) ||
                                                                    (u.surname && u.surname.toLowerCase().includes(search))
                                                                );
                                                            })
                                                            .map(u => (
                                                                <option key={u.id} value={u.id}>
                                                                    {u.surname} {u.name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </>
                                            )}
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">
                                                Balance Adjustment (€)
                                            </label>
                                            <div className="input-group">
                                                <span className="input-group-text bg-light text-muted">€</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="form-control"
                                                    value={topUpData.amount}
                                                    onChange={(e) => setTopUpData({ ...topUpData, amount: e.target.value })}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            <div className="form-text text-muted small">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Positive amount adds funds, negative amount deducts funds
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">
                                                {t('admin.description')}
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={topUpData.description}
                                                onChange={(e) => setTopUpData({ ...topUpData, description: e.target.value })}
                                                placeholder="Manual Top-up"
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">
                                                {t('admin.date_optional')}
                                            </label>
                                            <input
                                                type="datetime-local"
                                                className="form-control"
                                                value={topUpData.created_at}
                                                onChange={(e) => setTopUpData({ ...topUpData, created_at: e.target.value })}
                                            />
                                            <div className="form-text text-muted small">
                                                {t('admin.leave_empty_current_time')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-custom bg-light border"
                                            onClick={handleCloseTopupModal}
                                            disabled={topUpLoading}
                                        >
                                            {t('common.cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-custom bg-success text-white"
                                            disabled={topUpLoading}
                                        >
                                            {topUpLoading ? t('common.processing') : t('admin.add_funds')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminTopups;
