import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get } from '../api/config';

function AdminDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState({
        total_users: 0,
        active_groups: 0,
        upcoming_events: 0,
        pending_topups: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await get(API_ENDPOINTS.ADMIN_STATS);
                if (response.success && response.data?.stats) {
                    setStats(response.data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

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
                            <li className="nav-item"><Link className="nav-link active" to="/admin">Dashboard</Link></li>
                            <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
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
                <div className="row mb-4">
                    <div className="col">
                        <h1 className="h3 text-white mb-1">Admin Dashboard</h1>
                        <p className="text-secondary mb-0">Manage users, events, and platform settings.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-md-3">
                        <div className="card bg-primary text-white border-0 h-100">
                            <div className="card-body">
                                <h6 className="opacity-75 mb-1">Total Users</h6>
                                <h2 className="mb-0">
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.total_users}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-success text-white border-0 h-100">
                            <div className="card-body">
                                <h6 className="opacity-75 mb-1">Active Groups</h6>
                                <h2 className="mb-0">
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.active_groups}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-info text-white border-0 h-100">
                            <div className="card-body">
                                <h6 className="opacity-75 mb-1">Upcoming Events</h6>
                                <h2 className="mb-0">
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.upcoming_events}
                                </h2>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="card bg-warning text-dark border-0 h-100">
                            <div className="card-body">
                                <h6 className="opacity-75 mb-1">Pending Top-ups</h6>
                                <h2 className="mb-0">
                                    {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.pending_topups}
                                </h2>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="row g-3">
                    <div className="col-md-6">
                        <div className="card bg-secondary bg-opacity-25 border-secondary text-white h-100">
                            <div className="card-header bg-transparent border-secondary">
                                <h5 className="mb-0 text-white">Quick Actions</h5>
                            </div>
                            <div className="card-body">
                                <div className="d-grid gap-2">
                                    <Link to="/admin/users" className="btn btn-outline-light">Manage Users</Link>
                                    <Link to="/admin/events" className="btn btn-outline-light">Manage Events</Link>
                                    <Link to="/admin/wallet" className="btn btn-outline-warning">Process Top-ups</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="card bg-secondary bg-opacity-25 border-secondary text-white h-100">
                            <div className="card-header bg-transparent border-secondary">
                                <h5 className="mb-0 text-white">Recent Activity</h5>
                            </div>
                            <div className="card-body">
                                <p className="text-secondary mb-0">Activity feed will be displayed here...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
