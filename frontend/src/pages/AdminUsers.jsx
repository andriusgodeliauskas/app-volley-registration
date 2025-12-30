import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get } from '../api/config';

function AdminUsers() {
    const { user, logout } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch users
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await get(API_ENDPOINTS.USERS);
            if (response.success && response.data?.users) {
                setUsers(response.data.users);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

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

            {/* Main Content */}
            <div className="container-fluid px-4 py-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1 className="h3 text-white mb-1">Users</h1>
                        <p className="text-secondary mb-0">Manage platform users and administrators</p>
                    </div>
                    {/* Placeholder for Add User button or other actions */}
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}

                {/* Users List */}
                <div className="card bg-secondary bg-opacity-25 border-secondary">
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-warning"></div>
                            </div>
                        ) : users.length === 0 ? (
                            <div className="text-center py-5 text-white">
                                <h5>No users found</h5>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-dark table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Balance</th>
                                            <th>Status</th>
                                            <th>Joined</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u.id}>
                                                <td>{u.id}</td>
                                                <td className="fw-semibold">{u.name}</td>
                                                <td>{u.email}</td>
                                                <td>
                                                    <span className={`badge ${u.role === 'super_admin' ? 'bg-danger' :
                                                            u.role === 'group_admin' ? 'bg-info' : 'bg-secondary'
                                                        }`}>
                                                        {u.role.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className={u.balance < 0 ? 'text-danger' : 'text-success'}>
                                                    €{u.balance.toFixed(2)}
                                                </td>
                                                <td>
                                                    {u.is_active ?
                                                        <span className="badge bg-success">Active</span> :
                                                        <span className="badge bg-danger">Inactive</span>
                                                    }
                                                </td>
                                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    <button className="btn btn-sm btn-outline-light me-2">Edit</button>
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
        </div>
    );
}

export default AdminUsers;
