import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { get, post, del } from '../api/config';
import AdminNavbar from '../components/AdminNavbar';

function AdminFamilyRelationships() {
    const { user } = useAuth();
    const { t } = useLanguage();

    // Permissions state
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [perPage] = useState(20);

    // Filter state
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Create permission modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedRequester, setSelectedRequester] = useState('');
    const [selectedTarget, setSelectedTarget] = useState('');
    const [creating, setCreating] = useState(false);

    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [permissionToDelete, setPermissionToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    // Fetch permissions on mount and when filters change
    useEffect(() => {
        fetchPermissions();
    }, [currentPage, statusFilter, searchQuery]);

    const fetchPermissions = async () => {
        setLoading(true);
        setError('');

        try {
            const params = new URLSearchParams({
                page: currentPage,
                limit: perPage,
                status: statusFilter,
                search: searchQuery
            });

            const response = await get(`/api/admin_family_permissions.php?${params}`);

            if (response.success && response.data) {
                setPermissions(response.data.permissions || []);

                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.total_pages);
                    setTotalCount(response.data.pagination.total);
                }
            } else {
                setError(response.message || t('admin.failed_load_permissions'));
            }
        } catch (err) {
            console.error('Failed to fetch family permissions:', err);
            setError(err.message || t('admin.failed_load_permissions'));
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await get('/api/users.php');
            if (response.success && response.data?.users) {
                // Filter only active users
                const activeUsers = response.data.users.filter(u => u.is_active);
                setUsers(activeUsers);
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleCreateClick = () => {
        fetchUsers();
        setShowCreateModal(true);
        setSelectedRequester('');
        setSelectedTarget('');
    };

    const handleCreatePermission = async (e) => {
        e.preventDefault();

        if (!selectedRequester || !selectedTarget) {
            setError(t('admin.select_both_users'));
            return;
        }

        if (selectedRequester === selectedTarget) {
            setError(t('admin.cannot_same_user'));
            return;
        }

        setCreating(true);
        setError('');

        try {
            const response = await post('/api/admin_family_permissions.php', {
                requester_id: parseInt(selectedRequester),
                target_id: parseInt(selectedTarget)
            });

            if (response.success) {
                setSuccessMessage(t('admin.permission_created'));
                setShowCreateModal(false);
                setSelectedRequester('');
                setSelectedTarget('');
                await fetchPermissions();

                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                setError(response.message || t('admin.failed_create_permission'));
            }
        } catch (err) {
            console.error('Failed to create permission:', err);
            setError(err.message || t('admin.failed_create_permission'));
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteClick = (permission) => {
        setPermissionToDelete(permission);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!permissionToDelete) return;

        setDeleting(true);
        setError('');

        try {
            const response = await del(`/api/admin_family_permissions.php?permission_id=${permissionToDelete.id}`);

            if (response.success) {
                setSuccessMessage(t('admin.permission_removed'));
                setShowDeleteConfirm(false);
                setPermissionToDelete(null);
                await fetchPermissions();

                // Clear success message after 5 seconds
                setTimeout(() => setSuccessMessage(''), 5000);
            } else {
                setError(response.message || t('admin.failed_delete_permission'));
            }
        } catch (err) {
            console.error('Failed to delete permission:', err);
            setError(err.message || t('admin.failed_delete_permission'));
        } finally {
            setDeleting(false);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1); // Reset to first page
    };

    const handleSearchChange = (query) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'pending':
                return 'bg-warning text-dark';
            case 'accepted':
                return 'bg-success text-white';
            case 'rejected':
                return 'bg-danger text-white';
            case 'canceled':
                return 'bg-secondary text-white';
            default:
                return 'bg-secondary text-white';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleString('lt-LT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Only super admin can access this page
    if (user?.role !== 'super_admin') {
        return (
            <div className="min-vh-100">
                <AdminNavbar />
                <div className="main-container">
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{t('admin.access_denied')}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100">
            <AdminNavbar />

            <div className="main-container">
                {/* Header */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-start mb-4 gap-3">
                    <div>
                        <h1 className="h3 fw-bold mb-1">{t('admin.family_relationships')}</h1>
                        <p className="text-muted mb-0">{t('admin.family_relationships_subtitle')}</p>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            onClick={handleCreateClick}
                            className="btn-custom bg-primary text-white"
                        >
                            <i className="bi bi-plus-lg me-1"></i>
                            {t('admin.create_permission')}
                        </button>
                        <Link to="/admin" className="btn-custom bg-light border">
                            {t('common.back')}
                        </Link>
                    </div>
                </div>

                {/* Alerts */}
                {error && (
                    <div className="alert-custom bg-danger bg-opacity-10 border-danger text-danger mb-4">
                        <i className="bi bi-exclamation-triangle-fill alert-custom-icon"></i>
                        <div>{error}</div>
                    </div>
                )}

                {successMessage && (
                    <div className="alert-custom bg-success bg-opacity-10 border-success text-success mb-4">
                        <i className="bi bi-check-circle-fill alert-custom-icon"></i>
                        <div>{successMessage}</div>
                    </div>
                )}

                {/* Filters */}
                <div className="section mb-4">
                    <div className="section-body">
                        <div className="row g-3">
                            <div className="col-12 col-md-4">
                                <label className="form-label small fw-bold text-muted">
                                    {t('admin.status_filter')}
                                </label>
                                <select
                                    className="form-select"
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                                >
                                    <option value="all">{t('admin.filter_all')}</option>
                                    <option value="pending">{t('admin.status_pending')}</option>
                                    <option value="accepted">{t('admin.status_accepted')}</option>
                                    <option value="rejected">{t('admin.status_rejected')}</option>
                                    <option value="canceled">{t('admin.status_canceled')}</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-8">
                                <label className="form-label small fw-bold text-muted">
                                    {t('admin.search')}
                                </label>
                                <div className="input-group">
                                    <span className="input-group-text bg-light border-end-0">
                                        <i className="bi bi-search text-muted"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control border-start-0"
                                        placeholder={t('admin.search_by_name_email')}
                                        value={searchQuery}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            className="btn btn-light border border-start-0"
                                            type="button"
                                            onClick={() => handleSearchChange('')}
                                        >
                                            <i className="bi bi-x-lg"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Permissions Table */}
                <div className="section">
                    <div className="section-header">
                        <div className="section-title">
                            {t('admin.all_permissions')}
                            {totalCount > 0 && (
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 ms-2">
                                    {totalCount}
                                </span>
                            )}
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary"></div>
                        </div>
                    ) : permissions.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <i className="bi bi-inbox fs-1 d-block mb-3"></i>
                            <h5>{t('admin.no_permissions')}</h5>
                            {searchQuery && (
                                <p className="mb-0">{t('admin.no_search_results_hint')}</p>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ width: '5%' }}>#</th>
                                            <th style={{ width: '22%' }}>{t('admin.requester')}</th>
                                            <th style={{ width: '22%' }}>{t('admin.target')}</th>
                                            <th style={{ width: '10%' }}>{t('admin.status')}</th>
                                            <th style={{ width: '15%' }}>{t('admin.requested_at')}</th>
                                            <th style={{ width: '15%' }}>{t('admin.responded_at')}</th>
                                            <th style={{ width: '11%' }} className="text-center">{t('admin.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {permissions.map((permission, index) => (
                                            <tr key={permission.id}>
                                                <td className="text-muted">
                                                    {(currentPage - 1) * perPage + index + 1}
                                                </td>
                                                <td>
                                                    <div className="fw-semibold">{permission.requester.name}</div>
                                                    <small className="text-muted">{permission.requester.email}</small>
                                                </td>
                                                <td>
                                                    <div className="fw-semibold">{permission.target.name}</div>
                                                    <small className="text-muted">{permission.target.email}</small>
                                                </td>
                                                <td>
                                                    <span className={`badge ${getStatusBadgeClass(permission.status)}`}>
                                                        {t(`admin.status_${permission.status}`)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <small>{formatDate(permission.requested_at)}</small>
                                                </td>
                                                <td>
                                                    <small>{formatDate(permission.responded_at)}</small>
                                                </td>
                                                <td className="text-center">
                                                    {permission.status !== 'canceled' && (
                                                        <button
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={() => handleDeleteClick(permission)}
                                                            title={t('admin.delete_permission')}
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                                    <div className="text-muted small">
                                        {t('admin.showing_results')
                                            .replace('{start}', (currentPage - 1) * perPage + 1)
                                            .replace('{end}', Math.min(currentPage * perPage, totalCount))
                                            .replace('{total}', totalCount)}
                                    </div>
                                    <div className="d-flex gap-2">
                                        <button
                                            className="btn-custom bg-light border"
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                            {t('admin.previous')}
                                        </button>
                                        <span className="align-self-center text-muted small">
                                            {t('admin.page_of')
                                                .replace('{current}', currentPage)
                                                .replace('{total}', totalPages)}
                                        </span>
                                        <button
                                            className="btn-custom bg-light border"
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            {t('admin.next')}
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Create Permission Modal */}
            {showCreateModal && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{t('admin.create_permission')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowCreateModal(false)}
                                ></button>
                            </div>
                            <form onSubmit={handleCreatePermission}>
                                <div className="modal-body">
                                    {loadingUsers ? (
                                        <div className="text-center py-4">
                                            <div className="spinner-border text-primary"></div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">
                                                    {t('admin.requester')}
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={selectedRequester}
                                                    onChange={(e) => setSelectedRequester(e.target.value)}
                                                    required
                                                >
                                                    <option value="">{t('admin.select_requester')}</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>
                                                            {u.name} {u.surname} ({u.email})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label fw-bold">
                                                    {t('admin.target')}
                                                </label>
                                                <select
                                                    className="form-select"
                                                    value={selectedTarget}
                                                    onChange={(e) => setSelectedTarget(e.target.value)}
                                                    required
                                                >
                                                    <option value="">{t('admin.select_target')}</option>
                                                    {users
                                                        .filter(u => u.id !== parseInt(selectedRequester))
                                                        .map(u => (
                                                            <option key={u.id} value={u.id}>
                                                                {u.name} {u.surname} ({u.email})
                                                            </option>
                                                        ))}
                                                </select>
                                            </div>
                                            <div className="alert alert-info small mb-0">
                                                <i className="bi bi-info-circle me-2"></i>
                                                {t('admin.create_permission_info')}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn-custom bg-light border"
                                        onClick={() => setShowCreateModal(false)}
                                        disabled={creating}
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-custom bg-primary text-white"
                                        disabled={creating || !selectedRequester || !selectedTarget}
                                    >
                                        {creating ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2"></span>
                                                {t('common.creating')}
                                            </>
                                        ) : (
                                            t('admin.create_permission')
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && permissionToDelete && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header border-0">
                                <h5 className="modal-title">{t('admin.confirm_delete')}</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowDeleteConfirm(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p className="mb-2">{t('admin.confirm_delete_permission')}</p>
                                <div className="border rounded p-3 bg-light">
                                    <div className="mb-2">
                                        <strong>{t('admin.requester')}:</strong> {permissionToDelete.requester.name} ({permissionToDelete.requester.email})
                                    </div>
                                    <div>
                                        <strong>{t('admin.target')}:</strong> {permissionToDelete.target.name} ({permissionToDelete.target.email})
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-0">
                                <button
                                    type="button"
                                    className="btn-custom bg-light border"
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    type="button"
                                    className="btn-custom bg-danger text-white"
                                    onClick={confirmDelete}
                                    disabled={deleting}
                                >
                                    {deleting ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2"></span>
                                            {t('common.deleting')}
                                        </>
                                    ) : (
                                        <>
                                            <i className="bi bi-trash me-1"></i>
                                            {t('admin.delete')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminFamilyRelationships;
