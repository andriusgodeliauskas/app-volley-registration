import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

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
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                {/* Admin Header & Nav */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">Admin Dashboard</h1>
                        <p className="text-muted mb-0">Manage users, events, and platform settings.</p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Link to="/admin/users" className="btn-custom bg-white border">Users</Link>
                        <Link to="/admin/groups" className="btn-custom bg-white border">Groups</Link>
                        <Link to="/admin/events" className="btn-custom bg-white border">Events</Link>
                        <Link to="/admin/wallet" className="btn-custom bg-white border">Wallet</Link>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="dashboard-cards mb-4">
                    <div className="dash-card bg-primary text-white">
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">Total Users</div>
                            <div className="dash-card-icon text-white">👥</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.total_users}
                        </div>
                    </div>
                    <div className="dash-card bg-success text-white">
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">Active Groups</div>
                            <div className="dash-card-icon text-white">🏘️</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.active_groups}
                        </div>
                    </div>
                    <div className="dash-card bg-info text-white">
                        <div className="dash-card-header text-white-50">
                            <div className="dash-card-title text-white">Upcoming Events</div>
                            <div className="dash-card-icon text-white">📅</div>
                        </div>
                        <div className="dash-card-value text-white">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.upcoming_events}
                        </div>
                    </div>
                    <div className="dash-card bg-warning text-dark">
                        <div className="dash-card-header text-black-50">
                            <div className="dash-card-title text-dark">Pending Top-ups</div>
                            <div className="dash-card-icon text-dark">💳</div>
                        </div>
                        <div className="dash-card-value text-dark">
                            {loading ? <span className="spinner-border spinner-border-sm"></span> : stats.pending_topups}
                        </div>
                    </div>
                </div>

                {/* Admin Actions */}
                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">⚡ Quick Actions</div>
                            </div>
                            <div className="d-grid gap-2">
                                <div className="d-flex gap-2">
                                    <Link to="/admin/users" className="btn-custom flex-grow-1 text-center bg-light">Manage Users</Link>
                                    <Link to="/admin/events" className="btn-custom flex-grow-1 text-center bg-light">Manage Events</Link>
                                </div>
                                <Link to="/admin/wallet" className="btn-custom text-center bg-warning bg-opacity-10 text-warning border-warning border-opacity-25">
                                    Process Top-ups
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className="section h-100">
                            <div className="section-header">
                                <div className="section-title">📊 Recent Activity</div>
                            </div>
                            <div className="text-muted small">
                                Activity feed will be displayed here...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
