import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminUserEdit() {
    const { id } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        email: '',
        role: 'user',
        balance: 0,
        is_active: true,
        group_ids: []
    });

    const [topUpData, setTopUpData] = useState({ amount: '', description: '', created_at: '' });
    const [topUpLoading, setTopUpLoading] = useState(false);

    const [userTransactions, setUserTransactions] = useState([]);
    const [editingTx, setEditingTx] = useState(null);
    const [editTxData, setEditTxData] = useState({ amount: '', description: '', created_at: '' });

    const [allGroups, setAllGroups] = useState([]);

    useEffect(() => {
        if (id) {
            fetchUserDetails();
            fetchTransactions();
            fetchGroups();
        }
    }, [id]);

    const fetchGroups = async () => {
        try {
            const response = await get(API_ENDPOINTS.GROUPS);
            if (response.success && response.data?.groups) {
                setAllGroups(response.data.groups);
            }
        } catch (error) {
            console.error('Failed to fetch groups:', error);
        }
    };

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const response = await get(`${API_ENDPOINTS.ADMIN_USER_DETAILS}?user_id=${id}`);
            if (response.success && response.data?.user) {
                setFormData({
                    name: response.data.user.name,
                    surname: response.data.user.surname || '',
                    email: response.data.user.email,
                    role: response.data.user.role,
                    balance: response.data.user.balance,
                    is_active: response.data.user.is_active,
                    group_ids: response.data.user.group_ids || []
                });
            } else {
                setError(response.message || 'Failed to load user details');
            }
        } catch (err) {
            console.error('Fetch error:', err);
            setError('An error occurred while loading user data.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMessage('');

        try {
            const payload = {
                user_id: id,
                ...formData,
                balance: parseFloat(formData.balance)
            };

            const response = await post(API_ENDPOINTS.ADMIN_USER_UPDATE, payload);

            if (response.success) {
                setSuccessMessage('User updated successfully!');
            } else {
                setError(response.message || 'Failed to update user');
            }
        } catch (err) {
            setError(err.message || 'An error occurred while updating.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleTopUp = async (e) => {
        e.preventDefault();
        setTopUpLoading(true);
        setError(null);
        setSuccessMessage('');

        try {
            const payload = {
                user_id: id,
                amount: parseFloat(topUpData.amount),
                description: topUpData.description,
                created_at: topUpData.created_at
            };

            const response = await post(API_ENDPOINTS.ADMIN_TOPUP, payload);

            if (response.success) {
                const message = payload.amount > 0
                    ? `Successfully added €${payload.amount} to wallet`
                    : `Successfully deducted €${Math.abs(payload.amount)} from wallet`;
                setSuccessMessage(message);
                setTopUpData({ amount: '', description: '', created_at: '' });
                fetchUserDetails(); // Refresh balance
                fetchTransactions(); // Refresh transaction history
            } else {
                setError(response.message || 'Failed to adjust balance');
            }
        } catch (err) {
            setError(err.message || 'An error occurred during top up.');
        } finally {
            setTopUpLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await get(`${API_ENDPOINTS.ADMIN_USER_TRANSACTIONS}?user_id=${id}`);
            if (response.success && response.data?.transactions) {
                setUserTransactions(response.data.transactions);
            }
        } catch (error) {
            console.error('Failed to fetch transactions:', error);
        }
    };

    const startEditingTx = (tx) => {
        setEditingTx(tx.id);
        setEditTxData({
            amount: tx.amount,
            description: tx.description,
            created_at: tx.created_at
        });
    };

    const cancelEditTx = () => {
        setEditingTx(null);
        setEditTxData({ amount: '', description: '', created_at: '' });
    };

    const handleUpdateTransaction = async (txId) => {
        if (!window.confirm('Updating this transaction will modify the user balance accordingly. Continue?')) {
            return;
        }

        try {
            const payload = {
                transaction_id: txId,
                ...editTxData
            };
            const response = await post(API_ENDPOINTS.ADMIN_TRANSACTION_UPDATE, payload);

            if (response.success) {
                setSuccessMessage('Transaction updated successfully');
                setEditingTx(null);
                fetchTransactions();
                fetchUserDetails(); // Update balance display
            } else {
                setError(response.message || 'Failed to update transaction');
            }
        } catch (err) {
            setError(err.message || 'Error updating transaction');
        }
    };


    if (loading) {
        return (
            <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
                <div className="spinner-border text-warning" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 fw-bold mb-1">Edit User</h1>
                        <p className="text-muted mb-0">Manage user details and wallet</p>
                    </div>
                    <Link to="/admin/users" className="btn-custom bg-light border">
                        <i className="bi bi-arrow-left me-1"></i> Back to Users
                    </Link>
                </div>

                <div className="row g-4">
                    <div className="col-lg-8">
                        {/* User Details Form */}
                        <div className="section mb-4">
                            <div className="section-header">
                                <div className="section-title">User Information</div>
                            </div>
                            <div className="p-4">
                                {successMessage && (
                                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                                        <div>
                                            {successMessage}
                                            <button type="button" className="btn-close ms-auto" onClick={() => setSuccessMessage('')}></button>
                                        </div>
                                    </div>
                                )}
                                {error && (
                                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                                        <div>
                                            {error}
                                            <button type="button" className="btn-close ms-auto" onClick={() => setError(null)}></button>
                                        </div>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            minLength="2"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Surname</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="surname"
                                            value={formData.surname}
                                            onChange={handleChange}
                                            required
                                            minLength="2"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Role</label>
                                            <select
                                                className="form-select"
                                                name="role"
                                                value={formData.role}
                                                onChange={handleChange}
                                            >
                                                <option value="user">User</option>
                                                <option value="group_admin">Group Admin</option>
                                                {user?.role === 'super_admin' && (
                                                    <option value="super_admin">Super Admin</option>
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-muted small fw-bold text-uppercase">Balance (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control"
                                                name="balance"
                                                value={formData.balance}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                id="activeSwitch"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="activeSwitch">
                                                Active Account {formData.is_active ? '(Can login)' : '(Access denied)'}
                                            </label>
                                        </div>
                                        {!formData.is_active && (
                                            <div className="form-text text-warning">
                                                <i className="bi bi-exclamation-triangle me-1"></i>
                                                Inactive users cannot log in. Newly registered users are inactive by default.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Assign Groups</label>
                                        <div className="card p-3 bg-light border-0">
                                            {allGroups.length === 0 ? (
                                                <div className="text-muted small">No groups available.</div>
                                            ) : (
                                                <div className="row g-2">
                                                    {allGroups.map(group => (
                                                        <div className="col-md-6" key={group.id}>
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`group-${group.id}`}
                                                                    checked={formData.group_ids?.includes(group.id)}
                                                                    onChange={(e) => {
                                                                        const checked = e.target.checked;
                                                                        const currentGroups = formData.group_ids || [];
                                                                        if (checked) {
                                                                            setFormData({ ...formData, group_ids: [...currentGroups, group.id] });
                                                                        } else {
                                                                            setFormData({ ...formData, group_ids: currentGroups.filter(id => id !== group.id) });
                                                                        }
                                                                    }}
                                                                />
                                                                <label className="form-check-label" htmlFor={`group-${group.id}`}>
                                                                    {group.name}
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-end gap-2">
                                        <Link to="/admin/users" className="btn-custom bg-light border">Cancel</Link>
                                        <button type="submit" className="btn-custom bg-warning text-dark border-warning" disabled={submitting}>
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Transaction History Row */}
                        <div className="section">
                            <div className="section-header d-flex justify-content-between align-items-center">
                                <div className="section-title">
                                    <i className="bi bi-clock-history me-2"></i> Transaction History
                                </div>
                                <button className="btn btn-sm btn-outline-secondary" onClick={fetchTransactions}>
                                    <i className="bi bi-arrow-clockwise"></i> Refresh
                                </button>
                            </div>
                            <div className="p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light">
                                            <tr>
                                                <th className="border-0 px-4 py-3">Date</th>
                                                <th className="border-0 px-4 py-3">Type</th>
                                                <th className="border-0 px-4 py-3">Description</th>
                                                <th className="border-0 px-4 py-3">Created By</th>
                                                <th className="border-0 px-4 py-3 text-end">Amount</th>
                                                <th className="border-0 px-4 py-3 text-end">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userTransactions.map(tx => (
                                                <tr key={tx.id}>
                                                    {editingTx === tx.id ? (
                                                        <>
                                                            <td className="px-4">
                                                                <input
                                                                    type="datetime-local"
                                                                    className="form-control form-control-sm"
                                                                    value={editTxData.created_at}
                                                                    onChange={e => setEditTxData({ ...editTxData, created_at: e.target.value })}
                                                                />
                                                            </td>
                                                            <td className="px-4 text-capitalize">{tx.type}</td>
                                                            <td className="px-4">
                                                                <input
                                                                    type="text"
                                                                    className="form-control form-control-sm"
                                                                    value={editTxData.description}
                                                                    onChange={e => setEditTxData({ ...editTxData, description: e.target.value })}
                                                                />
                                                            </td>
                                                            <td className="px-4 text-muted small">{tx.created_by_name || '-'}</td>
                                                            <td className="px-4">
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    className="form-control form-control-sm text-end"
                                                                    value={editTxData.amount}
                                                                    onChange={e => setEditTxData({ ...editTxData, amount: e.target.value })}
                                                                />
                                                            </td>
                                                            <td className="px-4 text-end">
                                                                <button className="btn btn-sm btn-success me-1" onClick={() => handleUpdateTransaction(tx.id)}>
                                                                    <i className="bi bi-check"></i>
                                                                </button>
                                                                <button className="btn btn-sm btn-outline-secondary" onClick={cancelEditTx}>
                                                                    <i className="bi bi-x"></i>
                                                                </button>
                                                            </td>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <td className="px-4">{new Date(tx.created_at).toLocaleString('en-GB')}</td>
                                                            <td className="px-4">
                                                                <span className={`badge rounded-pill ${tx.type === 'topup' ? 'bg-success' : 'bg-primary'}`}>
                                                                    {tx.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-4">{tx.description}</td>
                                                            <td className="px-4 text-muted small">{tx.created_by_name || '-'}</td>
                                                            <td className={`px-4 text-end fw-bold ${parseFloat(tx.amount) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                                €{parseFloat(tx.amount).toFixed(2)}
                                                            </td>
                                                            <td className="px-4 text-end">
                                                                {user?.role === 'super_admin' && (
                                                                    <button className="btn btn-custom btn-sm bg-light border" onClick={() => startEditingTx(tx)}>
                                                                        <i className="bi bi-pencil"></i>
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            ))}
                                            {userTransactions.length === 0 && (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-5 text-muted">No transactions found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Management Card */}
                    <div className="col-lg-4">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">
                                    <i className="bi bi-wallet2 me-2"></i> Wallet Management
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="mb-4 text-center p-4 bg-light rounded border">
                                    <small className="text-muted text-uppercase d-block mb-1 fw-bold">Current Balance</small>
                                    <h2 className={`display-6 fw-bold mb-0 ${formData.balance < 0 ? 'text-danger' : 'text-success'}`}>
                                        €{parseFloat(formData.balance).toFixed(2)}
                                    </h2>
                                </div>

                                <form onSubmit={handleTopUp}>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Balance Adjustment (€)</label>
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
                                        <label className="form-label text-muted small fw-bold text-uppercase">Date (Optional)</label>
                                        <input
                                            type="datetime-local"
                                            className="form-control"
                                            value={topUpData.created_at}
                                            onChange={(e) => setTopUpData({ ...topUpData, created_at: e.target.value })}
                                        />
                                        <div className="form-text text-muted small">Leave empty for current time</div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Description</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={topUpData.description}
                                            onChange={(e) => setTopUpData({ ...topUpData, description: e.target.value })}
                                            placeholder="Manual Top-up"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn-custom bg-success text-white w-100"
                                        disabled={topUpLoading}
                                    >
                                        {topUpLoading ? 'Processing...' : 'Adjust Balance'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}

export default AdminUserEdit;
