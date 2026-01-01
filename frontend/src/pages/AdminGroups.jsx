
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminGroups() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
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
                setSuccess(t('admin.group_create_success'));
                setShowCreateModal(false);
                setNewGroup({ name: '', description: '' });
                fetchGroups();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.message || t('admin.group_create_failed'));
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.groups_title')}</h1>
                        <p className="text-muted mb-0">{t('admin.groups_subtitle')}</p>
                    </div>
                    <div className="d-flex gap-2">
                        <Link to="/admin" className="btn-custom bg-light border">{t('common.back')}</Link>
                        <button
                            className="btn-custom bg-warning text-dark border-warning"
                            onClick={() => setShowCreateModal(true)}
                        >
                            <i className="bi bi-plus-lg me-1"></i> {t('admin.create_group')}
                        </button>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                )}
                {success && (
                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                        <div>{success}</div>
                    </div>
                )}

                {/* Groups List */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">All Groups</div>
                    </div>
                    <div className="p-0">
                        {loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary"></div>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <h5>No groups yet</h5>
                                <p className="mb-0">Create your first group to start adding events.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 px-4 py-3">ID</th>
                                            <th className="border-0 px-4 py-3">Name</th>
                                            <th className="border-0 px-4 py-3">Description</th>
                                            <th className="border-0 px-4 py-3">Owner</th>
                                            <th className="border-0 px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groups.map(group => (
                                            <tr key={group.id}>
                                                <td className="px-4">{group.id}</td>
                                                <td className="px-4 fw-semibold">{group.name}</td>
                                                <td className="px-4 text-muted small">{group.description || '-'}</td>
                                                <td className="px-4">{group.owner_name || 'N/A'}</td>
                                                <td className="px-4">
                                                    <Link
                                                        to={`/ admin / events ? group = ${group.id} `}
                                                        className="btn-custom btn-sm bg-light border"
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
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">Create New Group</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <form onSubmit={handleCreateGroup}>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Group Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newGroup.name}
                                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                            placeholder="e.g., Vilnius Volleyball Club"
                                            required
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">Description</label>
                                        <textarea
                                            className="form-control"
                                            value={newGroup.description}
                                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                            placeholder="Brief description of the group..."
                                            rows="3"
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn-custom bg-light border"
                                        onClick={() => setShowCreateModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-custom bg-warning text-dark border-warning"
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
