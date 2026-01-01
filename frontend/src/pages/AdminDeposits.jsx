import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminDeposits() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [deposits, setDeposits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalAmount, setTotalAmount] = useState(0);
    const [activeCount, setActiveCount] = useState(0);
    const [showConfirm, setShowConfirm] = useState(false);
    const [selectedDeposit, setSelectedDeposit] = useState(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        try {
            const response = await get(API_ENDPOINTS.ADMIN_DEPOSITS);
            const depositsList = response.data || response || [];
            setDeposits(depositsList);

            // Calculate totals
            const total = depositsList.reduce((sum, d) => sum + parseFloat(d.amount), 0);
            const active = depositsList.filter(d => d.status === 'active').length;
            setTotalAmount(total);
            setActiveCount(active);
        } catch (err) {
            setError(err.message || 'Failed to fetch deposits');
        } finally {
            setLoading(false);
        }
    };

    const handleRefundClick = (deposit) => {
        setSelectedDeposit(deposit);
        setShowConfirm(true);
    };

    const confirmRefund = async () => {
        if (!selectedDeposit) return;

        setProcessing(true);
        try {
            const response = await post(API_ENDPOINTS.ADMIN_DEPOSIT_REFUND, {
                deposit_id: selectedDeposit.id
            });

            if (response.success) {
                setShowConfirm(false);
                setSelectedDeposit(null);
                // Refresh deposits list
                await fetchDeposits();
            } else {
                alert(response.message || t('admin.refund_failed'));
            }
        } catch (error) {
            console.error('Refund failed:', error);
            alert(t('admin.refund_failed'));
        } finally {
            setProcessing(false);
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

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.deposits_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.deposits_subtitle')}</p>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="dash-card card-wallet">
                            <div className="dash-card-header">
                                <div className="dash-card-title">{t('admin.total_deposits')}</div>
                                <div className="dash-card-icon">💰</div>
                            </div>
                            <div className="dash-card-value">{formatCurrency(totalAmount)}</div>
                            <div className="dash-card-subtitle opacity-75">
                                {deposits.length} {deposits.length === 1 ? t('admin.deposit') : t('admin.deposits')}
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="dash-card card-success">
                            <div className="dash-card-header">
                                <div className="dash-card-title">{t('admin.active_deposits')}</div>
                                <div className="dash-card-icon">✅</div>
                            </div>
                            <div className="dash-card-value">{activeCount}</div>
                            <div className="dash-card-subtitle opacity-75">{t('admin.currently_active')}</div>
                        </div>
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
                        <div className="section-title">{t('admin.all_deposits')}</div>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : deposits.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <i className="bi bi-inbox fs-1 opacity-25"></i>
                                <p className="mt-2">{t('admin.no_deposits')}</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 px-4 py-3">#</th>
                                            <th className="border-0 px-4 py-3">{t('admin.user')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.email')}</th>
                                            <th className="border-0 px-4 py-3">{t('admin.date')}</th>
                                            <th className="border-0 px-4 py-3 text-end">{t('admin.amount')}</th>
                                            <th className="border-0 px-4 py-3 text-center">{t('admin.status')}</th>
                                            <th className="border-0 px-4 py-3 text-center">{t('admin.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deposits.map(deposit => (
                                            <tr key={deposit.id}>
                                                <td className="px-4 text-muted small">#{deposit.id}</td>
                                                <td className="px-4">
                                                    <div className="fw-semibold">{deposit.user_name} {deposit.user_surname}</div>
                                                </td>
                                                <td className="px-4 text-muted small">{deposit.user_email}</td>
                                                <td className="px-4">
                                                    <div>{formatDate(deposit.created_at)}</div>
                                                    {deposit.refunded_at && (
                                                        <div className="small text-muted">
                                                            {t('admin.refunded')}: {formatDate(deposit.refunded_at)}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 fw-bold text-primary text-end">{formatCurrency(deposit.amount)}</td>
                                                <td className="px-4 text-center">
                                                    {deposit.status === 'active' ? (
                                                        <span className="badge bg-success">{t('deposit.status_active')}</span>
                                                    ) : (
                                                        <span className="badge bg-secondary">{t('deposit.status_refunded')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 text-center">
                                                    {deposit.status === 'active' ? (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleRefundClick(deposit)}
                                                        >
                                                            <i className="bi bi-arrow-return-left me-1"></i>
                                                            {t('admin.refund_button')}
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted small">
                                                            {t('admin.refunded_by')}: {deposit.refunded_by_name} {deposit.refunded_by_surname}
                                                        </span>
                                                    )}
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

            {/* Confirmation Modal */}
            {showConfirm && selectedDeposit && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('admin.confirm_refund_title')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>
                                    {t('admin.confirm_refund_message')
                                        .replace('{amount}', formatCurrency(selectedDeposit.amount))
                                        .replace('{user}', `${selectedDeposit.user_name} ${selectedDeposit.user_surname}`)}
                                </p>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowConfirm(false)}
                                    disabled={processing}
                                >
                                    {t('common.no')}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-danger"
                                    onClick={confirmRefund}
                                    disabled={processing}
                                >
                                    {processing ? t('common.loading') : t('common.yes')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDeposits;
