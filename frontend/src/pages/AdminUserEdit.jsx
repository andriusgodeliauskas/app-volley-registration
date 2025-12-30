import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post } from '../api/config';

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
        email: '',
        role: 'user',
        balance: 0,
        is_active: true
    });

    useEffect(() => {
        if (id) {
            fetchUserDetails();
        }
    }, [id]);

    const fetchUserDetails = async () => {
        setLoading(true);
        try {
            const response = await get(`${API_ENDPOINTS.ADMIN_USER_DETAILS}?user_id=${id}`);
            if (response.success && response.data?.user) {
                setFormData({
                    name: response.data.user.name,
                    email: response.data.user.email,
                    role: response.data.user.role,
                    balance: response.data.user.balance,
                    is_active: response.data.user.is_active
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
        <div className="min-vh-100 bg-dark">
            {/* Admin Navbar */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark border-bottom border-secondary">
                <div className="container-fluid px-4">
                    <Link className="navbar-brand fw-bold text-warning" to="/admin">⚡ Volley Admin</Link>
                    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#adminNav">
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="adminNav">
                        <ul className="navbar-nav me-auto">
                            <li className="nav-item"><Link className="nav-link" to="/admin">Dashboard</Link></li>
                            <li className="nav-item"><Link className="nav-link active" to="/admin/users">Users</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/groups">Groups</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/events">Events</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/wallet">Wallet</Link></li>
                        </ul>
                        <div className="d-flex align-items-center">
                            <span className="badge bg-warning text-dark me-3">{user?.role?.replace('_', ' ').toUpperCase()}</span>
                            <div className="dropdown">
                                <button className="btn btn-outline-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown">{user?.name}</button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    <li><Link className="dropdown-item" to="/dashboard">User View</Link></li>
                                    <li><hr className="dropdown-divider" /></li>
                                    <li><button className="dropdown-item text-danger" onClick={logout}>Logout</button></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="container px-4 py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h1 className="h3 text-white mb-0">Edit User</h1>
                    <Link to="/admin/users" className="btn btn-outline-light btn-sm">
                        <i className="bi bi-arrow-left me-1"></i> Back to Users
                    </Link>
                </div>

                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="card bg-secondary bg-opacity-25 border-secondary">
                            <div className="card-body p-4">
                                {successMessage && (
                                    <div className="alert alert-success alert-dismissible fade show">
                                        {successMessage}
                                        <button type="button" className="btn-close" onClick={() => setSuccessMessage('')}></button>
                                    </div>
                                )}
                                {error && (
                                    <div className="alert alert-danger alert-dismissible fade show">
                                        {error}
                                        <button type="button" className="btn-close" onClick={() => setError(null)}></button>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-3">
                                        <label className="form-label text-light">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control bg-dark text-white border-secondary"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            minLength="2"
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label text-light">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control bg-dark text-white border-secondary"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6 mb-3">
                                            <label className="form-label text-light">Role</label>
                                            <select
                                                className="form-select bg-dark text-white border-secondary"
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
                                            <label className="form-label text-light">Balance (€)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                className="form-control bg-dark text-white border-secondary"
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
                                            <label className="form-check-label text-light" htmlFor="activeSwitch">
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

                                    <div className="d-flex justify-content-end gap-2">
                                        <Link to="/admin/users" className="btn btn-outline-light">Cancel</Link>
                                        <button type="submit" className="btn btn-warning px-4" disabled={submitting}>
                                            {submitting ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminUserEdit;
