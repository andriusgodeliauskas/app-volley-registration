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
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [newDeposit, setNewDeposit] = useState({
        user_id: '',
        amount: '50.00',
        deposit_date: ''
    });

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

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await get(API_ENDPOINTS.USERS);
            const usersList = response.data?.users || response?.users || [];
            setUsers(usersList);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoadingUsers(false);
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

    const handleCreateClick = () => {
        fetchUsers();
        setShowCreateModal(true);
        setSearchTerm('');
    };

    const handleCreateDeposit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        try {
            const payload = {
                user_id: parseInt(newDeposit.user_id),
                amount: parseFloat(newDeposit.amount)
            };

            if (newDeposit.deposit_date) {
                payload.deposit_date = newDeposit.deposit_date;
            }

            const response = await post(API_ENDPOINTS.ADMIN_DEPOSIT_CREATE, payload);

            if (response.success) {
                alert('✅ Deposit created successfully for ' + response.user_name);
                setShowCreateModal(false);
                setNewDeposit({ user_id: '', amount: '50.00', deposit_date: '' });
                setSearchTerm('');
                await fetchDeposits();
            } else {
                alert('❌ Error: ' + (response.message || 'Failed to create deposit'));
            }
        } catch (error) {
            console.error('Create deposit failed:', error);
            const errorMsg = error.message || error.error || 'Failed to create deposit';
            alert('❌ Error: ' + errorMsg);
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
                    <button
                        className="btn btn-primary"
                        onClick={handleCreateClick}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Create Deposit
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="dash-card card-primary">
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
                        <div className="dash-card card-primary">
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
                            <>
                                {/* Desktop Table View */}
                                <div className="table-responsive d-none d-md-block">
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

                                {/* Mobile Block View */}
                                <div className="d-md-none">
                                    {deposits.map((deposit) => (
                                        <div key={deposit.id} className="border rounded-3 p-3 mb-3" style={{ backgroundColor: '#f8f9fa' }}>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <span className="text-muted small">#{deposit.id}</span>
                                                <span className="fw-bold fs-5 text-primary">
                                                    {formatCurrency(deposit.amount)}
                                                </span>
                                            </div>
                                            <div className="fw-semibold text-dark mb-1">
                                                {deposit.user_name} {deposit.user_surname}
                                            </div>
                                            <div className="text-muted small mb-2">
                                                {deposit.user_email}
                                            </div>
                                            <div className="text-muted small mb-2">
                                                {formatDate(deposit.created_at)}
                                            </div>
                                            {deposit.refunded_at && (
                                                <div className="text-muted small mb-2">
                                                    {t('admin.refunded')}: {formatDate(deposit.refunded_at)}
                                                </div>
                                            )}
                                            <div className="d-flex justify-content-between align-items-center mt-2">
                                                {deposit.status === 'active' ? (
                                                    <>
                                                        <span className="badge bg-success">{t('deposit.status_active')}</span>
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleRefundClick(deposit)}
                                                        >
                                                            <i className="bi bi-arrow-return-left me-1"></i>
                                                            {t('admin.refund_button')}
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="badge bg-secondary">{t('deposit.status_refunded')}</span>
                                                        <span className="text-muted small">
                                                            {deposit.refunded_by_name} {deposit.refunded_by_surname}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Refund Confirmation Modal */}
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

            {/* Create Deposit Modal */}
            {showCreateModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create Manual Deposit</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={processing}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateDeposit}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">User *</label>
                                        {loadingUsers ? (
                                            <div className="text-center py-2">
                                                <div className="spinner-border spinner-border-sm"></div>
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
                                                    value={newDeposit.user_id}
                                                    onChange={(e) => setNewDeposit({ ...newDeposit, user_id: e.target.value })}
                                                    required
                                                    size="8"
                                                >
                                                    <option value="">Select user...</option>
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
                                        <label className="form-label">Amount (EUR) *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={newDeposit.amount}
                                            onChange={(e) => setNewDeposit({ ...newDeposit, amount: e.target.value })}
                                            step="0.01"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Deposit Date (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={newDeposit.deposit_date}
                                            onChange={(e) => setNewDeposit({ ...newDeposit, deposit_date: e.target.value })}
                                        />
                                        <div className="form-text">
                                            Leave empty to use current date/time
                                        </div>
                                    </div>
                                    <div className="alert alert-warning">
                                        <i className="bi bi-exclamation-triangle me-2"></i>
                                        This will deduct the amount from the user's balance and create a deposit record. The user will see this deposit in their deposit history.
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={processing}
                                    >
                                        {processing ? 'Creating...' : 'Create Deposit'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminDeposits;
