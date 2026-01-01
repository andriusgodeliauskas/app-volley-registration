
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { API_ENDPOINTS, get, post, put } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminGroups() {
    const { user, logout } = useAuth();
    const { t } = useLanguage();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Form state
    const [newGroup, setNewGroup] = useState({
        name: '',
        description: ''
    });

    const [editingGroup, setEditingGroup] = useState(null);

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

    const handleEditClick = (group) => {
        setEditingGroup({
            id: group.id,
            name: group.name,
            max_depositors: group.max_depositors !== null ? group.max_depositors : ''
        });
        setShowEditModal(true);
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        setUpdating(true);
        setError('');

        try {
            const maxDepositors = editingGroup.max_depositors === '' ? null : parseInt(editingGroup.max_depositors, 10);

            const response = await put(API_ENDPOINTS.GROUPS, {
                group_id: editingGroup.id,
                max_depositors: maxDepositors
            });

            if (response.success) {
                setSuccess('Group updated successfully!');
                setShowEditModal(false);
                setEditingGroup(null);
                fetchGroups();
                setTimeout(() => setSuccess(''), 3000);
            }
        } catch (err) {
            setError(err.message || 'Failed to update group');
        } finally {
            setUpdating(false);
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
                        <div className="d-flex flex-column gap-3">
                            {groups.map(group => (
                                <div key={group.id} className="event-card">
                                    <div className="event-icon">
                                        🏐
                                    </div>
                                    <div className="event-info">
                                        <div className="event-title">
                                            {group.name}
                                        </div>
                                        <div className="event-details">
                                            <div className="event-detail">📝 {group.description || '-'}</div>
                                            <div className="event-detail">👤 {group.owner_name || 'N/A'}</div>
                                            <div className="event-detail">
                                                💰 Max Depositors: {group.max_depositors !== null ? group.max_depositors : 'Unlimited'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="event-actions">
                                        {user?.role === 'super_admin' && (
                                            <button
                                                className="btn-custom bg-primary text-white me-2"
                                                onClick={() => handleEditClick(group)}
                                            >
                                                <i className="bi bi-pencil me-1"></i> Edit Limit
                                            </button>
                                        )}
                                        <Link
                                            to={`/admin/events?group=${group.id}`}
                                            className="btn-custom"
                                        >
                                            View Events
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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

            {/* Edit Max Depositors Modal */}
            {showEditModal && editingGroup && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow rounded-4">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title">Edit Max Depositors Limit</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <form onSubmit={handleUpdateGroup}>
                                <div className="modal-body">
                                    <p className="text-muted small mb-3">
                                        Group: <strong>{editingGroup.name}</strong>
                                    </p>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small fw-bold text-uppercase">
                                            Max Depositors (leave empty for unlimited)
                                        </label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={editingGroup.max_depositors}
                                            onChange={(e) => setEditingGroup({ ...editingGroup, max_depositors: e.target.value })}
                                            placeholder="e.g., 50 (or leave empty)"
                                            min="0"
                                        />
                                        <div className="form-text">
                                            This limits how many users can have active deposits in this group.
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer border-0 pt-0">
                                    <button
                                        type="button"
                                        className="btn-custom bg-light border"
                                        onClick={() => setShowEditModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-custom bg-primary text-white"
                                        disabled={updating}
                                    >
                                        {updating ? 'Updating...' : 'Update Limit'}
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
