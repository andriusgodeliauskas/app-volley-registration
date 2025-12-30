import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS, get, post } from '../api/config';

function AdminGroups() {
    const { user, logout } = useAuth();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: ''
    });

    // Fetch groups
    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await get(API_ENDPOINTS.GROUPS);
            if (response.success && response.data?.groups) {
                setGroups(response.data.groups);
            }
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            const response = await post(API_ENDPOINTS.GROUPS, newGroup);
            if (response.success) {
                setSuccess('Group created successfully!');
                setShowCreateModal(false);
                setNewGroup({ name: '', description: '' });
                fetchGroups();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to create group');
        } finally {
            setCreating(false);
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
                            <li className="nav-item"><Link className="nav-link" to="/admin/users">Users</Link></li>
                            <li className="nav-item"><Link className="nav-link active" to="/admin/groups">Groups</Link></li>
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
                        <h1 className="h3 text-white mb-1">Groups</h1>
                        <p className="text-secondary mb-0">Manage volleyball groups/clubs</p>
                    </div>
                    <button
                        className="btn btn-warning"
                        onClick={() => setShowCreateModal(true)}
                    >
                        + Create Group
                    </button>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert alert-danger">{error}</div>
                )}
                {success && (
                    <div className="alert alert-success">{success}</div>
                )}

                {/* Groups List */}
                <div className="card bg-secondary bg-opacity-25 border-secondary">
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-warning"></div>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-5 text-white">
                                <h5>No groups yet</h5>
                                <p className="text-secondary">Create your first group to start adding events.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-dark table-hover">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Description</th>
                                            <th>Owner</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groups.map(group => (
                                            <tr key={group.id}>
                                                <td>{group.id}</td>
                                                <td className="fw-semibold">{group.name}</td>
                                                <td className="text-secondary">{group.description || '-'}</td>
                                                <td>{group.owner_name || 'N/A'}</td>
                                                <td>
                                                    <Link
                                                        to={`/admin/events?group=${group.id}`}
                                                        className="btn btn-sm btn-outline-light"
                                                    >
                                                        View Events
                                                    </Link>
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

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Create New Group</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreateGroup}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Group Name *</label>
                                        <input
                                            type="text"
                                            className="form-control bg-secondary border-secondary text-white"
                                            value={newGroup.name}
                                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                            placeholder="e.g., Vilnius Volleyball Club"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control bg-secondary border-secondary text-white"
                                            value={newGroup.description}
                                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                            placeholder="Brief description of the group..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-secondary">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-warning"
                                        disabled={creating}
                                    >
                                        {creating ? 'Creating...' : 'Create Group'}
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

export default AdminGroups;
